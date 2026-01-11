/**
 * Content Learning System
 * Learns from user preferences to improve future content generation
 */

import { Store } from './store'

/**
 * Inappropriate words and phrases that should NEVER be generated
 * Includes both explicit words and contextual phrases that are inappropriate
 */
export const INAPPROPRIATE_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'pussy', 'dick', 'cunt', 
  'loser', 'stupid', 'idiot', 'moron', 'retard', 'fag', 'faggot', 'nigger', 
  'nigga', 'whore', 'slut', 'bastard', 'crap', 'piss', 'pissed',
  'jews', 'jew', 'golddigger', 'golddiggers', 'gold digger', 'gold diggers'
]

/**
 * Contextual phrases that are ONLY inappropriate when used with explicit inappropriate words
 * These are slang phrases that are unprofessional but only truly inappropriate when combined with profanity
 */
export const SLANG_PHRASES = [
  'no cap', 'fr fr', 'deadass', 'on god'
]

/**
 * Check if content contains inappropriate words or phrases
 * Only flags explicit profanity and offensive language - not common marketing phrases
 * Uses word boundaries to avoid false positives (e.g., "hell" won't match "hello")
 */
export function containsInappropriateContent(content: string): boolean {
  const contentLower = content.toLowerCase()
  
  // Check for explicit inappropriate words (profanity, slurs, offensive terms)
  // Use word boundaries to avoid matching partial words (e.g., "hell" in "hello")
  const foundInappropriateWord = INAPPROPRIATE_WORDS.find(word => {
    // Create regex with word boundaries to match whole words only
    const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    return wordRegex.test(contentLower)
  })
  
  if (foundInappropriateWord) {
    console.error(`[Inappropriate Check] Found explicit inappropriate word: "${foundInappropriateWord}" in content:`, content.substring(0, 200))
    return true
  }
  
  // Only check slang phrases if they appear with inappropriate words nearby
  // This prevents false positives from legitimate marketing content
  const foundSlang = SLANG_PHRASES.find(phrase => {
    // Use word boundaries for phrases too
    const phraseRegex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (phraseRegex.test(contentLower)) {
      const phraseIndex = contentLower.search(phraseRegex)
      const contextBefore = contentLower.substring(Math.max(0, phraseIndex - 100), phraseIndex)
      const contextAfter = contentLower.substring(phraseIndex + phrase.length, Math.min(contentLower.length, phraseIndex + phrase.length + 100))
      
      // ONLY flag if there's an explicit inappropriate word nearby (with word boundaries)
      const nearbyInappropriate = INAPPROPRIATE_WORDS.find(word => {
        const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        return wordRegex.test(contextBefore) || wordRegex.test(contextAfter)
      })
      
      if (nearbyInappropriate) {
        console.error(`[Inappropriate Check] Found slang phrase "${phrase}" with inappropriate word "${nearbyInappropriate}" nearby`)
        return true
      }
    }
    return false
  })
  
  if (foundSlang) {
    return true
  }
  
  // Log if we're checking content (for debugging false positives)
  console.log(`[Inappropriate Check] Content passed check. Length: ${content.length}, Preview:`, content.substring(0, 100))
  
  return false
}

export interface ContentPreference {
  content: string
  contentType: 'post' | 'email' | 'ad'
  platform: string
  timestamp?: string
  acceptedAt?: string
  prompt: string
  // AI analysis results (if API key available)
  aiPreferences?: Partial<LearnedStyle> // AI-extracted preferences
  aiInsights?: string[] // AI insights about style patterns
  ruleBasedPreferences?: any // Rule-based analysis (fallback)
}

export interface ContentEdit {
  originalContent: string
  editedContent: string
  contentType: 'post' | 'email' | 'ad'
  platform: string
  editedAt: string
  prompt: string
  editType?: 'addition' | 'removal' | 'replacement' | 'reordering'
  editedSections?: string[]
  removedText?: string[] // Specific text that was removed
  addedText?: string[] // Specific text that was added
  modifiedText?: Array<{ original: string; modified: string }> // Text that was changed/modified
  // Stored AI analysis results (so we don't need to re-analyze)
  aiInsights?: string[] // What the AI learned from this edit
  aiPreferences?: Partial<LearnedStyle> // Preferences learned from this edit
  aiIssues?: string[] // Issues to avoid based on this edit
  whyBetter?: string // Why the edited version is better (from AI analysis)
  aiAnalysisFailed?: boolean // True if AI analysis failed (e.g., quota exceeded)
  aiAnalysisError?: string // Error message if AI analysis failed
}

export interface LearnedStyle {
  tone?: string[]
  length?: 'short' | 'medium' | 'long'
  hashtagUsage?: 'none' | 'minimal' | 'moderate' | 'heavy'
  emojiUsage?: 'none' | 'minimal' | 'moderate'
  ctaStyle?: string[]
  structure?: string[]
}

/**
 * Analyze accepted content to learn user preferences
 */
export function learnFromAcceptedContent(acceptedContent: ContentPreference[]): LearnedStyle {
  if (acceptedContent.length === 0) {
    return {}
  }

  const styles: LearnedStyle = {
    tone: [],
    ctaStyle: [],
    structure: [],
  }

  // Analyze content length
  const lengths = acceptedContent.map(c => {
    const wordCount = c.content.split(/\s+/).length
    if (wordCount < 50) return 'short'
    if (wordCount < 150) return 'medium'
    return 'long'
  })
  const mostCommonLength = lengths.reduce((a, b, _, arr) => 
    arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
  ) as 'short' | 'medium' | 'long'
  styles.length = mostCommonLength

  // Analyze hashtag usage
  const hashtagCounts = acceptedContent.map(c => {
    const matches = c.content.match(/#\w+/g) || []
    return matches.length
  })
  const avgHashtags = hashtagCounts.reduce((a, b) => a + b, 0) / hashtagCounts.length
  if (avgHashtags === 0) styles.hashtagUsage = 'none'
  else if (avgHashtags < 2) styles.hashtagUsage = 'minimal'
  else if (avgHashtags < 5) styles.hashtagUsage = 'moderate'
  else styles.hashtagUsage = 'heavy'

  // Analyze emoji usage
  const emojiCounts = acceptedContent.map(c => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
    const matches = c.content.match(emojiRegex) || []
    return matches.length
  })
  const avgEmojis = emojiCounts.reduce((a, b) => a + b, 0) / emojiCounts.length
  if (avgEmojis === 0) styles.emojiUsage = 'none'
  else if (avgEmojis < 2) styles.emojiUsage = 'minimal'
  else styles.emojiUsage = 'moderate'

  // Analyze tone (simple keyword-based analysis)
  const toneKeywords = {
    professional: ['professional', 'business', 'company', 'enterprise', 'corporate'],
    friendly: ['friendly', 'warm', 'welcoming', 'hello', 'hi', 'thanks'],
    casual: ['casual', 'hey', 'cool', 'awesome', 'amazing'],
    formal: ['formal', 'dear', 'sincerely', 'respectfully'],
    enthusiastic: ['excited', 'thrilled', 'amazing', 'incredible', 'fantastic', '!'],
  }

  const detectedTones: string[] = []
  acceptedContent.forEach(c => {
    const lowerContent = c.content.toLowerCase()
    Object.entries(toneKeywords).forEach(([tone, keywords]) => {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        if (!detectedTones.includes(tone)) {
          detectedTones.push(tone)
        }
      }
    })
  })
  styles.tone = detectedTones

  // Analyze CTA patterns
  const ctaPatterns = ['click', 'learn more', 'get started', 'sign up', 'buy now', 'shop now', 'download', 'try', 'visit']
  const detectedCTAs: string[] = []
  acceptedContent.forEach(c => {
    const lowerContent = c.content.toLowerCase()
    ctaPatterns.forEach(pattern => {
      if (lowerContent.includes(pattern) && !detectedCTAs.includes(pattern)) {
        detectedCTAs.push(pattern)
      }
    })
  })
  styles.ctaStyle = detectedCTAs

  return styles
}

/**
 * SUPERSMART: Aggregate preferences from multiple edits using weighted voting
 * More recent edits have higher weight, but all edits contribute
 * This makes the AI learn from ALL your edits, not just the latest one
 */
function aggregatePreferencesFromEdits(
  editPreferences: Partial<LearnedStyle>[],
  totalEdits: number
): Partial<LearnedStyle> {
  if (editPreferences.length === 0) {
    return {}
  }

  const aggregated: Partial<LearnedStyle> = {}

  // Weight: most recent edit gets highest weight, older edits get progressively less
  // But ALL edits contribute - this is the "supersmart" part!
  // Formula: weight = position from end (most recent = highest)
  const weights = editPreferences.map((_, index) => {
    const position = editPreferences.length - index // Most recent = highest weight
    return position
  })
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  
  console.log(`[Learning] Aggregating preferences from ${editPreferences.length} edits with weighted voting`)

  // Aggregate length (weighted voting)
  const lengthVotes = new Map<'short' | 'medium' | 'long', number>()
  editPreferences.forEach((prefs, index) => {
    if (prefs.length) {
      const weight = weights[index]
      lengthVotes.set(prefs.length, (lengthVotes.get(prefs.length) || 0) + weight)
    }
  })
  if (lengthVotes.size > 0) {
    const mostVoted = Array.from(lengthVotes.entries())
      .sort((a, b) => b[1] - a[1])[0][0]
    aggregated.length = mostVoted
  }

  // Aggregate hashtag usage (weighted voting)
  const hashtagVotes = new Map<'minimal' | 'moderate' | 'heavy' | 'none', number>()
  editPreferences.forEach((prefs, index) => {
    if (prefs.hashtagUsage) {
      const weight = weights[index]
      hashtagVotes.set(prefs.hashtagUsage, (hashtagVotes.get(prefs.hashtagUsage) || 0) + weight)
    }
  })
  if (hashtagVotes.size > 0) {
    const mostVoted = Array.from(hashtagVotes.entries())
      .sort((a, b) => b[1] - a[1])[0][0]
    aggregated.hashtagUsage = mostVoted
  }

  // Aggregate emoji usage (weighted voting)
  const emojiVotes = new Map<'none' | 'minimal' | 'moderate', number>()
  editPreferences.forEach((prefs, index) => {
    if (prefs.emojiUsage) {
      const weight = weights[index]
      emojiVotes.set(prefs.emojiUsage, (emojiVotes.get(prefs.emojiUsage) || 0) + weight)
    }
  })
  if (emojiVotes.size > 0) {
    const mostVoted = Array.from(emojiVotes.entries())
      .sort((a, b) => b[1] - a[1])[0][0]
    aggregated.emojiUsage = mostVoted
  }

  // Aggregate tone (collect all unique tones, weighted by frequency)
  const toneVotes = new Map<string, number>()
  editPreferences.forEach((prefs, index) => {
    if (prefs.tone && Array.isArray(prefs.tone)) {
      const weight = weights[index]
      prefs.tone.forEach(tone => {
        toneVotes.set(tone, (toneVotes.get(tone) || 0) + weight)
      })
    }
  })
  if (toneVotes.size > 0) {
    // Get top tones by weighted votes (at least 20% of total weight to be included)
    const threshold = totalWeight * 0.2
    const topTones = Array.from(toneVotes.entries())
      .filter(([_, votes]) => votes >= threshold)
      .sort((a, b) => b[1] - a[1])
      .map(([tone]) => tone)
      .slice(0, 5) // Max 5 tones
    if (topTones.length > 0) {
      aggregated.tone = topTones
    }
  }

  // Aggregate CTA style (collect all unique CTAs, weighted by frequency)
  const ctaVotes = new Map<string, number>()
  editPreferences.forEach((prefs, index) => {
    if (prefs.ctaStyle && Array.isArray(prefs.ctaStyle)) {
      const weight = weights[index]
      prefs.ctaStyle.forEach(cta => {
        ctaVotes.set(cta, (ctaVotes.get(cta) || 0) + weight)
      })
    }
  })
  if (ctaVotes.size > 0) {
    const threshold = totalWeight * 0.15
    const topCTAs = Array.from(ctaVotes.entries())
      .filter(([_, votes]) => votes >= threshold)
      .sort((a, b) => b[1] - a[1])
      .map(([cta]) => cta)
      .slice(0, 5)
    if (topCTAs.length > 0) {
      aggregated.ctaStyle = topCTAs
    }
  }

  // Aggregate structure (collect all unique structures, weighted by frequency)
  const structureVotes = new Map<string, number>()
  editPreferences.forEach((prefs, index) => {
    if (prefs.structure && Array.isArray(prefs.structure)) {
      const weight = weights[index]
      prefs.structure.forEach(struct => {
        structureVotes.set(struct, (structureVotes.get(struct) || 0) + weight)
      })
    }
  })
  if (structureVotes.size > 0) {
    const threshold = totalWeight * 0.15
    const topStructures = Array.from(structureVotes.entries())
      .filter(([_, votes]) => votes >= threshold)
      .sort((a, b) => b[1] - a[1])
      .map(([struct]) => struct)
      .slice(0, 5)
    if (topStructures.length > 0) {
      aggregated.structure = topStructures
    }
  }

  return aggregated
}

