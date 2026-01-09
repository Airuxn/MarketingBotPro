// Test script to verify AI analysis is working
// Run with: node test-ai-analysis.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Get API key from environment or prompt
const apiKey = process.env.GEMINI_API_KEY || process.argv[2];

if (!apiKey) {
  console.error('❌ No API key provided. Set GEMINI_API_KEY env var or pass as argument.');
  console.error('Usage: node test-ai-analysis.js YOUR_API_KEY');
  process.exit(1);
}

async function testAIAnalysis() {
  console.log('🧪 Testing AI Analysis...\n');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test with a simple edit
    const originalContent = "Come and see us at our office! We have great deals.";
    const editedContent = "Visit our office! We have amazing deals.";
    
    const analysisPrompt = `You are an expert content analyst for marketing content. Your job is to deeply understand WHY the user made changes and what makes the new version better.

CRITICAL: Read and understand the ENTIRE original and edited content. Don't just look at keywords - understand the full meaning, context, and intent.

ORIGINAL CONTENT (what the AI generated):
${originalContent}

EDITED CONTENT (what the user changed it to):
${editedContent}

CONTEXT:
- Content Type: post
- Platform: twitter

ANALYSIS REQUIREMENTS:
1. Read the FULL original content - understand its complete meaning, tone, structure, and intent
2. Read the FULL edited content - understand what the user changed it to and why
3. Compare them holistically - what was the user trying to achieve?
4. Understand WHY changes were made:
   - What was wrong or lacking in the original?
   - What problem was the user solving?
   - What makes the edited version better/more effective?

SPECIFIC ANALYSIS:
- What specific text/phrases were removed? Why were they removed?
- What specific text/phrases were added? Why were they added?
- What was modified? How did it change? Why is the new version better?
- What does this reveal about the user's preferences for:
  * Tone (formal/casual/professional/personal)
  * Length (short/medium/long)
  * Specificity (vague vs specific details)
  * Structure (formatting, organization)
  * Language style (simple vs complex, direct vs indirect)

CRITICAL: You MUST ALWAYS provide insights. Analyze the changes deeply and provide meaningful analysis. Never return completely empty results.

Respond in this JSON format (ONLY return the JSON, no other text):
{
  "insights": ["Detailed insight about what changed and WHY", "Another insight if applicable"],
  "preferences": {
    "tone": ["tone preferences if tone changed"],
    "length": "short|medium|long",
    "hashtagUsage": "minimal|moderate|heavy",
    "emojiUsage": "none|minimal|moderate",
    "structure": ["structural preferences if structure changed"]
  },
  "issues": ["What was wrong with the original content"],
  "inappropriateAdded": true/false,
  "inappropriateRemoved": true/false,
  "whyBetter": "Explanation of why the edited version is better (1-2 sentences minimum)"
}

REQUIREMENTS:
- Provide at least 1-2 insights about what changed
- Provide "whyBetter" explanation (at least 1 sentence)
- Include preferences if you can identify any
- Include issues if you can identify what was wrong

IMPORTANT: Base your analysis on the FULL content meaning. Understand the complete context and intent.

Return ONLY valid JSON, no markdown, no explanations, just the JSON object.`;

    console.log('📤 Sending request to Gemini API...');
    console.log('📝 Original:', originalContent);
    console.log('📝 Edited:', editedContent);
    console.log('');
    
    // Try models in order
    const modelNames = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];
    
    for (const modelName of modelNames) {
      try {
        console.log(`🔄 Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(analysisPrompt);
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ Model ${modelName} responded!`);
        console.log(`📏 Response length: ${text.length} characters`);
        console.log(`📄 First 500 chars: ${text.substring(0, 500)}`);
        console.log('');
        
        // Try to parse JSON
        let jsonText = text;
        const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          jsonText = codeBlockMatch[1];
          console.log('📦 Found JSON in code block');
        } else {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonText = jsonMatch[0];
            console.log('📦 Found JSON in response');
          }
        }
        
        if (jsonText && jsonText.startsWith('{')) {
          try {
            const parsed = JSON.parse(jsonText);
            console.log('✅ Successfully parsed JSON!');
            console.log('');
            console.log('📊 Results:');
            console.log(`  - Insights: ${parsed.insights?.length || 0}`);
            console.log(`  - Preferences: ${Object.keys(parsed.preferences || {}).length} fields`);
            console.log(`  - Issues: ${parsed.issues?.length || 0}`);
            console.log(`  - Why Better: ${parsed.whyBetter ? 'Yes (' + parsed.whyBetter.length + ' chars)' : 'No'}`);
            console.log('');
            
            if (parsed.insights && parsed.insights.length > 0) {
              console.log('💡 Insights:');
              parsed.insights.forEach((insight, i) => {
                console.log(`  ${i + 1}. ${insight}`);
              });
              console.log('');
            }
            
            if (parsed.whyBetter) {
              console.log('✨ Why Better:');
              console.log(`  ${parsed.whyBetter}`);
              console.log('');
            }
            
            if (Object.keys(parsed.preferences || {}).length > 0) {
              console.log('🎯 Preferences:');
              console.log(JSON.stringify(parsed.preferences, null, 2));
              console.log('');
            }
            
            // Validate results
            const hasInsights = parsed.insights && parsed.insights.length > 0;
            const hasPreferences = parsed.preferences && Object.keys(parsed.preferences).length > 0;
            const hasWhyBetter = parsed.whyBetter && parsed.whyBetter.trim().length > 10;
            const hasIssues = parsed.issues && parsed.issues.length > 0;
            
            if (hasInsights || hasPreferences || hasWhyBetter || hasIssues) {
              console.log('✅ TEST PASSED: AI returned meaningful results!');
              return;
            } else {
              console.log('⚠️  TEST WARNING: AI returned empty results');
              console.log('📋 Full parsed result:');
              console.log(JSON.stringify(parsed, null, 2));
            }
          } catch (parseError) {
            console.error('❌ JSON parse error:', parseError.message);
            console.error('📄 Attempted to parse:', jsonText.substring(0, 200));
            continue;
          }
        } else {
          console.warn('⚠️  No JSON found in response');
          continue;
        }
      } catch (modelError) {
        console.error(`❌ Model ${modelName} failed:`, modelError.message);
        if (modelError.message?.includes('not found') || modelError.message?.includes('404')) {
          console.log('   (Model not found, trying next...)');
          continue;
        } else {
          console.error('   (Non-recoverable error)');
          throw modelError;
        }
      }
    }
    
    console.error('❌ TEST FAILED: All models failed or returned empty results');
    process.exit(1);
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAIAnalysis();
