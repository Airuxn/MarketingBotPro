/**
 * Analyzes content from reference links to extract style patterns
 * For production, you'd want a backend API to handle CORS and scraping
 */

export interface StyleAnalysis {
  tone: string[]
  structure: string[]
  commonPhrases: string[]
  hashtagStyle: string[]
  callToAction: string[]
  length: { min: number; max: number; average: number }
  emojiUsage: boolean
  formatting: string[]
}

export async function analyzeContentFromUrl(url: string): Promise<StyleAnalysis | null> {
  try {
    // In production, this would call a backend API that handles CORS
    // For now, we'll use a proxy or direct fetch if CORS allows
    const response = await fetch(`/api/analyze-content?url=${encodeURIComponent(url)}`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch content')
    }

    const data = await response.json()
    return analyzeContent(data.content)
  } catch (error) {
    console.error('Error analyzing content:', error)
    // Fallback: return user-provided content if they paste it
    return null
  }
}

export function analyzeContent(content: string): StyleAnalysis {
  const lines = content.split('\n').filter((l) => l.trim())
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim())
  const words = content.split(/\s+/)

  // Extract hashtags
  const hashtags = content.match(/#\w+/g) || []
  const hashtagStyle = [...new Set(hashtags.map((h) => h.toLowerCase()))]

  // Detect tone indicators
  const tone: string[] = []
  const lowerContent = content.toLowerCase()

  if (lowerContent.includes('!') || lowerContent.match(/excited|amazing|incredible|wow/gi)) {
    tone.push('enthusiastic')
  }
  if (lowerContent.match(/please|thank you|appreciate/gi)) {
    tone.push('polite')
  }
  if (lowerContent.match(/limited|exclusive|now|today|hurry/gi)) {
    tone.push('urgent')
  }
  if (lowerContent.match(/you|your|we|our/gi)) {
    tone.push('personal')
  }
  if (lowerContent.match(/proven|results|data|statistics/gi)) {
    tone.push('professional')
  }

  // Detect structure
  const structure: string[] = []
  if (content.includes('\n\n') || content.split('\n').length > 3) {
    structure.push('multi-paragraph')
  }
  if (hashtags.length > 0) {
    structure.push('hashtags')
  }
  if (content.match(/^[A-Z][^.!?]*[.!?]$/gm)) {
    structure.push('sentence-based')
  }
  if (content.includes('•') || content.includes('-') || content.match(/^\d+\./gm)) {
    structure.push('list-based')
  }

  // Extract common phrases (2-3 word phrases)
  const phrases = new Map<string, number>()
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`.toLowerCase()
    phrases.set(phrase, (phrases.get(phrase) || 0) + 1)
  }
  const commonPhrases = Array.from(phrases.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase)

  // Detect CTAs
  const ctaPatterns = [
    /click here|learn more|get started|sign up|buy now|shop now|download|try now|join us|follow us/gi,
  ]
  const callToAction: string[] = []
  ctaPatterns.forEach((pattern) => {
    const matches = content.match(pattern)
    if (matches) {
      callToAction.push(...matches.map((m) => m.toLowerCase()))
    }
  })

  // Emoji usage
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
  const emojiUsage = emojiRegex.test(content)

  // Formatting
  const formatting: string[] = []
  if (content.match(/\*\*.*?\*\*/g)) formatting.push('bold')
  if (content.match(/_.*?_/g)) formatting.push('italic')
  if (content.match(/`.*?`/g)) formatting.push('code')
  if (content.includes('@')) formatting.push('mentions')

  // Length analysis
  const lengths = sentences.map((s) => s.split(/\s+/).length)
  const length = {
    min: Math.min(...lengths),
    max: Math.max(...lengths),
    average: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length),
  }

  return {
    tone: tone.length > 0 ? tone : ['neutral'],
    structure,
    commonPhrases,
    hashtagStyle,
    callToAction: [...new Set(callToAction)],
    length,
    emojiUsage,
    formatting,
  }
}

export function generateStylePrompt(analyses: StyleAnalysis[]): string {
  if (analyses.length === 0) return ''

  // Aggregate styles from multiple references
  const allTones = [...new Set(analyses.flatMap((a) => a.tone))]
  const allStructures = [...new Set(analyses.flatMap((a) => a.structure))]
  const allPhrases = analyses.flatMap((a) => a.commonPhrases)
  const allHashtags = [...new Set(analyses.flatMap((a) => a.hashtagStyle))]
  const allCTAs = [...new Set(analyses.flatMap((a) => a.callToAction))]
  const avgLength = Math.round(
    analyses.reduce((sum, a) => sum + a.length.average, 0) / analyses.length
  )
  const usesEmoji = analyses.some((a) => a.emojiUsage)

  let prompt = '\n\nSTYLE GUIDE (based on your previous posts):\n'
  prompt += `- Tone: ${allTones.join(', ')}\n`
  if (allStructures.length > 0) {
    prompt += `- Structure: ${allStructures.join(', ')}\n`
  }
  if (allPhrases.length > 0) {
    prompt += `- Common phrases: ${allPhrases.slice(0, 5).join(', ')}\n`
  }
  if (allHashtags.length > 0) {
    prompt += `- Hashtag style: ${allHashtags.slice(0, 5).join(', ')}\n`
  }
  if (allCTAs.length > 0) {
    prompt += `- Call-to-action style: ${allCTAs.slice(0, 3).join(', ')}\n`
  }
  prompt += `- Average sentence length: ${avgLength} words\n`
  if (usesEmoji) {
    prompt += `- Uses emojis: Yes\n`
  }
  prompt +=
    '\nIMPORTANT: Match this exact style, tone, and structure in the generated content.\n'

  return prompt
}