/**
 * Merge tone preferences from edits and existing style
 */
function mergeTonePreferences(
  editTones?: string[],
  existingTones?: string[]
): string[] | undefined {
  if (!editTones && !existingTones) return undefined
  if (!editTones) return existingTones
  if (!existingTones) return editTones

  // Combine and deduplicate, prioritize edit tones (they're more recent/active)
  const combined = [...editTones, ...existingTones]
  return Array.from(new Set(combined)).slice(0, 5)
}

/**
 * Merge array preferences (CTA style, structure, etc.)
 */
function mergeArrayPreferences(
  editArray?: string[],
  existingArray?: string[]
): string[] | undefined {
  if (!editArray && !existingArray) return undefined
  if (!editArray) return existingArray
  if (!existingArray) return editArray

  // Combine and deduplicate, prioritize edit preferences
  const combined = [...editArray, ...existingArray]
  return Array.from(new Set(combined)).slice(0, 5)
}

/**
 * Find removed text - shows complete sentences/phrases that were removed
 * Tries to find complete sentences, not just fragments
 */
function findRemovedText(original: string, edited: string): string[] {
  const removed: string[] = []
  
  // Split into sentences first (by periods, exclamation, question marks, or line breaks)
  const sentenceEnders = /[.!?]\s+|\n+/
  const originalSentences = original.split(sentenceEnders).filter(s => s.trim().length > 0)
  const editedLower = edited.toLowerCase()
  
  // Check each sentence from original - if it doesn't appear in edited, it was removed
  for (const sentence of originalSentences) {
    const sentenceTrimmed = sentence.trim()
    if (sentenceTrimmed.length < 3) continue // Skip very short fragments
    
    const sentenceLower = sentenceTrimmed.toLowerCase()
    
    // Check if this sentence (or a close match) appears in edited
    // Allow for some flexibility (case-insensitive, punctuation variations)
    const sentenceWords = sentenceLower.split(/\s+/).filter(w => w.length > 0)
    const sentenceCore = sentenceWords.join(' ') // Core words without punctuation
    
    // Check if the core sentence appears in edited
    if (!editedLower.includes(sentenceCore) && sentenceCore.length > 5) {
      // This sentence was removed - add it
      removed.push(sentenceTrimmed)
    }
  }
  
  // If we didn't find complete sentences, fall back to phrase-level diff
  if (removed.length === 0) {
    // Split into words for comparison
    const originalWords = original.split(/\s+/).filter(w => w.trim().length > 0)
    const editedWords = edited.split(/\s+/).filter(w => w.trim().length > 0)
    
    // Create a map: word -> count in edited (to handle duplicates)
    const editedWordCounts = new Map<string, number>()
    editedWords.forEach(word => {
      const wordLower = word.toLowerCase()
      editedWordCounts.set(wordLower, (editedWordCounts.get(wordLower) || 0) + 1)
    })
    
    // Track which edited words we've "used" (matched)
    const usedEditedWords = new Map<string, number>()
    
    // Find words in original that don't have a match in edited
    let i = 0
    while (i < originalWords.length) {
      const word = originalWords[i]
      const wordLower = word.toLowerCase()
      
      // Check if this word appears in edited (and we haven't used all instances)
      const availableInEdited = (editedWordCounts.get(wordLower) || 0) - (usedEditedWords.get(wordLower) || 0)
      
      if (availableInEdited > 0) {
        // This word exists in edited - mark it as used and move on
        usedEditedWords.set(wordLower, (usedEditedWords.get(wordLower) || 0) + 1)
        i++
      } else {
        // This word doesn't exist in edited - it was removed
        // Collect consecutive removed words to form a complete phrase
        let removedSequence: string[] = [word]
        i++
        
        while (i < originalWords.length) {
          const nextWord = originalWords[i]
          const nextWordLower = nextWord.toLowerCase()
          const nextAvailable = (editedWordCounts.get(nextWordLower) || 0) - (usedEditedWords.get(nextWordLower) || 0)
          
          if (nextAvailable > 0) {
            // Next word exists in edited, stop collecting
            break
          } else {
            // Next word also removed, add to sequence
            removedSequence.push(nextWord)
            i++
          }
        }
        
        // Only add if meaningful (has letters, not just punctuation)
        const removedText = removedSequence.join(' ')
        if (removedText.length >= 2 && /[a-zA-Z]/.test(removedText)) {
          removed.push(removedText)
        }
      }
    }
  }
  
  // Return unique removals, limit to 5
  return removed
    .filter((item, index, self) => 
      index === self.findIndex(t => t.toLowerCase() === item.toLowerCase())
    )
    .slice(0, 5)
}

/**
 * Find added text - shows complete sentences/phrases that were added
 * Tries to find complete sentences, not just fragments
 */
function findAddedText(original: string, edited: string): string[] {
  const added: string[] = []
  
  // Split into sentences first (by periods, exclamation, question marks, or line breaks)
  const sentenceEnders = /[.!?]\s+|\n+/
  const editedSentences = edited.split(sentenceEnders).filter(s => s.trim().length > 0)
  const originalLower = original.toLowerCase()
  
  // Check each sentence from edited - if it doesn't appear in original, it was added
  for (const sentence of editedSentences) {
    const sentenceTrimmed = sentence.trim()
    if (sentenceTrimmed.length < 3) continue // Skip very short fragments
    
    const sentenceLower = sentenceTrimmed.toLowerCase()
    
    // Check if this sentence (or a close match) appears in original
    // Allow for some flexibility (case-insensitive, punctuation variations)
    const sentenceWords = sentenceLower.split(/\s+/).filter(w => w.length > 0)
    const sentenceCore = sentenceWords.join(' ') // Core words without punctuation
    
    // Check if the core sentence appears in original
    if (!originalLower.includes(sentenceCore) && sentenceCore.length > 5) {
      // This sentence was added - add it
      added.push(sentenceTrimmed)
    }
  }
  
  // If we didn't find complete sentences, fall back to phrase-level diff
  if (added.length === 0) {
    // Split into words for comparison
    const originalWords = original.split(/\s+/).filter(w => w.trim().length > 0)
    const editedWords = edited.split(/\s+/).filter(w => w.trim().length > 0)
    
    // Create a map: word -> count in original (to handle duplicates)
    const originalWordCounts = new Map<string, number>()
    originalWords.forEach(word => {
      const wordLower = word.toLowerCase()
      originalWordCounts.set(wordLower, (originalWordCounts.get(wordLower) || 0) + 1)
    })
    
    // Track which original words we've "used" (matched)
    const usedOriginalWords = new Map<string, number>()
    
    // Find words in edited that don't have a match in original
    let i = 0
    while (i < editedWords.length) {
      const word = editedWords[i]
      const wordLower = word.toLowerCase()
      
      // Check if this word appears in original (and we haven't used all instances)
      const availableInOriginal = (originalWordCounts.get(wordLower) || 0) - (usedOriginalWords.get(wordLower) || 0)
      
      if (availableInOriginal > 0) {
        // This word exists in original - mark it as used and move on
        usedOriginalWords.set(wordLower, (usedOriginalWords.get(wordLower) || 0) + 1)
        i++
      } else {
        // This word doesn't exist in original - it was added
        // Collect consecutive added words to form a complete phrase
        let addedSequence: string[] = [word]
        i++
        
        while (i < editedWords.length) {
          const nextWord = editedWords[i]
          const nextWordLower = nextWord.toLowerCase()
          const nextAvailable = (originalWordCounts.get(nextWordLower) || 0) - (usedOriginalWords.get(nextWordLower) || 0)
          
          if (nextAvailable > 0) {
            // Next word exists in original, stop collecting
            break
          } else {
            // Next word also added, add to sequence
            addedSequence.push(nextWord)
            i++
          }
        }
        
        // Only add if meaningful (has letters, not just punctuation)
        const addedText = addedSequence.join(' ')
        if (addedText.length >= 2 && /[a-zA-Z]/.test(addedText)) {
          added.push(addedText)
        }
      }
    }
  }
  
  // Return unique additions, limit to 5
  return added
    .filter((item, index, self) => 
      index === self.findIndex(t => t.toLowerCase() === item.toLowerCase())
    )
    .slice(0, 5)
}

/**
 * Find modified/replaced text by comparing original and edited content
 * Returns ONLY the specific text that was replaced, not entire sentences
 */
function findModifiedText(original: string, edited: string): Array<{ original: string; modified: string }> {
  const modifications: Array<{ original: string; modified: string }> = []
  
  // Get the removed and added text first
  const removedText = findRemovedText(original, edited)
  const addedText = findAddedText(original, edited)
  
  // Find pairs where removed text was likely replaced by added text
  // If we have both removed and added text, they're likely modifications
  // Match them by position in the content
  removedText.forEach(removed => {
    // Find where this removed text appears in original
    const removedLower = removed.toLowerCase()
    const removedIndex = original.toLowerCase().indexOf(removedLower)
    
    if (removedIndex === -1) return
    
    // Look for added text that appears near this position in edited
    addedText.forEach(added => {
      const addedLower = added.toLowerCase()
      const addedIndex = edited.toLowerCase().indexOf(addedLower)
      
      if (addedIndex === -1) return
      
      // Check if the added text appears in a similar relative position
      // Calculate relative position (0.0 to 1.0)
      const originalLength = original.length
      const editedLength = edited.length
      const removedRelativePos = originalLength > 0 ? removedIndex / originalLength : 0
      const addedRelativePos = editedLength > 0 ? addedIndex / editedLength : 0
      
      // If positions are similar (within 20% of content length), it's likely a replacement
      const positionDiff = Math.abs(removedRelativePos - addedRelativePos)
      
      // Also check if the text before/after is similar
      const originalBeforeRemoved = original.substring(0, removedIndex).toLowerCase()
      const editedBeforeAdded = edited.substring(0, addedIndex).toLowerCase()
      const beforeSimilarity = calculateSimilarity(originalBeforeRemoved, editedBeforeAdded)
      
      const originalAfterRemoved = original.substring(removedIndex + removed.length).toLowerCase()
      const editedAfterAdded = edited.substring(addedIndex + added.length).toLowerCase()
      const afterSimilarity = calculateSimilarity(originalAfterRemoved, editedAfterAdded)
      
      // If positions are similar OR context is similar, this is a replacement
      // Lower the threshold to catch more modifications
      if (positionDiff < 0.2 || (beforeSimilarity > 0.2 && afterSimilarity > 0.2)) {
        // Check if we already have this modification
        const alreadyExists = modifications.some(m => 
          m.original.toLowerCase() === removedLower && m.modified.toLowerCase() === addedLower
        )
        
        if (!alreadyExists) {
          modifications.push({
            original: removed,
            modified: added
          })
        }
      }
    })
  })
  
  // If we still don't have modifications but have both removed and added text,
  // pair them up (most common case: one removed, one added = modification)
  if (modifications.length === 0 && removedText.length > 0 && addedText.length > 0) {
    // Pair up removed and added text (simple 1-to-1 matching)
    const maxPairs = Math.min(removedText.length, addedText.length)
    for (let i = 0; i < maxPairs; i++) {
      modifications.push({
        original: removedText[i],
        modified: addedText[i]
      })
    }
  }
  
  // If we didn't find clear replacements, try word-by-word diff to find modified phrases
  if (modifications.length === 0) {
    const originalWords = original.split(/\s+/).filter(w => w.length > 0)
    const editedWords = edited.split(/\s+/).filter(w => w.length > 0)
    
    // Find word sequences that changed (similar position, different words)
    for (let i = 0; i < Math.min(originalWords.length, editedWords.length); i++) {
      const origWord = originalWords[i].toLowerCase()
      const editWord = editedWords[i].toLowerCase()
      
      // If words are different but similar length, might be a modification
      if (origWord !== editWord && 
          Math.abs(origWord.length - editWord.length) < 5 &&
          origWord.length > 2 && editWord.length > 2) {
        
        // Check if surrounding context is similar (it's a replacement, not insertion/deletion)
        const contextBefore = i > 0 ? originalWords[i - 1].toLowerCase() : ''
        const contextAfter = i < originalWords.length - 1 ? originalWords[i + 1].toLowerCase() : ''
        
        const editContextBefore = i > 0 ? editedWords[i - 1].toLowerCase() : ''
        const editContextAfter = i < editedWords.length - 1 ? editedWords[i + 1].toLowerCase() : ''
        
        if (contextBefore === editContextBefore && contextAfter === editContextAfter) {
          // Same context, different word = modification
          const alreadyExists = modifications.some(m => 
            m.original.toLowerCase() === origWord && m.modified.toLowerCase() === editWord
          )
          
          if (!alreadyExists && modifications.length < 3) {
            modifications.push({
              original: originalWords[i],
              modified: editedWords[i]
            })
          }
        }
      }
    }
  }
  
  return modifications.slice(0, 3) // Limit to top 3 modifications
}

