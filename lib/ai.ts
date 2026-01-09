import { GoogleGenerativeAI } from '@google/generative-ai'
import { containsInappropriateContent } from './content-learner'

export async function generateContent(
  prompt: string,
  type: 'post' | 'email' | 'ad',
  apiKey?: string,
  learningPrompt?: string,
  language: 'en' | 'fr' | 'nl' = 'en',
  tone?: 'personal' | 'neutral' | 'professional' | 'marketing'
): Promise<string> {
  if (!apiKey) {
    throw new Error('Google Gemini API key is required')
  }

  const genAI = new GoogleGenerativeAI(apiKey)

    const getLanguageInstruction = (lang: 'en' | 'fr' | 'nl'): string => {
    switch (lang) {
      case 'fr':
        return '\n\nIMPORTANT: Generate ALL content in French (Français). Write naturally in French, using proper French grammar, vocabulary, and cultural context. All text, including subject lines, body content, hashtags, and calls-to-action must be in French.'
      case 'nl':
        return '\n\nIMPORTANT: Generate ALL content in Dutch (Nederlands). Write naturally in Dutch, using proper Dutch grammar, vocabulary, and cultural context. All text, including subject lines, body content, hashtags, and calls-to-action must be in Dutch.'
      default:
        return '\n\nIMPORTANT: Generate ALL content in English. Write naturally in English, using proper English grammar and vocabulary.'
    }
  }

  const getToneInstruction = (tone?: 'personal' | 'neutral' | 'professional' | 'marketing'): string => {
    if (!tone || tone === 'professional') {
      return ''
    }
    
    switch (tone) {
      case 'personal':
        return '\n\nTONE: Write in a personal, friendly, and warm tone - like you\'re writing to friends or family. Use casual language, be conversational, and show genuine care. You can use contractions, friendly expressions, and a more relaxed style while still being respectful.'
      case 'neutral':
        return '\n\nTONE: Write in a neutral, balanced tone - suitable for general communication with people you don\'t know well. Be polite, clear, and straightforward without being too formal or too casual. Maintain a friendly but professional balance.'
      case 'marketing':
        return '\n\nTONE: Write in a marketing-focused, promotional tone designed to convert and drive action. Use persuasive language, highlight benefits, create urgency when appropriate, and include clear calls-to-action. Make it compelling and conversion-oriented while maintaining professionalism.'
      default:
        return ''
    }
  }

  const systemPrompts = {
    post: `You are a professional social media marketing expert. Create engaging, authentic social media posts that are:
- Concise and attention-grabbing
- Include relevant hashtags
- Call-to-action when appropriate
- Professional yet friendly tone
- Optimized for engagement
- IMPORTANT: The user will provide REAL images from their business. Your job is to write text that complements these authentic images. Never suggest creating fake or AI-generated images. Always work with their real brand images.

CRITICAL CONTENT RULES:
- NEVER use profanity, offensive language, inappropriate content, or unprofessional language
- NEVER use words like: fuck, shit, bitch, asshole, damn, hell, pussy, dick, cunt, loser, stupid, idiot, or any variations
- NEVER use phrases that are inappropriate, offensive, or unprofessional in any context
- ALWAYS maintain a professional, appropriate tone suitable for business marketing
- If the user's request seems to suggest inappropriate content, generate professional alternative content instead

CRITICAL: Generate ONLY the actual post content. Do NOT include any meta-descriptions, explanations, or introductory text. Output ONLY the post text itself, nothing else.`,
    email: `You are a professional email expert. Create compelling email content that is:
- Clear and concise
- Appropriate for the context and purpose indicated by the user
- Includes a strong subject line suggestion
- Has a clear purpose and message
- Optimized for the intended audience

CRITICAL CONTENT RULES:
- Analyze the campaign name/context provided by the user to determine if this is:
  * A personal email (e.g., apologies, personal updates, invitations, personal messages) - write naturally and appropriately
  * A marketing email (e.g., product launches, newsletters, promotions) - include marketing elements and call-to-action
  * A business email (e.g., professional communication, updates) - maintain professional tone
- Follow the tone specified by the user (personal = friendly/casual, neutral = balanced, professional = business/marketing)
- NEVER use profanity, offensive language, inappropriate content, or unprofessional language
- NEVER use words like: fuck, shit, bitch, asshole, damn, hell, pussy, dick, cunt, loser, stupid, idiot, or any variations
- NEVER use phrases that are inappropriate, offensive, or unprofessional in any context
- ALWAYS maintain an appropriate tone suitable for the context
- If the user's request seems to suggest inappropriate content, generate professional alternative content instead

CRITICAL: Generate ONLY the actual email content. Do NOT include any meta-descriptions, explanations, or introductory text. Output ONLY the email content itself, nothing else.`,
    ad: `You are a professional advertising copywriter. Create persuasive ad copy that is:
- Attention-grabbing
- Highlights key benefits
- Includes a strong call-to-action
- Optimized for conversions
- Compelling and concise

CRITICAL CONTENT RULES:
- NEVER use profanity, offensive language, inappropriate content, or unprofessional language
- NEVER use words like: fuck, shit, bitch, asshole, damn, hell, pussy, dick, cunt, loser, stupid, idiot, or any variations
- NEVER use phrases that are inappropriate, offensive, or unprofessional in any context
- ALWAYS maintain a professional, appropriate tone suitable for business marketing
- If the user's request seems to suggest inappropriate content, generate professional alternative content instead

CRITICAL: Generate ONLY the actual ad copy. Do NOT include any meta-descriptions, explanations, or introductory text. Output ONLY the ad copy itself, nothing else.`,
  }

  // Combine system prompt with user prompt and learning prompt
  const languageInstruction = getLanguageInstruction(language)
  const toneInstruction = getToneInstruction(tone)
  const fullPrompt = `${systemPrompts[type]}${languageInstruction}${toneInstruction}\n\nUser Request:\n${prompt}${learningPrompt ? '\n\n' + learningPrompt : ''}\n\nRemember: Output ONLY the content itself, no explanations or meta-text.`

  // Try the latest and best models in order of preference
  // 1. Gemini 2.5 Flash (latest, best performance, hybrid reasoning)
  // 2. Gemini 2.0 Flash (excellent performance, low latency)
  // 3. Gemini 1.5 Flash (stable, fast)
  // 4. Gemini Pro (fallback, widely available)
  const modelNames = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-pro'
  ]

  let lastError: any = null

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(fullPrompt)
      const response = await result.response
      const text = response.text()
      
      if (text) {
        // CRITICAL: Reject inappropriate content immediately - don't try other models
        console.log(`[AI] Checking generated content for inappropriate language. Content preview:`, text.substring(0, 200))
        if (containsInappropriateContent(text)) {
          console.error(`⚠ Generated content contains inappropriate content - REJECTED`)
          console.error(`[AI] Full rejected content:`, text)
          throw new Error('Generated content contains inappropriate language and has been rejected. Please modify your prompt to request professional, appropriate content.')
        }
        
        console.log(`✓ Successfully used model: ${modelName}`)
        return text
      }
    } catch (error: any) {
      lastError = error
      console.log(`✗ Model ${modelName} failed, trying next...`)
      
      // If it's not a "model not found" error, don't try other models
      if (!error.message?.includes('not found') && !error.message?.includes('404')) {
        break
      }
    }
  }

  // If all models failed, provide helpful error message
  console.error('Google Gemini API error:', lastError)
  
  if (lastError?.message?.includes('not found') || lastError?.message?.includes('404')) {
    throw new Error(`No available Gemini models found. Please check that your API key has access to Gemini models in Google AI Studio.`)
  }
  if (lastError?.message?.includes('API key') || lastError?.message?.includes('401') || lastError?.message?.includes('403')) {
    throw new Error(`Invalid API key. Please check your Google Gemini API key in Settings.`)
  }
  
  throw new Error(`Failed to generate content: ${lastError?.message || 'Please check your API key and try again.'}`)
}

export async function generateMultipleVariations(
  prompt: string,
  count: number,
  apiKey?: string,
  language: 'en' | 'fr' | 'nl' = 'en'
): Promise<string[]> {
  if (!apiKey) {
    throw new Error('Google Gemini API key is required')
  }

  const variations: string[] = []
  
  for (let i = 0; i < count; i++) {
    try {
      const content = await generateContent(
        `${prompt}\n\nCreate variation ${i + 1} with a different angle or style.`,
        'post',
        apiKey,
        undefined,
        language
      )
      variations.push(content)
    } catch (error) {
      console.error(`Error generating variation ${i + 1}:`, error)
    }
  }

  return variations
}