/**
 * Extract meaningful phrases (n words) from text
 */
function extractPhrases(text: string, phraseLength: number = 3): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const phrases: string[] = []
  
  for (let i = 0; i <= words.length - phraseLength; i++) {
    phrases.push(words.slice(i, i + phraseLength).join(' '))
  }
  
  return phrases
}

/**
 * Calculate similarity between two strings (simple Jaccard similarity)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/))
  const words2 = new Set(str2.toLowerCase().split(/\s+/))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

/**
 * Analyze edits to learn what users change and why
 */
export function analyzeEdit(edit: ContentEdit): {
  changes: string[]
  preferences: Partial<LearnedStyle>
  issues: string[]
  removedText?: string[]
  addedText?: string[]
  modifiedText?: Array<{ original: string; modified: string }>
} {
  const original = edit.originalContent.toLowerCase()
  const edited = edit.editedContent.toLowerCase()
  
  // CRITICAL: Check FIRST if inappropriate content was ADDED - if so, don't learn from this
  const originalHasInappropriate = containsInappropriateContent(original)
  const editedHasInappropriate = containsInappropriateContent(edited)
  
  // If inappropriate content was ADDED (not in original, but in edited), stop immediately
  const hasInappropriateAdded = !originalHasInappropriate && editedHasInappropriate
  
  if (hasInappropriateAdded) {
    // User added inappropriate content - don't learn from this at all
    // But still show what was added/removed so user can see the full edit
    const removedText = findRemovedText(edit.originalContent, edit.editedContent)
    const addedText = findAddedText(edit.originalContent, edit.editedContent)
    const modifiedText = findModifiedText(edit.originalContent, edit.editedContent)
    return {
      changes: ['User added inappropriate content - not learning from this'],
      preferences: {},
      issues: ['User added inappropriate/profane content - DO NOT generate such content'],
      removedText: removedText.length > 0 ? removedText : undefined,
      addedText: addedText.length > 0 ? addedText : undefined,
      modifiedText: modifiedText.length > 0 ? modifiedText : undefined
    }
  }
  
  // Check for sensitive content - only block if it's in the EDITED content (user added it)
  // If user REMOVED sensitive content, that's actually good and we should learn from it
  // Use word boundaries to avoid false positives (e.g., "curious" shouldn't match "cancer")
  const sensitiveKeywords = [
    'dead', 'died', 'death', 'cancer', 'sick', 'ill', 'hospital', 'funeral', 
    'grief', 'mourning', 'grandmother', 'grandfather', 'family member', 
    'passed away', 'suicide', 'depression', 'anxiety', 'trauma'
  ]
  
  // More precise matching: check for whole words/phrases, not substrings
  const originalHasSensitive = sensitiveKeywords.some(keyword => {
    // For multi-word phrases, check exact phrase
    if (keyword.includes(' ')) {
      return original.includes(keyword)
    }
    // For single words, use word boundary regex to avoid false matches
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    return regex.test(original)
  })
  
  const editedHasSensitive = sensitiveKeywords.some(keyword => {
    // For multi-word phrases, check exact phrase
    if (keyword.includes(' ')) {
      return edited.includes(keyword)
    }
    // For single words, use word boundary regex to avoid false matches
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    return regex.test(edited)
  })
  
  const changes: string[] = []
  const preferences: Partial<LearnedStyle> = {}
  const issues: string[] = []
  
  // Find specific text that was removed, added, or modified
  const removedText = findRemovedText(edit.originalContent, edit.editedContent)
  const addedText = findAddedText(edit.originalContent, edit.editedContent)
  const modifiedText = findModifiedText(edit.originalContent, edit.editedContent)
  
  // Only block learning if sensitive content is in the EDITED content (user added it)
  // If user removed sensitive content, that's a positive pattern we should learn from
  if (editedHasSensitive) {
    changes.push('Personal/sensitive content detected in edited content - not used for marketing learning')
    return { changes, preferences: {}, issues: [], removedText, addedText, modifiedText }
  }
  
  // If user removed sensitive content, mark it as a positive change
  if (originalHasSensitive && !editedHasSensitive) {
    changes.push('User removed personal/sensitive content - this is a positive pattern')
    issues.push('Original content contained personal/sensitive information')
    preferences.tone = [...(preferences.tone || []).filter(t => t !== 'personal'), 'professional', 'appropriate']
  }

  // Detect length changes (lowered threshold to catch more changes)
  const originalWords = edit.originalContent.split(/\s+/).length
  const editedWords = edit.editedContent.split(/\s+/).length
  const wordDiff = Math.abs(originalWords - editedWords)
  if (wordDiff > 5) { // Lowered from 10 to 5
    if (editedWords < originalWords) {
      const reductionPercent = Math.round((wordDiff / originalWords) * 100)
      if (reductionPercent > 20) {
        changes.push(`User shortened content significantly (removed ${wordDiff} words, ${reductionPercent}% reduction)`)
        preferences.length = 'short'
        issues.push('Content was too long')
      } else {
        changes.push(`User shortened content (removed ${wordDiff} words)`)
        if (!preferences.length) preferences.length = 'short'
      }
    } else if (editedWords > originalWords) {
      const expansionPercent = Math.round((wordDiff / originalWords) * 100)
      if (expansionPercent > 20) {
        changes.push(`User expanded content significantly (added ${wordDiff} words, ${expansionPercent}% increase)`)
        preferences.length = 'long'
        issues.push('Content was too short')
      } else {
        changes.push(`User expanded content (added ${wordDiff} words)`)
        if (!preferences.length) preferences.length = 'long'
      }
    }
  } else if (wordDiff > 0) {
    // Even small changes should be noted
    if (editedWords < originalWords) {
      changes.push(`User removed ${wordDiff} word${wordDiff > 1 ? 's' : ''}`)
    } else {
      changes.push(`User added ${wordDiff} word${wordDiff > 1 ? 's' : ''}`)
    }
  }

  // Detect hashtag changes
  const originalHashtags = (edit.originalContent.match(/#\w+/g) || []).length
  const editedHashtags = (edit.editedContent.match(/#\w+/g) || []).length
  if (originalHashtags !== editedHashtags) {
    if (editedHashtags < originalHashtags) {
      changes.push('User removed hashtags')
      preferences.hashtagUsage = 'minimal'
      issues.push('Too many hashtags')
    } else if (editedHashtags > originalHashtags) {
      changes.push('User added hashtags')
      preferences.hashtagUsage = 'heavy'
      issues.push('Not enough hashtags')
    }
  }

  // Detect emoji changes (only actual emojis, not punctuation)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
  const originalEmojis = (edit.originalContent.match(emojiRegex) || []).length
  const editedEmojis = (edit.editedContent.match(emojiRegex) || []).length
  // Only report emoji changes if there's a significant difference (not just 1-2 emojis)
  if (Math.abs(originalEmojis - editedEmojis) > 0) {
    if (editedEmojis < originalEmojis && originalEmojis > 0) {
      changes.push('User removed emojis')
      preferences.emojiUsage = 'none'
      issues.push('Too many emojis')
    } else if (editedEmojis > originalEmojis && editedEmojis > 0) {
      changes.push('User added emojis')
      preferences.emojiUsage = 'moderate'
      issues.push('Not enough emojis')
    }
  }

  // Detect tone changes (keyword-based)
  const formalKeywords = ['dear', 'sincerely', 'respectfully', 'regards']
  const casualKeywords = ['hey', 'hi', 'thanks', 'awesome', 'cool']
  const professionalKeywords = ['professional', 'business', 'company', 'enterprise']
  
  const originalHasFormal = formalKeywords.some(k => original.includes(k))
  const editedHasFormal = formalKeywords.some(k => edited.includes(k))
  const originalHasCasual = casualKeywords.some(k => original.includes(k))
  const editedHasCasual = casualKeywords.some(k => edited.includes(k))
  const originalHasProfessional = professionalKeywords.some(k => original.includes(k))
  const editedHasProfessional = professionalKeywords.some(k => edited.includes(k))

  if (originalHasFormal && !editedHasFormal) {
    changes.push('User made tone less formal')
    issues.push('Tone was too formal')
    // Learn: user prefers less formal tone
    if (!preferences.tone) preferences.tone = []
    if (!preferences.tone.includes('friendly')) {
      preferences.tone = [...preferences.tone.filter(t => t !== 'formal'), 'friendly']
    }
  }
  if (!originalHasCasual && editedHasCasual) {
    changes.push('User made tone more casual')
    preferences.tone = ['friendly', 'casual']
  }
  if (!originalHasProfessional && editedHasProfessional) {
    changes.push('User made tone more professional')
    preferences.tone = ['professional']
  }

  // Detect CTA changes
  const ctaPatterns = ['click', 'learn more', 'get started', 'sign up', 'buy now', 'shop now', 'download', 'try', 'visit']
  const originalHasCTA = ctaPatterns.some(p => original.includes(p))
  const editedHasCTA = ctaPatterns.some(p => edited.includes(p))
  
  if (!originalHasCTA && editedHasCTA) {
    changes.push('User added call-to-action')
    issues.push('Missing call-to-action')
    // Learn: user prefers content with CTAs
    if (!preferences.ctaStyle) preferences.ctaStyle = []
    preferences.ctaStyle.push('include call-to-action')
  }
  if (originalHasCTA && !editedHasCTA) {
    changes.push('User removed call-to-action')
    issues.push('Call-to-action was too pushy')
    // Learn: user prefers content without pushy CTAs
    if (!preferences.ctaStyle) preferences.ctaStyle = []
    if (!preferences.ctaStyle.includes('avoid pushy CTAs')) {
      preferences.ctaStyle.push('avoid pushy CTAs')
    }
  }

  // Detect structural changes (line breaks, paragraphs)
  const originalLines = edit.originalContent.split('\n').length
  const editedLines = edit.editedContent.split('\n').length
  if (Math.abs(originalLines - editedLines) > 2) {
    if (editedLines > originalLines) {
      changes.push('User added more structure/line breaks')
      issues.push('Content lacked structure')
      // Learn: user prefers more structure
      if (!preferences.structure) preferences.structure = []
      if (!preferences.structure.includes('use line breaks for readability')) {
        preferences.structure.push('use line breaks for readability')
      }
    } else {
      changes.push('User removed line breaks')
      issues.push('Content had too much structure')
      // Learn: user prefers less structure, more compact content
      if (!preferences.structure) preferences.structure = []
      if (!preferences.structure.includes('avoid excessive line breaks')) {
        preferences.structure.push('avoid excessive line breaks')
      }
      if (!preferences.structure.includes('prefer compact formatting')) {
        preferences.structure.push('prefer compact formatting')
      }
    }
  }

  // Always provide insights about removed/added/modified text
  // This ensures we always have meaningful changes to show
  if (removedText.length > 0 && changes.length === 0) {
    // If no specific patterns detected but text was removed, provide basic insight
    const removedWords = removedText.join(' ').split(/\s+/).length
    if (removedWords > 10) {
      changes.push(`User removed a significant portion of text (${removedWords} words)`)
    } else if (removedWords > 0) {
      changes.push(`User removed text (${removedWords} words)`)
    }
  }
  
  if (addedText.length > 0 && changes.length === 0) {
    // If no specific patterns detected but text was added, provide basic insight
    const addedWords = addedText.join(' ').split(/\s+/).length
    if (addedWords > 10) {
      changes.push(`User added a significant amount of text (${addedWords} words)`)
    } else if (addedWords > 0) {
      changes.push(`User added text (${addedWords} words)`)
    }
  }
  
  if (modifiedText.length > 0 && changes.length === 0) {
    // If no specific patterns detected but text was modified, provide basic insight
    changes.push(`User modified ${modifiedText.length} section${modifiedText.length > 1 ? 's' : ''} of text`)
  }
  
  // Analyze removed text for deeper patterns
  // Note: Inappropriate content check already happened at the start of this function
  if (removedText.length > 0) {
    const removedTextStr = removedText.join(' ').toLowerCase()
    
    // Detect content types that user removes
    const removedContentTypes: string[] = []
    
    // Check if user removed inappropriate content (GOOD - learn from this)
    // We already checked above that inappropriate wasn't added, so if it's in original but not edited, it was removed
    const hasInappropriateRemoved = originalHasInappropriate && !editedHasInappropriate
    
    if (hasInappropriateRemoved) {
      removedContentTypes.push('inappropriate content')
      changes.push('User removed inappropriate content - learning this is unacceptable')
      issues.push('User removed inappropriate/profane content - this type of content is never acceptable')
      preferences.tone = [...(preferences.tone || []).filter(t => t !== 'casual' && t !== 'edgy'), 'professional', 'appropriate']
      preferences.structure = [...(preferences.structure || []).filter(s => !s.includes('inappropriate')), 'avoid inappropriate language', 'maintain professional tone']
    }
    
    // Marketing/hype language
    const hypeWords = ['revolutionary', 'game-changing', 'cutting-edge', 'next-level', 'breakthrough', 'innovative', 'groundbreaking', 'amazing', 'incredible', 'fantastic']
    if (hypeWords.some(word => removedTextStr.includes(word))) {
      removedContentTypes.push('hype language')
      issues.push('User dislikes marketing hype - avoid words like "revolutionary", "game-changing", "groundbreaking"')
      preferences.tone = [...(preferences.tone || []).filter(t => t !== 'enthusiastic'), 'authentic', 'genuine']
    }
    
    // Generic/vague statements - check if user REMOVED vague content (good pattern)
    const vaguePhrases = ['another week', 'great progress', 'exciting news', 'big announcement', 'stay tuned', 'coming soon', 'hello everybody', 'so glad to be back']
    if (vaguePhrases.some(phrase => removedTextStr.includes(phrase))) {
      removedContentTypes.push('vague statements')
      issues.push('User prefers specific details over vague statements')
      preferences.structure = [...(preferences.structure || []), 'be specific', 'avoid vague phrases']
    }
    
    // Repetitive patterns
    const repetitivePatterns = ['week of', 'another', 'here at', 'we are', 'our team']
    const repetitiveCount = repetitivePatterns.filter(pattern => {
      const regex = new RegExp(pattern, 'gi')
      return (removedTextStr.match(regex) || []).length > 1
    }).length
    if (repetitiveCount > 0) {
      issues.push('User removes repetitive phrases - vary language more')
    }
    
    // Exclamation marks
    const removedExclamations = removedText.filter(text => (text.match(/!/g) || []).length > 0).length
    if (removedExclamations > 0) {
      issues.push('User removes exclamation marks - prefer periods or no punctuation')
      preferences.emojiUsage = 'none' // Often correlated
    }
    
    // Questions
    const removedQuestions = removedText.filter(text => text.includes('?')).length
    if (removedQuestions > 0) {
      issues.push('User removes questions - prefer statements over questions')
      preferences.structure = [...(preferences.structure || []).filter(s => !s.includes('question')), 'use statements']
    }
    
    // Long sentences
    const avgRemovedLength = removedText.reduce((sum, text) => sum + text.split(/\s+/).length, 0) / removedText.length
    if (avgRemovedLength > 15) { // Lowered from 20 to 15
      issues.push('User removes long sentences - prefer shorter, punchier sentences')
      if (!preferences.length) preferences.length = 'short'
    }
    
    // Detect if removed text contains common marketing phrases
    const marketingPhrases = ['we are', 'we offer', 'we provide', 'our team', 'our company', 'we have', 'we can', 'we will']
    const removedMarketingPhrases = marketingPhrases.filter(phrase => removedTextStr.includes(phrase))
    if (removedMarketingPhrases.length > 0) {
      changes.push(`User removed marketing phrases: ${removedMarketingPhrases.slice(0, 2).join(', ')}`)
      preferences.tone = [...(preferences.tone || []).filter(t => t !== 'promotional'), 'authentic', 'direct']
    }
    
    // Detect if removed text is a complete sentence/phrase
    const removedSentences = removedText.filter(text => {
      const trimmed = text.trim()
      return trimmed.length > 10 && (trimmed.endsWith('.') || trimmed.endsWith('!') || trimmed.endsWith('?'))
    })
    if (removedSentences.length > 0 && !changes.some(c => c.includes('removed'))) {
      changes.push(`User removed ${removedSentences.length} complete sentence${removedSentences.length > 1 ? 's' : ''}`)
    }
    
    if (removedContentTypes.length > 0) {
      changes.push(`User removed: ${removedContentTypes.join(', ')}`)
    }
  }
  
  // Analyze added text for patterns (what user prefers to add)
  if (addedText.length > 0) {
    const addedTextStr = addedText.join(' ').toLowerCase()
    
    // Filter out highly personal/sensitive content that shouldn't be used for marketing learning
    // Check for sensitive content with word boundaries to avoid false positives
    const sensitiveKeywords = [
      'dead', 'died', 'death', 'cancer', 'sick', 'ill', 'hospital', 'funeral', 
      'grief', 'mourning', 'suicide', 'depression', 'anxiety', 'trauma'
    ]
    const addedTextLower = addedTextStr.toLowerCase()
    const isSensitiveContent = sensitiveKeywords.some(keyword => {
      // Use word boundary regex to avoid false matches (e.g., "curious" matching "cancer")
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      return regex.test(addedTextLower)
    })
    
    if (isSensitiveContent) {
      // Don't learn from highly personal/sensitive content - it's not marketing-related
      changes.push('User added personal/sensitive content (not used for marketing learning)')
      // Don't return early - still analyze other aspects like removed text, but skip personal reference learning
    } else {
    
    // Detect if user added personal/team references (marketing context)
    const marketingPersonalTouch = ['we', 'our', 'us', 'team', 'our team', 'we are', 'our company', 'dear', 'community', 'dear community']
    const hasMarketingPersonal = marketingPersonalTouch.some(phrase => addedTextStr.includes(phrase))
    
    // Only count "I" or "my" if it's in a business/marketing context, not personal life
    const businessContext = ['my business', 'my company', 'my brand', 'my product', 'my service']
    const hasBusinessContext = businessContext.some(phrase => addedTextStr.includes(phrase))
    
    // Also check for greeting patterns that indicate personal/relatable tone
    const greetingPatterns = ['dear', 'hello', 'hi', 'hey', 'greetings']
    const hasGreeting = greetingPatterns.some(pattern => addedTextStr.includes(pattern))
    
    if (hasMarketingPersonal || hasBusinessContext || hasGreeting) {
      changes.push('User added personal/team references or greetings')
      if (!preferences.tone) preferences.tone = []
      const newTone = [...preferences.tone.filter(t => t !== 'formal'), 'personal', 'relatable']
      preferences.tone = [...new Set(newTone)] // Remove duplicates
    }
    
    // Detect if user added inappropriate content (profanity, offensive language)
    const hasInappropriateAdded = containsInappropriateContent(addedTextStr)
    
    if (hasInappropriateAdded) {
      changes.push('User added inappropriate content - not learning from this')
      issues.push('User added inappropriate/profane content - DO NOT generate such content')
      // Don't set preferences - we're not learning from this
      return { changes, preferences: {}, issues, removedText, addedText, modifiedText }
    }
    
    // Detect if user added vague statements (bad pattern - user added vague content)
    const vaguePhrases = ['another week', 'great progress', 'exciting news', 'big announcement', 'stay tuned', 'coming soon', 'hello everybody', 'so glad to be back']
    if (vaguePhrases.some(phrase => addedTextStr.includes(phrase))) {
      changes.push('User added vague statements')
      issues.push('User added vague content - prefer more specific details')
      preferences.structure = [...(preferences.structure || []).filter(s => !s.includes('vague')), 'be specific', 'avoid vague phrases']
    }
    
    // Detect if user added specific details
    const detailIndicators = ['specifically', 'exactly', 'precisely', 'details', 'about']
    if (detailIndicators.some(word => addedTextStr.includes(word))) {
      changes.push('User added more specific details')
      issues.push('Content lacked specific details')
    }
    
    // Detect if user added questions
    const addedQuestions = addedText.filter(text => text.includes('?')).length
    if (addedQuestions > 0) {
      changes.push('User added questions for engagement')
      preferences.structure = [...(preferences.structure || []), 'includes questions']
    }
    
    // Detect if user added CTAs
    const ctaPatterns = ['click', 'learn more', 'get started', 'sign up', 'buy now', 'shop now', 'download', 'try', 'visit', 'check out']
    if (ctaPatterns.some(pattern => addedTextStr.includes(pattern))) {
      changes.push('User added call-to-action')
      issues.push('Content was missing call-to-action')
    }
    } // Close the else block
  }
  
  // Analyze modified text for patterns (what user changed and how)
  if (modifiedText.length > 0) {
    modifiedText.forEach(mod => {
      const origLower = mod.original.toLowerCase()
      const modLower = mod.modified.toLowerCase()
      
      // Detect tone changes in modifications
      const formalToCasual = ['dear', 'sincerely', 'respectfully', 'regards']
      const casualToFormal = ['hey', 'hi', 'thanks', 'awesome', 'cool']
      
      if (formalToCasual.some(word => origLower.includes(word) && !modLower.includes(word))) {
        changes.push('User made tone less formal in modifications')
        preferences.tone = [...(preferences.tone || []).filter(t => t !== 'formal'), 'friendly', 'casual']
      }
      
      if (casualToFormal.some(word => origLower.includes(word) && !modLower.includes(word))) {
        changes.push('User made tone more professional in modifications')
        preferences.tone = [...(preferences.tone || []).filter(t => t !== 'casual'), 'professional']
      }
      
      // Detect if user simplified language
      const complexWords = ['utilize', 'facilitate', 'implement', 'optimize', 'leverage']
      const simpleWords = ['use', 'help', 'do', 'improve', 'use']
      
      complexWords.forEach((complex, idx) => {
        if (origLower.includes(complex) && modLower.includes(simpleWords[idx])) {
          changes.push('User simplified language')
          issues.push('Language was too complex')
        }
      })
      
      // Detect if user made text more specific
      const vagueWords = ['things', 'stuff', 'many', 'various', 'some']
      if (vagueWords.some(word => origLower.includes(word) && !modLower.includes(word))) {
        changes.push('User made content more specific')
        issues.push('Content was too vague')
      }
      
      // Detect word count changes in modifications
      const origWords = mod.original.split(/\s+/).length
      const modWords = mod.modified.split(/\s+/).length
      if (Math.abs(origWords - modWords) > 3) {
        if (modWords < origWords) {
          changes.push(`User condensed "${mod.original.substring(0, 30)}..." to "${mod.modified.substring(0, 30)}..."`)
        } else {
          changes.push(`User expanded "${mod.original.substring(0, 30)}..." to "${mod.modified.substring(0, 30)}..."`)
        }
      }
    })
  }
  
  // Final fallback: if we still have no changes but there are edits, provide a summary
  if (changes.length === 0) {
    if (removedText.length > 0 || addedText.length > 0 || modifiedText.length > 0) {
      const parts: string[] = []
      if (removedText.length > 0) parts.push(`${removedText.length} removal${removedText.length > 1 ? 's' : ''}`)
      if (addedText.length > 0) parts.push(`${addedText.length} addition${addedText.length > 1 ? 's' : ''}`)
      if (modifiedText.length > 0) parts.push(`${modifiedText.length} modification${modifiedText.length > 1 ? 's' : ''}`)
      changes.push(`User made ${parts.join(', ')} to the content`)
    } else {
      // Last resort: content was modified but we couldn't detect specifics
      changes.push('Content was edited')
    }
  }
  
  return { changes, preferences, issues, removedText, addedText, modifiedText }
}

/**
 * Use AI to analyze edits and understand deeper patterns
 */
async function analyzeEditWithAI(
  originalContent: string,
  editedContent: string,
  contentType: 'post' | 'email' | 'ad',
  platform: string,
  apiKey?: string
): Promise<{
  insights: string[]
  preferences: Partial<LearnedStyle>
  issues: string[]
  whyBetter?: string
}> {
  try {
    console.log('[AI Analysis] Starting analyzeEditWithAI...')
    console.log('[AI Analysis] API key provided:', !!apiKey)
    
    if (!apiKey) {
      console.warn('[AI Analysis] No API key provided')
      return { insights: [], preferences: {}, issues: [], whyBetter: '' }
    }

    console.log('[AI Analysis] Initializing Google Generative AI...')
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    console.log('[AI Analysis] Google Generative AI initialized successfully')
    
    // Check if content contains sensitive/personal information that shouldn't be used for marketing learning
    // Use word boundaries to avoid false positives
    const sensitiveKeywords = [
      'dead', 'died', 'death', 'cancer', 'sick', 'ill', 'hospital', 'funeral', 
      'grief', 'mourning', 'suicide', 'depression', 'anxiety', 'trauma', 
      'grandmother', 'grandfather', 'family member'
    ]
    const originalLower = originalContent.toLowerCase()
    const editedLower = editedContent.toLowerCase()
    const isSensitive = sensitiveKeywords.some(keyword => {
      // For multi-word phrases, check exact phrase
      if (keyword.includes(' ')) {
        return originalLower.includes(keyword) || editedLower.includes(keyword)
      }
      // For single words, use word boundary regex to avoid false matches
      const regex = new RegExp(`\\b${keyword}\\b`, 'i')
      return regex.test(originalLower) || regex.test(editedLower)
    })
    
    // Check for inappropriate content
    const hasInappropriate = containsInappropriateContent(originalContent) || containsInappropriateContent(editedContent)
    
    // CRITICAL: Always analyze content to understand what to avoid, even if it contains inappropriate/sensitive content
    // The AI needs to understand WHY inappropriate content was removed so it can avoid generating it
    // But it should NEVER learn to generate inappropriate content itself
    
    const analysisPrompt = `Analyze the content changes below and provide insights in JSON format.

ORIGINAL: ${originalContent}

EDITED: ${editedContent}

CONTEXT: ${contentType} for ${platform}

TASK: Compare the original and edited content. Identify:
1. What changed (specific text/phrases removed, added, or modified)
2. Why the user made these changes (what was wrong with original, what makes edited better)
3. User preferences (tone, length, style, etc.)

You MUST provide at least 2 insights and explain why the edited version is better.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "insights": ["insight 1 about what changed and why", "insight 2 about user preferences"],
  "preferences": {
    "tone": ["casual", "professional", "personal", etc.],
    "length": "short|medium|long",
    "hashtagUsage": "minimal|moderate|heavy",
    "emojiUsage": "none|minimal|moderate",
    "structure": []
  },
  "issues": ["what was wrong with original"],
  "inappropriateAdded": false,
  "inappropriateRemoved": false,
  "whyBetter": "1-2 sentence explanation of why edited is better"
}

CRITICAL: Return ONLY the JSON object, nothing else.`

    // Try multiple models in order of preference
    const modelNames = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro']
    let lastError: any = null
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(analysisPrompt)
        const response = await result.response
        const text = response.text()
        
        console.log(`[AI Analysis] Model ${modelName} response length:`, text.length)
        console.log(`[AI Analysis] Raw response (first 500 chars):`, text.substring(0, 500))
        
        // Try to parse JSON from response
        // First try to find JSON in markdown code blocks
        let jsonText: string | null = null
        
        // Try markdown code block first (most common)
        const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/s)
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonText = codeBlockMatch[1].trim()
          console.log('[AI Analysis] Found JSON in markdown code block')
        } else {
          // Try to find JSON object directly - use balanced brace matching
          let braceCount = 0
          let startIdx = -1
          for (let i = 0; i < text.length; i++) {
            if (text[i] === '{') {
              if (startIdx === -1) startIdx = i
              braceCount++
            } else if (text[i] === '}') {
              braceCount--
              if (braceCount === 0 && startIdx !== -1) {
                jsonText = text.substring(startIdx, i + 1)
                console.log('[AI Analysis] Found JSON object in response')
                break
              }
            }
          }
          
          // Fallback: simple regex if balanced matching didn't work
          if (!jsonText) {
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch && jsonMatch[0]) {
              jsonText = jsonMatch[0]
              console.log('[AI Analysis] Found JSON using regex fallback')
            }
          }
        }
        
        if (jsonText && jsonText.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(jsonText)
            console.log('[AI Analysis] Successfully parsed JSON:', {
              insightsCount: parsed.insights?.length || 0,
              hasPreferences: Object.keys(parsed.preferences || {}).length > 0,
              hasWhyBetter: !!parsed.whyBetter
            })
            
            // If inappropriate content was added, don't learn from it
            if (parsed.inappropriateAdded === true) {
              return {
                insights: ['Inappropriate content was added - not learning from this edit'],
                preferences: {},
                issues: ['User added inappropriate content - avoid generating such content'],
              }
            }
            
            const result = {
              insights: parsed.insights || [],
              preferences: parsed.preferences || {},
              issues: parsed.issues || [],
              whyBetter: parsed.whyBetter || '', // Store why the edit is better
            }
            
            // Validate that we got meaningful results
            // Filter out empty strings from arrays
            const validInsights = (result.insights || []).filter((i: string) => i && i.trim().length > 0)
            const validIssues = (result.issues || []).filter((i: string) => i && i.trim().length > 0)
            const hasInsights = validInsights.length > 0
            const hasPreferences = result.preferences && Object.keys(result.preferences).length > 0
            const hasWhyBetter = result.whyBetter && result.whyBetter.trim().length > 5 // Reduced from 10
            const hasIssues = validIssues.length > 0
            
            // Update result with filtered arrays
            if (validInsights.length !== result.insights.length) {
              result.insights = validInsights
            }
            if (validIssues.length !== result.issues.length) {
              result.issues = validIssues
            }
            
            // Accept if we have ANY meaningful result
            if (hasInsights || hasPreferences || hasWhyBetter || hasIssues) {
              console.log('[AI Analysis] ✅ Success - got meaningful results:', {
                insightsCount: result.insights.length,
                preferencesCount: Object.keys(result.preferences).length,
                hasWhyBetter: !!result.whyBetter,
                issuesCount: result.issues.length
              })
              return result
            }
            
            // If we got nothing meaningful, log and try next model
            console.warn('[AI Analysis] ⚠️ Model returned empty results')
            console.warn('[AI Analysis] Raw response (first 500 chars):', text.substring(0, 500))
            console.warn('[AI Analysis] Parsed result:', JSON.stringify(result, null, 2))
            lastError = new Error('AI returned empty insights despite prompt requirements')
            continue
          } catch (parseError: any) {
            console.error(`[AI Analysis] JSON parse error for model ${modelName}:`, parseError.message)
            console.error('[AI Analysis] Attempted to parse (first 500 chars):', jsonText?.substring(0, 500))
            console.error('[AI Analysis] Full raw response (first 1000 chars):', text.substring(0, 1000))
            lastError = parseError
            continue // Try next model
          }
        } else {
          console.warn(`[AI Analysis] No valid JSON found in response from ${modelName}`)
          console.warn('[AI Analysis] Response preview (first 500 chars):', text.substring(0, 500))
          console.warn('[AI Analysis] Full response length:', text.length)
          lastError = new Error('No JSON found in response')
          continue // Try next model
        }
      } catch (modelError: any) {
        console.warn(`[AI Analysis] Model ${modelName} failed:`, modelError.message)
        lastError = modelError
        
        // Check if it's a quota/rate limit error (429)
        const errorMessage = modelError.message || String(modelError)
        const isQuotaError = errorMessage.includes('429') || 
                             errorMessage.includes('quota') || 
                             errorMessage.includes('rate limit') ||
                             errorMessage.includes('exceeded') ||
                             errorMessage.includes('Quota exceeded')
        
        if (isQuotaError) {
          // Check if it's specifically a "free tier" quota issue
          const isFreeTierQuota = errorMessage.includes('free_tier') || errorMessage.includes('free tier') || errorMessage.includes('limit: 0')
          
          if (isFreeTierQuota) {
            console.error('[AI Analysis] ⚠️ Free tier quota exhausted or disabled')
            throw new Error('Free tier quota exhausted. Please enable billing or upgrade your plan at https://ai.google.dev/pricing')
          } else {
            console.error('[AI Analysis] ⚠️ Rate limit exceeded - please wait before retrying')
            throw new Error('Rate limit exceeded - please wait a few minutes and try again, or upgrade your plan at https://ai.google.dev/pricing')
          }
        }
        
        // If it's not a "model not found" error, don't try other models
        if (!modelError.message?.includes('not found') && !modelError.message?.includes('404')) {
          break
        }
      }
    }
    
    // If all models failed, log the error
    console.error('[AI Analysis] ❌ All models failed. Last error:', lastError)
    if (lastError) {
      console.error('[AI Analysis] Error details:', {
        message: lastError?.message,
        name: lastError?.name,
        stack: lastError?.stack
      })
    }
  } catch (error: any) {
    console.error('[AI Analysis] ❌ Fatal error in analyzeEditWithAI:', error)
    console.error('[AI Analysis] Error type:', error?.constructor?.name)
    console.error('[AI Analysis] Error message:', error?.message)
    // Re-throw critical errors so caller can handle them
    const errorMessage = error?.message || String(error)
    if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
      throw new Error('Invalid API key - please check your Gemini API key in Settings')
    }
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('exceeded') || errorMessage.includes('Quota exceeded')) {
      throw error // Re-throw quota errors so they're properly caught
    }
    // For other errors, log but return empty (might be temporary network issue)
    console.warn('[AI Analysis] Non-critical error, returning empty results')
  }
  
  // If we get here, all models failed but it wasn't a critical error
  console.warn('[AI Analysis] Returning empty results after all models failed')
  return { insights: [], preferences: {}, issues: [], whyBetter: '' }
}

/**
 * Track content edits and learn from them
 */
export async function trackContentEdit(
  originalContent: string,
  editedContent: string,
  contentType: 'post' | 'email' | 'ad',
  platform: string,
  prompt: string,
  updateSettings: (settings: Partial<Store['settings']>) => void,
  currentSettings: Store['settings']
) {
  if (originalContent === editedContent) {
    return // No changes made
  }

  const edit: ContentEdit = {
    originalContent,
    editedContent,
    contentType,
    platform,
    editedAt: new Date().toISOString(),
    prompt,
  }

  // Check for sensitive/personal content - only block if it's in the EDITED content (user added it)
  // If user REMOVED sensitive content, that's actually good and we should learn from it
  // Use word boundaries to avoid false positives
  const sensitiveKeywords = [
    'dead', 'died', 'death', 'cancer', 'sick', 'ill', 'hospital', 'funeral', 
    'grief', 'mourning', 'grandmother', 'grandfather', 'family member', 
    'passed away', 'suicide', 'depression', 'anxiety', 'trauma'
  ]
  
  const originalLower = originalContent.toLowerCase()
  const editedLower = editedContent.toLowerCase()
  
  const originalHasSensitive = sensitiveKeywords.some(keyword => {
    // For multi-word phrases, check exact phrase
    if (keyword.includes(' ')) {
      return originalLower.includes(keyword)
    }
    // For single words, use word boundary regex to avoid false matches
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    return regex.test(originalLower)
  })
  
  const editedHasSensitive = sensitiveKeywords.some(keyword => {
    // For multi-word phrases, check exact phrase
    if (keyword.includes(' ')) {
      return editedLower.includes(keyword)
    }
    // For single words, use word boundary regex to avoid false matches
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    return regex.test(editedLower)
  })
  
  // Only block learning if sensitive content is in the EDITED content (user added it)
  // If user removed sensitive content, that's a positive pattern we should learn from
  if (editedHasSensitive) {
    // User added sensitive content - don't learn from this
    const preferences = currentSettings.contentPreferences || {
      acceptedContent: [],
      edits: [],
    }
    // Optimized for free-tier: keep last 35 edits (~3KB each = ~105KB total)
    const updatedEdits = [...(preferences.edits || []), edit].slice(-35)
    updateSettings({
      contentPreferences: {
        ...preferences,
        edits: updatedEdits,
      },
    })
    return // Don't learn from sensitive content that was added
  }
  
  // If user removed sensitive content, mark it but still learn (this is a positive pattern)
  if (originalHasSensitive && !editedHasSensitive) {
    // User removed sensitive content - this is good! We should learn from this
    // Mark it in the edit but continue with learning
    edit.editType = 'removal'
  }
  
  // First do rule-based analysis
  const ruleBasedAnalysis = analyzeEdit(edit)
  
  // CRITICAL: Always use AI analysis if API key is available
  // AI analysis reads the FULL content to understand context, meaning, and WHY changes were made
  // Do this BEFORE checking for inappropriate content so we can store the analysis even if learning is blocked
  let aiAnalysis: { insights: string[]; preferences: Partial<LearnedStyle>; issues: string[]; whyBetter?: string } = { insights: [], preferences: {}, issues: [] }
  let aiAnalysisError: string | undefined = undefined
  if (currentSettings.geminiApiKey) {
    try {
      console.log('[AI Analysis] Starting AI analysis with API key...')
      // AI analysis understands the FULL context - reads entire original and edited content
      aiAnalysis = await analyzeEditWithAI(
        originalContent, // Full original content
        editedContent,   // Full edited content
        contentType,
        platform,
        currentSettings.geminiApiKey
      )
      console.log('[AI Analysis] AI analysis completed:', { 
        insightsCount: aiAnalysis.insights.length, 
        hasWhyBetter: !!aiAnalysis.whyBetter,
        preferences: Object.keys(aiAnalysis.preferences).length,
        issuesCount: aiAnalysis.issues.length
      })
      
      // Only check for empty results if we didn't already have an error
      if (!aiAnalysisError) {
        // Check if AI returned empty results (not an error, but no insights)
        const hasInsights = aiAnalysis.insights && aiAnalysis.insights.length > 0
        const hasPreferences = aiAnalysis.preferences && Object.keys(aiAnalysis.preferences).length > 0
        const hasWhyBetter = aiAnalysis.whyBetter && aiAnalysis.whyBetter.trim().length > 10
        const hasIssues = aiAnalysis.issues && aiAnalysis.issues.length > 0
        
        if (!hasInsights && !hasPreferences && !hasWhyBetter && !hasIssues) {
          // AI returned empty results - mark as failed but not quota error
          console.warn('[AI Analysis] AI returned empty results despite prompt requirements')
          console.warn('[AI Analysis] AI result:', JSON.stringify(aiAnalysis, null, 2))
          aiAnalysisError = 'AI analysis returned no insights - the model may need a more specific prompt or the changes were too subtle'
        } else {
          console.log('[AI Analysis] ✅ Successfully got results:', {
            insights: hasInsights,
            preferences: hasPreferences,
            whyBetter: hasWhyBetter,
            issues: hasIssues
          })
        }
      }
    } catch (error: any) {
      console.error('[AI Analysis] ❌ AI analysis error caught:', error)
      console.error('[AI Analysis] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      })
      // Check if it's a quota/rate limit error
      const errorMessage = error?.message || String(error)
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('exceeded') || errorMessage.includes('Quota exceeded')) {
        // Check if it's specifically a free tier quota issue
        const isFreeTierQuota = errorMessage.includes('free_tier') || errorMessage.includes('free tier') || errorMessage.includes('limit: 0') || errorMessage.includes('Free tier quota')
        
        if (isFreeTierQuota) {
          aiAnalysisError = 'Free tier quota exhausted. Enable billing in Google AI Studio or upgrade your plan. See https://ai.google.dev/pricing'
        } else {
          aiAnalysisError = 'Rate limit exceeded - please wait a few minutes and try again, or upgrade your plan at https://ai.google.dev/pricing'
        }
        
        edit.aiAnalysisFailed = true
        edit.aiAnalysisError = aiAnalysisError
        console.error('[AI Analysis] ⚠️ QUOTA ERROR - marking as failed:', aiAnalysisError)
      } else if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        aiAnalysisError = 'Invalid API key - please check your Gemini API key in Settings'
        edit.aiAnalysisFailed = true
        edit.aiAnalysisError = aiAnalysisError
      } else {
        aiAnalysisError = `AI analysis failed: ${errorMessage}`
      }
      // Continue with rule-based analysis if AI fails
    }
  } else {
    console.log('No Gemini API key - skipping AI analysis')
  }
  
  // Check if inappropriate content was added - if so, completely block learning
  // But still store the edit and AI analysis for display purposes
  const originalHasInappropriate = containsInappropriateContent(originalContent)
  const editedHasInappropriate = containsInappropriateContent(editedContent)
  
  // If inappropriate content was ADDED (wasn't in original, but is in edited), block learning
  const hasInappropriateAdded = editedHasInappropriate && !originalHasInappropriate
  
  // Merge rule-based and AI analysis (AI insights take priority)
  // AI analysis provides deeper understanding of WHY changes were made by reading FULL content
  // Prioritize AI insights since it understands full context and meaning
  const analysis = {
    changes: aiAnalysis.insights.length > 0 
      ? [...aiAnalysis.insights, ...ruleBasedAnalysis.changes] // AI insights first
      : [...ruleBasedAnalysis.changes],
    preferences: { 
      ...ruleBasedAnalysis.preferences, 
      ...aiAnalysis.preferences // AI preferences override rule-based
    },
    issues: [...ruleBasedAnalysis.issues, ...aiAnalysis.issues],
    removedText: ruleBasedAnalysis.removedText,
    addedText: ruleBasedAnalysis.addedText,
    modifiedText: ruleBasedAnalysis.modifiedText,
    whyBetter: aiAnalysis.whyBetter, // Why the edited version is better (from AI understanding full context)
  }
  
  // If AI provided insights about why it's better, prioritize that
  if (aiAnalysis.whyBetter) {
    analysis.changes.unshift(`Why better: ${aiAnalysis.whyBetter}`) // Add at the beginning
  }
  
  // Add removed/added/modified text to edit object
  edit.removedText = analysis.removedText
  edit.addedText = analysis.addedText
  edit.modifiedText = analysis.modifiedText
  
  // ALWAYS store AI analysis results so they persist and can be displayed later
  // Even if learning is blocked, we want to show what the AI understood
  edit.aiInsights = aiAnalysis.insights.length > 0 ? aiAnalysis.insights : undefined
  edit.aiPreferences = Object.keys(aiAnalysis.preferences).length > 0 ? aiAnalysis.preferences : undefined
  edit.aiIssues = aiAnalysis.issues.length > 0 ? aiAnalysis.issues : undefined
  edit.whyBetter = aiAnalysis.whyBetter || undefined
  
  // Store quota error info if AI analysis failed due to quota
  if (aiAnalysisError) {
    edit.aiAnalysisFailed = true
    edit.aiAnalysisError = aiAnalysisError
  }
  
  if (hasInappropriateAdded) {
    // User added inappropriate content - don't learn positive patterns from this
    // But still store the edit with AI analysis so we can show what was analyzed
    // The AI analysis will have marked this as inappropriateAdded, so preferences won't be learned
    const preferences = currentSettings.contentPreferences || {
      acceptedContent: [],
      edits: [],
    }
    // Optimized for free-tier: keep last 35 edits (~3KB each = ~105KB total)
    const updatedEdits = [...(preferences.edits || []), edit].slice(-35)
    
    // Don't update learned preferences, but still store the edit
    updateSettings({
      contentPreferences: {
        ...preferences,
        edits: updatedEdits,
        // Don't update learnedStyle - inappropriate content was added
      },
    })
    return // Don't learn from edits where inappropriate content was added
  }
  
  // If inappropriate content was REMOVED, this is a positive learning opportunity
  // The AI should learn to avoid inappropriate content and prefer professional alternatives
  // This is handled in the analysis above - we continue with normal learning
  
  const preferences = currentSettings.contentPreferences || {
    acceptedContent: [],
    edits: [],
  }

  // Store the edit (optimized for free-tier: keep last 35 edits, ~3KB each = ~105KB total)
  const updatedEdits = [...(preferences.edits || []), edit].slice(-35) // Keep last 35 edits

  // SUPERSMART: Aggregate learned preferences from ALL edits, not just the latest
  // Use weighted voting where recent edits have more weight, but all edits contribute
  const existingStyle = preferences.learnedStyle || {}
  
  // Aggregate preferences from all recent edits (last 30)
  const allEdits = updatedEdits.filter(e => {
    // Only use edits that have content to analyze
    return e.originalContent && e.editedContent
  })
  
  // Efficiently extract preferences from all edits
  // Use stored AI preferences if available, otherwise do quick rule-based analysis
  const editAnalyses: Partial<LearnedStyle>[] = allEdits.map(e => {
    // Prefer stored AI preferences (most accurate)
    if ((e as any).aiPreferences && Object.keys((e as any).aiPreferences).length > 0) {
      return (e as any).aiPreferences
    }
    // Fallback: quick rule-based analysis for stored edits (no AI call needed, very fast)
    const quickAnalysis = analyzeEdit(e)
    return quickAnalysis.preferences
  })
  
  // Aggregate preferences using weighted voting (more recent = more weight)
  // Recent edits get higher weight, but ALL edits contribute to the final preferences
  const aggregatedPreferences = aggregatePreferencesFromEdits(editAnalyses, allEdits.length)
  
  // Get scanned posts for learning (most important source for new users!)
  const scannedPosts = preferences.scannedPosts || []
  
  // Learn from scanned posts (primary source)
  const scannedStyle = scannedPosts.length > 0 
    ? learnFromScannedPosts(scannedPosts)
    : {}
  
  // Merge all learning sources: scanned posts (highest priority) > edits > existing style
  // Scanned posts are weighted highest because they represent actual posted content
  const updatedStyle: LearnedStyle = {
    ...existingStyle,
    // Tone: scanned > edits > existing
    tone: mergeTonePreferences(
      scannedStyle.tone,
      mergeTonePreferences(aggregatedPreferences.tone, existingStyle.tone)
    ),
    // Length: scanned > edits > existing
    length: scannedStyle.length || aggregatedPreferences.length || existingStyle.length,
    // Hashtag: scanned > edits > existing
    hashtagUsage: scannedStyle.hashtagUsage || aggregatedPreferences.hashtagUsage || existingStyle.hashtagUsage,
    // Emoji: scanned > edits > existing
    emojiUsage: scannedStyle.emojiUsage || aggregatedPreferences.emojiUsage || existingStyle.emojiUsage,
    // CTA: scanned > edits > existing
    ctaStyle: mergeArrayPreferences(
      scannedStyle.ctaStyle,
      mergeArrayPreferences(aggregatedPreferences.ctaStyle, existingStyle.ctaStyle)
    ),
    // Structure: scanned > edits > existing
    structure: mergeArrayPreferences(
      scannedStyle.structure,
      mergeArrayPreferences(aggregatedPreferences.structure, existingStyle.structure)
    ),
  }
  
  // If inappropriate content was removed, ensure we learn to avoid it
  if (originalHasInappropriate && !editedHasInappropriate) {
    // Add to structure preferences: avoid inappropriate language
    if (!updatedStyle.structure) updatedStyle.structure = []
    if (!updatedStyle.structure.includes('avoid inappropriate language')) {
      updatedStyle.structure.push('avoid inappropriate language')
    }
    if (!updatedStyle.structure.includes('maintain professional tone')) {
      updatedStyle.structure.push('maintain professional tone')
    }
  }

  // IMPORTANT: Do NOT add edited content to acceptedContent list
  // Accepted content should only contain NEW content that was created and accepted (not edited)
  // Edits go to the edits list, not acceptedContent

  updateSettings({
    contentPreferences: {
      ...preferences,
      // Don't add to acceptedContent - this is an edit, not new accepted content
      edits: updatedEdits,
      learnedStyle: updatedStyle,
    },
  })
}

/**
 * Generate a prompt enhancement based on learned preferences
 */
export function generateLearningPrompt(
  learnedStyle: LearnedStyle, 
  contentType: 'post' | 'email' | 'ad',
  recentEdits?: ContentEdit[]
): string {
  if (!learnedStyle || Object.keys(learnedStyle).length === 0) {
    return ''
  }

  let prompt = '\n\n=== LEARNED USER PREFERENCES (Apply these styles):\n'

  if (learnedStyle.length) {
    prompt += `- Content Length: ${learnedStyle.length} (${learnedStyle.length === 'short' ? '50 words or less' : learnedStyle.length === 'medium' ? '50-150 words' : '150+ words'})\n`
  }

  if (learnedStyle.tone && learnedStyle.tone.length > 0) {
    prompt += `- Tone: ${learnedStyle.tone.join(', ')}\n`
  }

  if (learnedStyle.hashtagUsage) {
    prompt += `- Hashtag Usage: ${learnedStyle.hashtagUsage} (${learnedStyle.hashtagUsage === 'none' ? 'no hashtags' : learnedStyle.hashtagUsage === 'minimal' ? '1-2 hashtags' : learnedStyle.hashtagUsage === 'moderate' ? '3-5 hashtags' : '6+ hashtags'})\n`
  }

  if (learnedStyle.emojiUsage) {
    prompt += `- Emoji Usage: ${learnedStyle.emojiUsage} (${learnedStyle.emojiUsage === 'none' ? 'no emojis' : learnedStyle.emojiUsage === 'minimal' ? '1-2 emojis' : '3+ emojis'})\n`
  }

  if (learnedStyle.ctaStyle && learnedStyle.ctaStyle.length > 0) {
    prompt += `- Preferred CTA styles: ${learnedStyle.ctaStyle.join(', ')}\n`
  }

  // Add specific things to avoid and prefer based on recent edits
  if (recentEdits && recentEdits.length > 0) {
    const allRemovedText: string[] = []
    const allAddedText: string[] = []
    const allModifications: Array<{ original: string; modified: string }> = []
    
    recentEdits.forEach(edit => {
      if (edit.removedText && edit.removedText.length > 0) {
        allRemovedText.push(...edit.removedText)
      }
      if (edit.addedText && edit.addedText.length > 0) {
        allAddedText.push(...edit.addedText)
      }
      if (edit.modifiedText && edit.modifiedText.length > 0) {
        allModifications.push(...edit.modifiedText)
      }
    })
    
    // Analyze removed text
    if (allRemovedText.length > 0) {
      const removedWords = new Map<string, number>()
      allRemovedText.forEach(text => {
        text.split(/\s+/).forEach(word => {
          const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
          if (cleanWord.length > 4) { // Only track meaningful words
            removedWords.set(cleanWord, (removedWords.get(cleanWord) || 0) + 1)
          }
        })
      })
      
      const frequentRemovals = Array.from(removedWords.entries())
        .filter(([_, count]) => count >= 2) // Appeared in 2+ edits
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word)
      
      if (frequentRemovals.length > 0) {
        prompt += `\n- AVOID these terms/phrases (user has removed them multiple times): ${frequentRemovals.join(', ')}\n`
      }
    }
    
    // Analyze added text (what user prefers to add)
    if (allAddedText.length > 0) {
      const addedWords = new Map<string, number>()
      allAddedText.forEach(text => {
        text.split(/\s+/).forEach(word => {
          const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
          if (cleanWord.length > 3) {
            addedWords.set(cleanWord, (addedWords.get(cleanWord) || 0) + 1)
          }
        })
      })
      
      const frequentAdditions = Array.from(addedWords.entries())
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word)
      
      if (frequentAdditions.length > 0) {
        prompt += `\n- PREFER including these types of content (user has added them multiple times): ${frequentAdditions.join(', ')}\n`
      }
    }
    
    // Analyze modifications (what user changes and how)
    if (allModifications.length > 0) {
      const modificationPatterns: string[] = []
      
      allModifications.forEach(mod => {
        const origLower = mod.original.toLowerCase()
        const modLower = mod.modified.toLowerCase()
        
        // Detect simplification patterns
        if (origLower.length > modLower.length * 1.2) {
          modificationPatterns.push('User prefers simpler, more concise language')
        }
        
        // Detect specificity improvements
        const vagueTerms = ['things', 'stuff', 'many', 'various', 'some', 'several']
        if (vagueTerms.some(term => origLower.includes(term) && !modLower.includes(term))) {
          modificationPatterns.push('User prefers specific details over vague terms')
        }
      })
      
      if (modificationPatterns.length > 0) {
        const uniquePatterns = [...new Set(modificationPatterns)]
        prompt += `\n- MODIFICATION PATTERNS (user consistently makes these changes):\n`
        uniquePatterns.forEach(pattern => {
          prompt += `  • ${pattern}\n`
        })
      }
    }
  }

  // Add insights from recent edits about WHY changes were made
  // Include FULL original and edited content so AI understands complete context
  if (recentEdits && recentEdits.length > 0) {
    prompt += '\n\n=== RECENT USER EDITS (Read FULL content to understand WHY changes were made):\n'
    prompt += 'IMPORTANT: Read the ENTIRE original and edited content below. Understand the complete context, meaning, and intent.\n'
    prompt += 'Understand WHY the user made each change - what was wrong with the original, what makes the edited version better.\n\n'
    
    recentEdits.slice(-5).forEach((edit, idx) => {
      prompt += `\n--- Edit ${idx + 1} (${edit.platform}, ${edit.contentType}) ---\n`
      prompt += `ORIGINAL (what AI generated):\n"${edit.originalContent}"\n\n`
      prompt += `EDITED (what user changed it to):\n"${edit.editedContent}"\n\n`
      
      if (edit.removedText && edit.removedText.length > 0) {
        prompt += `User REMOVED: "${edit.removedText.join('", "')}"\n`
        prompt += `→ This content was problematic. Understand WHY it was removed and avoid similar content.\n`
      }
      if (edit.addedText && edit.addedText.length > 0) {
        prompt += `User ADDED: "${edit.addedText.join('", "')}"\n`
        prompt += `→ User preferred this. Understand WHY and generate similar content.\n`
      }
      if (edit.modifiedText && edit.modifiedText.length > 0) {
        edit.modifiedText.forEach(mod => {
          prompt += `User CHANGED: "${mod.original.substring(0, 100)}..." → "${mod.modified.substring(0, 100)}..."\n`
          prompt += `→ The modified version is better. Understand WHY and apply this pattern.\n`
        })
      }
      prompt += '\n'
    })
    
    prompt += 'KEY LEARNING: Based on the FULL content above, understand:\n'
    prompt += '1. What type of content the user REMOVES and WHY (what was wrong with it)\n'
    prompt += '2. What type of content the user ADDS and WHY (what makes it better)\n'
    prompt += '3. How the user MODIFIES content and WHY (what improvements they make)\n'
    prompt += '4. The complete context and meaning, not just individual words or phrases\n'
  }
  
  prompt += '\n\nCRITICAL CONTENT SAFETY RULES:'
  prompt += '\n- NEVER generate inappropriate, profane, offensive, or unprofessional content'
  prompt += '\n- NEVER use words like: fuck, shit, bitch, asshole, damn, hell, pussy, dick, cunt, loser, stupid, idiot, or any variations'
  prompt += '\n- NEVER use phrases like "i mean it", "i mean this", "for real", "no cap", etc. when they would be inappropriate or unprofessional'
  prompt += '\n- If the user previously REMOVED inappropriate content, this means they DO NOT want such content - NEVER generate it'
  prompt += '\n- ALWAYS maintain a professional, appropriate tone suitable for business marketing'
  prompt += '\n- If learned patterns suggest inappropriate content, ignore those patterns and generate professional content instead'
  
  prompt += '\n\nCRITICAL: When generating content, apply these learned patterns. Understand the FULL context and meaning of what the user prefers, not just keywords. Read the complete messages to understand intent and reasoning. But ALWAYS prioritize professional, appropriate content over any learned patterns that might suggest inappropriate content.'
  
  return prompt
}

/**
 * Learn from scanned posts - this is the PRIMARY source for new users!
 * Scanned posts have rich styleAnalysis data that should be used for learning
 */
export function learnFromScannedPosts(
  scannedPosts: Array<{
    styleAnalysis: {
      tone: string[]
      structure: string[]
      hashtagStyle: string[]
      callToAction: string[]
      length: { min: number; max: number; average: number }
      emojiUsage: boolean
      formatting: string[]
    }
  }>
): LearnedStyle {
  if (!scannedPosts || scannedPosts.length === 0) {
    console.log('[Learning] No scanned posts to learn from')
    return {}
  }

  console.log(`[Learning] Learning from ${scannedPosts.length} scanned posts`)

  const styles: LearnedStyle = {
    tone: [],
    ctaStyle: [],
    structure: [],
  }

  // Extract length from average word count
  const avgLengths = scannedPosts
    .filter(sp => sp.styleAnalysis?.length?.average !== undefined)
    .map(sp => {
      const avg = sp.styleAnalysis.length.average
      if (avg < 50) return 'short'
      if (avg < 150) return 'medium'
      return 'long'
    })
  if (avgLengths.length > 0) {
    const mostCommonLength = avgLengths.reduce((a, b, _, arr) => 
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    ) as 'short' | 'medium' | 'long'
    styles.length = mostCommonLength
    console.log(`[Learning] Learned length: ${mostCommonLength} from ${avgLengths.length} posts`)
  }

  // Extract hashtag usage from hashtagStyle
  const validHashtagPosts = scannedPosts.filter(sp => sp.styleAnalysis?.hashtagStyle)
  if (validHashtagPosts.length > 0) {
    const hashtagCounts = validHashtagPosts.map(sp => sp.styleAnalysis.hashtagStyle.length)
    const avgHashtags = hashtagCounts.reduce((a, b) => a + b, 0) / hashtagCounts.length
    if (avgHashtags === 0) styles.hashtagUsage = 'none'
    else if (avgHashtags < 2) styles.hashtagUsage = 'minimal'
    else if (avgHashtags < 5) styles.hashtagUsage = 'moderate'
    else styles.hashtagUsage = 'heavy'
    console.log(`[Learning] Learned hashtag usage: ${styles.hashtagUsage} (avg: ${avgHashtags.toFixed(2)})`)
  }

  // Extract emoji usage
  const validEmojiPosts = scannedPosts.filter(sp => sp.styleAnalysis?.emojiUsage !== undefined)
  if (validEmojiPosts.length > 0) {
    const emojiUsageCount = validEmojiPosts.filter(sp => sp.styleAnalysis.emojiUsage).length
    const emojiUsageRatio = emojiUsageCount / validEmojiPosts.length
    if (emojiUsageRatio === 0) styles.emojiUsage = 'none'
    else if (emojiUsageRatio < 0.3) styles.emojiUsage = 'minimal'
    else styles.emojiUsage = 'moderate'
    console.log(`[Learning] Learned emoji usage: ${styles.emojiUsage} (${emojiUsageCount}/${validEmojiPosts.length} posts)`)
  }

  // Extract tone from all scanned posts
  const allTones = new Set<string>()
  scannedPosts.forEach(sp => {
    if (sp.styleAnalysis?.tone && Array.isArray(sp.styleAnalysis.tone)) {
      sp.styleAnalysis.tone.forEach(tone => {
        if (tone && typeof tone === 'string') {
          allTones.add(tone)
        }
      })
    }
  })
  styles.tone = Array.from(allTones)
  if (styles.tone.length > 0) {
    console.log(`[Learning] Learned tones: ${styles.tone.join(', ')}`)
  }

  // Extract CTA style
  const allCTAs = new Set<string>()
  scannedPosts.forEach(sp => {
    if (sp.styleAnalysis?.callToAction && Array.isArray(sp.styleAnalysis.callToAction)) {
      sp.styleAnalysis.callToAction.forEach(cta => {
        if (cta && typeof cta === 'string') {
          allCTAs.add(cta)
        }
      })
    }
  })
  styles.ctaStyle = Array.from(allCTAs)
  if (styles.ctaStyle.length > 0) {
    console.log(`[Learning] Learned CTAs: ${styles.ctaStyle.join(', ')}`)
  }

  // Extract structure
  const allStructures = new Set<string>()
  scannedPosts.forEach(sp => {
    if (sp.styleAnalysis?.structure && Array.isArray(sp.styleAnalysis.structure)) {
      sp.styleAnalysis.structure.forEach(struct => {
        if (struct && typeof struct === 'string') {
          allStructures.add(struct)
        }
      })
    }
    if (sp.styleAnalysis?.formatting && Array.isArray(sp.styleAnalysis.formatting)) {
      sp.styleAnalysis.formatting.forEach(format => {
        if (format && typeof format === 'string') {
          allStructures.add(format)
        }
      })
    }
  })
  styles.structure = Array.from(allStructures)
  if (styles.structure.length > 0) {
    console.log(`[Learning] Learned structure: ${styles.structure.join(', ')}`)
  }

  console.log(`[Learning] Final learned style:`, styles)
  return styles
}

/**
 * Combine all learning sources: scanned posts (highest priority), accepted content, and edits
 * This gives the most comprehensive learning for new users
 */
export function combineAllLearningSources(
  scannedPosts?: Array<{
    styleAnalysis?: {
      tone: string[]
      structure: string[]
      hashtagStyle: string[]
      callToAction: string[]
      length: { min: number; max: number; average: number }
      emojiUsage: boolean
      formatting: string[]
    }
    aiPreferences?: Partial<LearnedStyle> // AI analysis results if available
    aiInsights?: string[] // AI insights if available
  }>,
  acceptedContent?: ContentPreference[],
  edits?: ContentEdit[]
): LearnedStyle {
  // Priority: Scanned posts > Edits > Accepted content
  // All sources now use AI analysis if API key is available!
  // AI preferences take priority over rule-based analysis
  
  console.log('[combineAllLearningSources] Starting combination...')
  console.log('[combineAllLearningSources] Scanned posts:', scannedPosts?.length || 0)
  console.log('[combineAllLearningSources] Accepted content:', acceptedContent?.length || 0)
  console.log('[combineAllLearningSources] Edits:', edits?.length || 0)
  
  // Get scanned style - prioritize AI preferences if available, fallback to rule-based
  let scannedStyle: Partial<LearnedStyle> = {}
  if (scannedPosts && scannedPosts.length > 0) {
    // Check if any scanned posts have AI preferences
    const postsWithAI = scannedPosts.filter(sp => sp.aiPreferences && Object.keys(sp.aiPreferences).length > 0)
    
    if (postsWithAI.length > 0) {
      // Use AI preferences from scanned posts (aggregate them)
      console.log(`[combineAllLearningSources] Using AI preferences from ${postsWithAI.length} scanned posts`)
      const aiPreferencesArray = postsWithAI.map(sp => sp.aiPreferences!)
      scannedStyle = aggregatePreferencesFromEdits(aiPreferencesArray, postsWithAI.length)
    } else {
      // Fallback to rule-based analysis
      console.log('[combineAllLearningSources] Using rule-based analysis for scanned posts')
      const postsWithStyleAnalysis = scannedPosts.filter(sp => sp.styleAnalysis) as Array<{
        styleAnalysis: {
          tone: string[]
          structure: string[]
          hashtagStyle: string[]
          callToAction: string[]
          length: { min: number; max: number; average: number }
          emojiUsage: boolean
          formatting: string[]
        }
      }>
      scannedStyle = learnFromScannedPosts(postsWithStyleAnalysis)
    }
  }
  
  console.log('[combineAllLearningSources] Scanned style:', scannedStyle)
  
  // Get accepted style - prioritize AI preferences if available, fallback to rule-based
  let acceptedStyle: Partial<LearnedStyle> = {}
  if (acceptedContent && acceptedContent.length > 0) {
    // Check if any accepted content has AI preferences
    const acceptedWithAI = acceptedContent.filter(ac => ac.aiPreferences && Object.keys(ac.aiPreferences).length > 0)
    
    if (acceptedWithAI.length > 0) {
      // Use AI preferences from accepted content (aggregate them)
      console.log(`[combineAllLearningSources] Using AI preferences from ${acceptedWithAI.length} accepted items`)
      const aiPreferencesArray = acceptedWithAI.map(ac => ac.aiPreferences!)
      acceptedStyle = aggregatePreferencesFromEdits(aiPreferencesArray, acceptedWithAI.length)
    } else {
      // Fallback to rule-based analysis
      console.log('[combineAllLearningSources] Using rule-based analysis for accepted content')
      acceptedStyle = learnFromAcceptedContent(acceptedContent)
    }
  }
  
  // For edits, prioritize AI preferences if available, fallback to rule-based
  let editStyle: Partial<LearnedStyle> = {}
  if (edits && edits.length > 0) {
    const editAnalyses = edits.map(e => {
      if (e.aiPreferences && Object.keys(e.aiPreferences).length > 0) {
        // Use AI preferences if available
        return e.aiPreferences
      }
      // Fallback to rule-based analysis
      const quickAnalysis = analyzeEdit(e)
      return quickAnalysis.preferences
    })
    editStyle = aggregatePreferencesFromEdits(editAnalyses, edits.length)
  }
  
  // Merge with priority: scanned > edits > accepted
  // AI preferences are already included if available, rule-based is fallback
  const combined: LearnedStyle = {
    // Tone: combine all sources (AI or rule-based)
    tone: mergeTonePreferences(
      scannedStyle.tone,
      mergeTonePreferences(editStyle.tone, acceptedStyle.tone)
    ),
    // Length: prefer scanned, then edits, then accepted
    length: scannedStyle.length || editStyle.length || acceptedStyle.length,
    // Hashtag: prefer scanned, then edits, then accepted
    hashtagUsage: scannedStyle.hashtagUsage || editStyle.hashtagUsage || acceptedStyle.hashtagUsage,
    // Emoji: prefer scanned, then edits, then accepted
    emojiUsage: scannedStyle.emojiUsage || editStyle.emojiUsage || acceptedStyle.emojiUsage,
    // CTA: combine all sources
    ctaStyle: mergeArrayPreferences(
      scannedStyle.ctaStyle,
      mergeArrayPreferences(editStyle.ctaStyle, acceptedStyle.ctaStyle)
    ),
    // Structure: combine all sources
    structure: mergeArrayPreferences(
      scannedStyle.structure,
      mergeArrayPreferences(editStyle.structure, acceptedStyle.structure)
    ),
  }
  
  console.log('[combineAllLearningSources] Final combined style:', combined)
  return combined
}

/**
 * Track accepted content and learn from it using AI analysis if available
 */
export async function trackAcceptedContent(
  content: string,
  contentType: 'post' | 'email' | 'ad',
  platform: string,
  prompt: string,
  updateSettings: (settings: Partial<Store['settings']>) => void,
  currentSettings: Store['settings']
) {
  const preferences = currentSettings.contentPreferences || {
    acceptedContent: [],
    scannedPosts: [],
    edits: [],
  }

  // Ensure acceptedContent is always an array
  const acceptedContent = Array.isArray(preferences.acceptedContent) 
    ? preferences.acceptedContent 
    : []

  // AI Analysis if API key available
  let aiPreferences: Partial<LearnedStyle> | undefined = undefined
  let aiInsights: string[] | undefined = undefined
  
  if (currentSettings.geminiApiKey) {
    try {
      console.log('[Accept Content] Starting AI analysis...')
      const aiAnalysis = await analyzeContentWithAI(
        content,
        contentType,
        platform,
        currentSettings.geminiApiKey
      )
      aiPreferences = aiAnalysis.preferences
      aiInsights = aiAnalysis.insights
      console.log('[Accept Content] AI analysis completed:', {
        preferencesCount: Object.keys(aiPreferences).length,
        insightsCount: aiInsights.length
      })
    } catch (error: any) {
      console.error('[Accept Content] AI analysis failed:', error.message)
      // Continue with rule-based analysis if AI fails
    }
  }

  // Rule-based analysis (always runs, as fallback if AI not available)
  const { analyzeContent } = await import('./content-analyzer')
  const ruleBasedAnalysis = analyzeContent(content)
  
  // Convert rule-based analysis length from { min, max, average } to 'short' | 'medium' | 'long'
  const ruleBasedLength: 'short' | 'medium' | 'long' | undefined = ruleBasedAnalysis.length
    ? (ruleBasedAnalysis.length.average < 50 ? 'short' : ruleBasedAnalysis.length.average < 150 ? 'medium' : 'long')
    : undefined
  
  // Combine AI and rule-based preferences (AI takes priority)
  const combinedPreferences: Partial<LearnedStyle> = {
    tone: ruleBasedAnalysis.tone,
    structure: ruleBasedAnalysis.structure,
    ctaStyle: ruleBasedAnalysis.callToAction,
    length: ruleBasedLength,
    hashtagUsage: ruleBasedAnalysis.hashtagStyle.length === 0 ? 'none' 
      : ruleBasedAnalysis.hashtagStyle.length < 2 ? 'minimal'
      : ruleBasedAnalysis.hashtagStyle.length < 5 ? 'moderate'
      : 'heavy',
    emojiUsage: ruleBasedAnalysis.emojiUsage ? 'minimal' : 'none',
    ...aiPreferences, // AI preferences override rule-based
  }

  const newAccepted = {
    content,
    contentType,
    platform,
    acceptedAt: new Date().toISOString(),
    prompt,
    aiPreferences: aiPreferences && Object.keys(aiPreferences).length > 0 ? aiPreferences : undefined,
    aiInsights: aiInsights && aiInsights.length > 0 ? aiInsights : undefined,
    ruleBasedPreferences: ruleBasedAnalysis,
  }

  const updatedAccepted = [...acceptedContent, newAccepted]
  
  // Optimized for free-tier: keep last 30 accepted items (~2KB each = ~60KB total)
  const trimmedAccepted = updatedAccepted.slice(-30)

  // Re-learn style from ALL sources: scanned posts (most important), accepted content, and edits
  const scannedPosts = preferences.scannedPosts || []
  const edits = preferences.edits || []
  const learnedStyle = combineAllLearningSources(scannedPosts, trimmedAccepted, edits)

  updateSettings({
    contentPreferences: {
      ...preferences,
      acceptedContent: trimmedAccepted,
      learnedStyle,
    },
  })
}

/**
 * Use AI to analyze content and extract style preferences
 * Used for scanned posts and accepted content
 */
export async function analyzeContentWithAI(
  content: string,
  contentType: 'post' | 'email' | 'ad',
  platform: string,
  apiKey?: string
): Promise<{
  preferences: Partial<LearnedStyle>
  insights: string[]
}> {
  try {
    console.log('[AI Content Analysis] Starting analyzeContentWithAI...')
    console.log('[AI Content Analysis] API key provided:', !!apiKey)
    
    if (!apiKey) {
      console.warn('[AI Content Analysis] No API key provided')
      return { preferences: {}, insights: [] }
    }

    console.log('[AI Content Analysis] Initializing Google Generative AI...')
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    console.log('[AI Content Analysis] Google Generative AI initialized successfully')
    
    const analysisPrompt = `Analyze the content below and extract style preferences in JSON format.

CONTENT: ${content}

CONTEXT: ${contentType} for ${platform}

TASK: Analyze this content and identify the user's style preferences:
1. Tone (enthusiastic, professional, personal, casual, etc.)
2. Content length (short, medium, long)
3. Hashtag usage (none, minimal, moderate, heavy)
4. Emoji usage (none, minimal, moderate)
5. Structure patterns (question-based, benefit-focused, list-based, etc.)
6. Call-to-action style

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "preferences": {
    "tone": ["enthusiastic", "personal"],
    "length": "medium",
    "hashtagUsage": "minimal",
    "emojiUsage": "none",
    "structure": ["question-based", "benefit-focused"],
    "ctaStyle": ["learn more", "get started"]
  },
  "insights": ["insight 1 about style", "insight 2 about patterns"]
}

CRITICAL: Return ONLY the JSON object, nothing else.`

    // Try multiple models in order of preference
    const modelNames = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro']
    let lastError: any = null
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(analysisPrompt)
        const response = await result.response
        const text = response.text()
        
        console.log(`[AI Content Analysis] Model ${modelName} response length:`, text.length)
        
        // Try to parse JSON from response
        let jsonText: string | null = null
        
        // Try markdown code block first
        const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/s)
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonText = codeBlockMatch[1].trim()
        } else {
          // Try balanced brace matching
          let braceCount = 0
          let startIdx = -1
          for (let i = 0; i < text.length; i++) {
            if (text[i] === '{') {
              if (startIdx === -1) startIdx = i
              braceCount++
            } else if (text[i] === '}') {
              braceCount--
              if (braceCount === 0 && startIdx !== -1) {
                jsonText = text.substring(startIdx, i + 1)
                break
              }
            }
          }
          
          // Fallback: regex
          if (!jsonText) {
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch && jsonMatch[0]) {
              jsonText = jsonMatch[0]
            }
          }
        }
        
        if (jsonText && jsonText.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(jsonText)
            console.log('[AI Content Analysis] Successfully parsed JSON')
            
            const result = {
              preferences: parsed.preferences || {},
              insights: parsed.insights || [],
            }
            
            // Filter out empty strings
            const validInsights = (result.insights || []).filter((i: string) => i && i.trim().length > 0)
            result.insights = validInsights
            
            if (Object.keys(result.preferences).length > 0 || result.insights.length > 0) {
              console.log('[AI Content Analysis] ✅ Success - got meaningful results')
              return result
            }
            
            lastError = new Error('AI returned empty results')
            continue
          } catch (parseError: any) {
            console.error(`[AI Content Analysis] JSON parse error:`, parseError.message)
            lastError = parseError
            continue
          }
        } else {
          console.warn(`[AI Content Analysis] No valid JSON found in response`)
          lastError = new Error('No JSON found in response')
          continue
        }
      } catch (modelError: any) {
        console.warn(`[AI Content Analysis] Model ${modelName} failed:`, modelError.message)
        lastError = modelError
        
        // Check for quota/rate limit errors
        const errorMessage = modelError.message || String(modelError)
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          throw modelError
        }
        
        if (!modelError.message?.includes('not found') && !modelError.message?.includes('404')) {
          break
        }
      }
    }
    
    console.warn('[AI Content Analysis] All models failed, returning empty results')
    return { preferences: {}, insights: [] }
  } catch (error: any) {
    console.error('[AI Content Analysis] Fatal error:', error)
    const errorMessage = error?.message || String(error)
    if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
      throw new Error('Invalid API key - please check your Gemini API key in Settings')
    }
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      throw error
    }
  }
  
  return { preferences: {}, insights: [] }
}
