'use client'

import { useState } from 'react'
import { Settings as SettingsIcon, Key, Building, Target, Save, Brain, TrendingUp, Eye, CheckCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { useLanguage } from '@/lib/language-context'
import { AdPlatformConnector } from '@/components/AdPlatformConnector'
import { SocialAccountConnector } from '@/components/SocialAccountConnector'
import { AdPlatform } from '@/lib/ad-platforms'
import { analyzeEdit, containsInappropriateContent } from '@/lib/content-learner'

export default function SettingsPage() {
  const { t } = useLanguage()
  const { settings, updateSettings } = useStore()
  const [formData, setFormData] = useState({
    geminiApiKey: settings.geminiApiKey || '',
    businessName: settings.businessName || '',
    businessType: settings.businessType || '',
    targetAudience: settings.targetAudience || '',
  })

  const handleSave = () => {
    updateSettings(formData)
    toast.success(t('success') + ': ' + t('saveSettings'))
  }

  return (
    <div className="min-h-screen relative">
      {/* Page Header */}
      <div className="glass-strong border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg blur-lg opacity-60"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg flex items-center justify-center shadow-glow">
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">{t('settingsTitle')}</h1>
              <p className="text-sm text-slate-300">{t('configureYourMarketingAutomation')}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="glass rounded-xl p-4 space-y-4 hover-lift">
          {/* API Key */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Key className="w-5 h-5 text-slate-400" />
              <label className="block text-sm font-medium text-slate-200">
                {t('geminiApiKey')}
              </label>
            </div>
            <input
              type="password"
              value={formData.geminiApiKey}
              onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
              placeholder="AIza..."
              className="w-full px-4 py-2 glass rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-slate-400"
            />
            <p className="mt-2 text-xs text-slate-400">
              {t('requiredForAI')}{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                aistudio.google.com
              </a>
            </p>
          </div>

          {/* Business Info */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Building className="w-5 h-5 text-slate-400" />
              <label className="block text-sm font-medium text-slate-200">
                {t('businessName')}
              </label>
            </div>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder={t('businessName')}
              className="w-full px-4 py-2 glass rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              {t('businessType')}
            </label>
            <input
              type="text"
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              placeholder="E.g., E-commerce, Consulting, SaaS, Restaurant"
              className="w-full px-4 py-2 glass rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-slate-400"
            />
          </div>

          {/* Target Audience */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Target className="w-5 h-5 text-slate-400" />
              <label className="block text-sm font-medium text-slate-200">
                {t('targetAudience')}
              </label>
            </div>
            <textarea
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              placeholder="E.g., Small business owners, Tech enthusiasts..."
              rows={3}
              className="w-full px-4 py-2 glass rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white placeholder:text-slate-400"
            />
            <p className="mt-2 text-xs text-slate-400">
              {t('describeIdealCustomers')}
            </p>
          </div>

          {/* Auto-scanning info */}
          <div className="glass border border-blue-500/30 rounded-lg p-4 bg-blue-500/10">
            <h4 className="text-sm font-medium text-blue-300 mb-2">✨ Automatic Scanning</h4>
            <p className="text-xs text-blue-200 mb-2">
              The app automatically scans your connected social media accounts to:
            </p>
            <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
              <li>Extract your posts and ads</li>
              <li>Analyze your writing style and tone</li>
              <li>Collect your brand images</li>
              <li>Learn your best-performing content patterns</li>
            </ul>
            <p className="text-xs text-blue-300 mt-2">
              No manual links needed - everything happens automatically when you connect your accounts!
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-700/50">
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save className="w-5 h-5" />
              <span>{t('saveSettings')}</span>
            </button>
          </div>
        </div>

        {/* Social Media Accounts - Auto-scanning */}
        <div className="mt-6 glass rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-3">Social Media Accounts</h3>
          <p className="text-sm text-slate-300 mb-4">
            Connect your accounts to automatically scan posts, images, and learn your style
          </p>
          <SocialAccountConnector />
        </div>

        {/* Ad Platform Connections */}
        <div className="mt-6 glass rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-3">Ad Platform Connections</h3>
          <p className="text-sm text-slate-300 mb-4">
            Connect your advertising accounts to create and publish real paid ads
          </p>
          <div className="space-y-4">
            {(['facebook', 'instagram', 'linkedin', 'twitter'] as AdPlatform[]).map((platform) => (
              <AdPlatformConnector
                key={platform}
                platform={platform}
                onConnected={() => {}}
              />
            ))}
          </div>
        </div>

        {/* History */}
        {settings.contentPreferences && (
          <div className="mt-6 glass rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-white">AI Learning History</h3>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear ALL learning data? This will reset the AI\'s learned preferences and cannot be undone.')) {
                    const { updateSettings } = useStore.getState()
                    updateSettings({
                      contentPreferences: {
                        acceptedContent: [],
                        rejectedContent: [],
                        edits: [],
                        scannedPosts: [],
                        learnedStyle: {},
                      },
                    })
                    toast.success('All learning data cleared. AI will start learning from scratch.')
                  }
                }}
                className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors px-3 py-1 border border-red-500/30 rounded hover:bg-red-500/10"
                title="Clear all learning data"
              >
                Clear All Learning Data
              </button>
            </div>
            
            {/* Learning Summary */}
            <div className="mb-6 p-4 glass rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="flex items-center space-x-2 mb-3">
                <Brain className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-semibold text-white">What the AI Has Learned From:</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="glass rounded p-2 border border-green-500/30">
                  <div className="font-semibold text-green-400">{settings.contentPreferences?.acceptedContent?.length || 0}</div>
                  <div className="text-slate-300">Accepted Content</div>
                  <div className="text-slate-400 mt-1">(Last 50 kept)</div>
                </div>
                <div className="glass rounded p-2 border border-red-500/30">
                  <div className="font-semibold text-red-400">{settings.contentPreferences?.rejectedContent?.length || 0}</div>
                  <div className="text-slate-300">Rejected Content</div>
                  <div className="text-slate-400 mt-1">(Last 20 kept)</div>
                </div>
                <div className="glass rounded p-2 border border-purple-500/30">
                  <div className="font-semibold text-purple-400">{settings.contentPreferences?.edits?.length || 0}</div>
                  <div className="text-slate-300">Content Edits</div>
                  <div className="text-slate-400 mt-1">(Last 30 kept)</div>
                </div>
                <div className="glass rounded p-2 border border-blue-500/30">
                  <div className="font-semibold text-blue-400">{settings.contentPreferences?.scannedPosts?.length || 0}</div>
                  <div className="text-slate-300">Scanned Posts</div>
                  <div className="text-slate-400 mt-1">(Last 50 kept)</div>
                </div>
              </div>
              {settings.contentPreferences.learnedStyle && Object.keys(settings.contentPreferences.learnedStyle).length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-500/30">
                  <div className="text-xs font-semibold text-slate-200 mb-1">Current Learned Preferences:</div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    {settings.contentPreferences.learnedStyle.tone && settings.contentPreferences.learnedStyle.tone.length > 0 && (
                      <div>• Tone: {settings.contentPreferences.learnedStyle.tone.join(', ')}</div>
                    )}
                    {settings.contentPreferences.learnedStyle.length && (
                      <div>• Length: {settings.contentPreferences.learnedStyle.length}</div>
                    )}
                    {settings.contentPreferences.learnedStyle.hashtagUsage && (
                      <div>• Hashtags: {settings.contentPreferences.learnedStyle.hashtagUsage}</div>
                    )}
                    {settings.contentPreferences.learnedStyle.emojiUsage && (
                      <div>• Emojis: {settings.contentPreferences.learnedStyle.emojiUsage}</div>
                    )}
                    {settings.contentPreferences.learnedStyle.ctaStyle && settings.contentPreferences.learnedStyle.ctaStyle.length > 0 && (
                      <div>• CTA Style: {settings.contentPreferences.learnedStyle.ctaStyle.join(', ')}</div>
                    )}
                    {settings.contentPreferences.learnedStyle.structure && settings.contentPreferences.learnedStyle.structure.length > 0 && (
                      <div>• Structure: {settings.contentPreferences.learnedStyle.structure.join(', ')}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
                {/* Accepted Content Log */}
                {settings.contentPreferences?.acceptedContent && settings.contentPreferences.acceptedContent.length > 0 && (
                  <div className="glass rounded-lg p-4 border border-green-500/30 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Accepted Content ({settings.contentPreferences.acceptedContent.length} total)</span>
                      </h4>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            const { updateSettings } = useStore.getState()
                            updateSettings({
                              contentPreferences: {
                                ...settings.contentPreferences,
                                acceptedContent: [],
                              },
                            })
                            toast.success('Accepted content history cleared. Learned preferences preserved from edits.')
                          }}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
                        >
                          Clear Accepted
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {(settings.contentPreferences?.acceptedContent || [])
                        .slice()
                        .reverse()
                        .map((accepted, idx) => {
                          const wordCount = accepted.content.split(/\s+/).length
                          const length = wordCount < 50 ? 'short' : wordCount < 150 ? 'medium' : 'long'
                          const hashtagCount = (accepted.content.match(/#\w+/g) || []).length
                          const hashtagUsage = hashtagCount === 0 ? 'none' : hashtagCount < 2 ? 'minimal' : hashtagCount < 5 ? 'moderate' : 'heavy'
                          const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
                          const emojiCount = (accepted.content.match(emojiRegex) || []).length
                          const emojiUsage = emojiCount === 0 ? 'none' : emojiCount < 2 ? 'minimal' : 'moderate'
                          
                          const toneKeywords = {
                            professional: ['professional', 'business', 'company', 'enterprise', 'corporate'],
                            friendly: ['friendly', 'warm', 'welcoming', 'hello', 'hi', 'thanks'],
                            casual: ['casual', 'hey', 'cool', 'awesome', 'amazing'],
                            personal: ['personal', 'we', 'our', 'team', 'community'],
                            relatable: ['relatable', 'you', 'your', 'real', 'authentic'],
                          }
                          const detectedTones: string[] = []
                          const lowerContent = accepted.content.toLowerCase()
                          Object.entries(toneKeywords).forEach(([tone, keywords]) => {
                            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                              if (!detectedTones.includes(tone)) {
                                detectedTones.push(tone)
                              }
                            }
                          })
                          
                          const ctaPatterns = ['click', 'learn more', 'get started', 'sign up', 'buy now', 'shop now', 'download', 'try', 'visit']
                          const detectedCTAs = ctaPatterns.filter(pattern => lowerContent.includes(pattern))
                          
                          const learningPoints: string[] = []
                          if (detectedTones.length > 0) {
                            learningPoints.push(`Tone: ${detectedTones.join(', ')}`)
                          }
                          if (length) {
                            learningPoints.push(`Length: ${length}`)
                          }
                          if (hashtagUsage !== 'none') {
                            learningPoints.push(`Hashtags: ${hashtagUsage}`)
                          }
                          if (emojiUsage !== 'none') {
                            learningPoints.push(`Emojis: ${emojiUsage}`)
                          }
                          if (detectedCTAs.length > 0) {
                            learningPoints.push(`CTA: ${detectedCTAs.slice(0, 2).join(', ')}`)
                          }
                          
                          return (
                            <div key={idx} className="border-l-2 border-green-400/50 pl-3 py-2 glass rounded-r bg-green-500/10">
                              <div className="text-xs text-slate-400 mb-2">
                                {new Date(accepted.acceptedAt || Date.now()).toLocaleDateString()} - {accepted.platform} ({accepted.contentType})
                              </div>
                              <div className="text-xs text-slate-200 mb-2">
                                <div className="font-semibold text-green-400 mb-1">Accepted Content:</div>
                                <div className="text-slate-300 line-clamp-2">{accepted.content}</div>
                              </div>
                              {learningPoints.length > 0 && (
                                <div className="text-xs mb-2 mt-2 p-2 glass rounded border border-green-500/30 bg-green-500/10">
                                  <div className="font-semibold text-green-400 mb-1">✓ AI Learned:</div>
                                  <div className="text-green-300 space-y-0.5">
                                    {learningPoints.map((point, i) => (
                                      <div key={i}>• {point}</div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Recent Edits */}
                {settings.contentPreferences.edits && settings.contentPreferences.edits.length > 0 && (
                  <div className="glass rounded-lg p-4 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-purple-400" />
                        <span>Recent Edits ({settings.contentPreferences.edits.length} total)</span>
                      </h4>
                      {settings.contentPreferences.edits && settings.contentPreferences.edits.length > 0 && (
                        <button
                          onClick={() => {
                            const { updateSettings } = useStore.getState()
                            updateSettings({
                              contentPreferences: {
                                ...settings.contentPreferences,
                                acceptedContent: settings.contentPreferences?.acceptedContent || [],
                                rejectedContent: settings.contentPreferences?.rejectedContent || [],
                                edits: [],
                              },
                            })
                            toast.success('Edit history cleared')
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
                          title="Clear edit history"
                        >
                          Clear Edits
                        </button>
                      )}
                    </div>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {(settings.contentPreferences?.edits || [])
                        .slice()
                        .reverse()
                        .map((edit, idx) => {
                        const ruleBasedAnalysis = analyzeEdit(edit)
                        const analysis = {
                          changes: (edit as any).aiInsights && (edit as any).aiInsights.length > 0 
                            ? (edit as any).aiInsights 
                            : ruleBasedAnalysis.changes,
                          preferences: (edit as any).aiPreferences || ruleBasedAnalysis.preferences,
                          issues: (edit as any).aiIssues && (edit as any).aiIssues.length > 0 
                            ? (edit as any).aiIssues 
                            : ruleBasedAnalysis.issues,
                          removedText: (edit as any).removedText || ruleBasedAnalysis.removedText,
                          addedText: (edit as any).addedText || ruleBasedAnalysis.addedText,
                          modifiedText: (edit as any).modifiedText || ruleBasedAnalysis.modifiedText,
                          whyBetter: (edit as any).whyBetter,
                        }
                        const meaningfulChanges = analysis.changes.map((change: string) => {
                          if (change.includes('inappropriate content was added')) {
                            return 'User added inappropriate content - not learning from this'
                          }
                          if (change.includes('not used for marketing learning')) {
                            return change
                          }
                          return change
                        })
                        const learningPoints: string[] = []
                        if (analysis.preferences.tone && analysis.preferences.tone.length > 0) {
                          learningPoints.push(`Will use ${analysis.preferences.tone.join(', ')} tone`)
                        }
                        if (analysis.preferences.length) {
                          learningPoints.push(`Will prefer ${analysis.preferences.length} content`)
                        }
                        if (analysis.preferences.hashtagUsage) {
                          learningPoints.push(`Will use ${analysis.preferences.hashtagUsage} hashtags`)
                        }
                        if (analysis.preferences.emojiUsage) {
                          learningPoints.push(`Will use ${analysis.preferences.emojiUsage} emojis`)
                        }
                        if (!analysis.preferences.hashtagUsage && meaningfulChanges.some((c: string) => c.toLowerCase().includes('hashtag'))) {
                          const hashtagChange = meaningfulChanges.find((c: string) => c.toLowerCase().includes('hashtag'))
                          if (hashtagChange?.toLowerCase().includes('removed')) {
                            learningPoints.push('Will use minimal or no hashtags')
                          } else if (hashtagChange?.toLowerCase().includes('added')) {
                            learningPoints.push('Will use hashtags')
                          }
                        }
                        if (!analysis.preferences.emojiUsage && meaningfulChanges.some((c: string) => c.toLowerCase().includes('emoji'))) {
                          const emojiChange = meaningfulChanges.find((c: string) => c.toLowerCase().includes('emoji'))
                          if (emojiChange?.toLowerCase().includes('removed')) {
                            learningPoints.push('Will use none or minimal emojis')
                          } else if (emojiChange?.toLowerCase().includes('added')) {
                            learningPoints.push('Will use emojis')
                          }
                        }
                        if (analysis.preferences.structure && analysis.preferences.structure.length > 0) {
                          learningPoints.push(`Will ${analysis.preferences.structure.join(', ')}`)
                        }
                        
                        // Add all issues as learning points (both positive and negative learning)
                        analysis.issues.forEach((issue: string) => {
                          // Format issues as learning points
                          let formattedIssue = issue
                          
                          // Convert common patterns to learning format
                          if (issue.includes('avoid') || issue.includes('dislikes') || issue.includes('removes')) {
                            // Negative learning - what to avoid
                            formattedIssue = issue
                              .replace(/user\s+(dislikes|removes)\s*/i, '')
                              .replace(/avoid\s*/i, '')
                              .trim()
                            if (formattedIssue && !formattedIssue.startsWith('Will avoid:')) {
                              learningPoints.push(`Will avoid: ${formattedIssue}`)
                            }
                          } else if (issue.includes('too')) {
                            // Something was too much - learn to avoid
                            formattedIssue = issue
                              .replace(/content\s+was\s+too\s*/i, '')
                              .replace(/language\s+was\s+too\s*/i, '')
                              .replace(/tone\s+was\s+too\s*/i, '')
                              .trim()
                            if (formattedIssue) {
                              learningPoints.push(`Will avoid: ${formattedIssue}`)
                            }
                          } else if (issue.includes('lacked') || issue.includes('was missing') || issue.includes('missing')) {
                            // Something was missing - learn to include
                            formattedIssue = issue
                              .replace(/content\s+(lacked|was missing|missing)\s*/i, '')
                              .trim()
                            if (formattedIssue) {
                              learningPoints.push(`Will include: ${formattedIssue}`)
                            }
                          } else if (issue.includes('prefers')) {
                            // User preference - positive learning
                            formattedIssue = issue
                              .replace(/user\s+prefers\s*/i, '')
                              .trim()
                            if (formattedIssue) {
                              learningPoints.push(`Will prefer: ${formattedIssue}`)
                            }
                          } else if (issue.includes('not enough')) {
                            // Not enough of something - learn to include more
                            formattedIssue = issue.replace(/not enough\s*/i, '').trim()
                            if (formattedIssue) {
                              learningPoints.push(`Will include more: ${formattedIssue}`)
                            }
                          } else {
                            // Generic issue - format as learning
                            if (issue.length > 0 && !issue.includes('DO NOT generate')) {
                              // Skip very negative/inappropriate warnings
                              learningPoints.push(`Will avoid: ${issue}`)
                            }
                          }
                        })
                        return (
                          <div key={idx} className="border-l-2 border-purple-400/50 pl-3 py-2 glass rounded-r bg-purple-500/10">
                            <div className="text-xs text-slate-400 mb-2">
                              {new Date(edit.editedAt).toLocaleDateString()} - {edit.platform} ({edit.contentType})
                            </div>
                            {/* Always show what was changed - either specific changes or removed/added/modified text */}
                            {(meaningfulChanges.length > 0 || (analysis.removedText && analysis.removedText.length > 0) || (analysis.addedText && analysis.addedText.length > 0) || (analysis.modifiedText && analysis.modifiedText.length > 0)) && (
                              <div className="text-xs text-slate-200 space-y-1 mb-2">
                                <div className="font-semibold text-purple-400 mb-1">What you changed:</div>
                                {meaningfulChanges.length > 0 ? (
                                  meaningfulChanges.slice(0, 5).map((change: string, i: number) => (
                                    <div key={i} className="flex items-start space-x-1">
                                      <span className="text-purple-600">•</span>
                                      <span>{change}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-gray-500 italic">
                                    {analysis.removedText && analysis.removedText.length > 0 && `Removed ${analysis.removedText.length} section${analysis.removedText.length > 1 ? 's' : ''}`}
                                    {analysis.addedText && analysis.addedText.length > 0 && `${analysis.removedText && analysis.removedText.length > 0 ? ', ' : ''}Added ${analysis.addedText.length} section${analysis.addedText.length > 1 ? 's' : ''}`}
                                    {analysis.modifiedText && analysis.modifiedText.length > 0 && `${(analysis.removedText && analysis.removedText.length > 0) || (analysis.addedText && analysis.addedText.length > 0) ? ', ' : ''}Modified ${analysis.modifiedText.length} section${analysis.modifiedText.length > 1 ? 's' : ''}`}
                                  </div>
                                )}
                              </div>
                            )}
                            {(edit as any).aiAnalysisFailed && (edit as any).aiAnalysisError && (
                              <div className={`text-xs rounded px-2 py-1 mb-2 ${
                                (edit as any).aiAnalysisError.toLowerCase().includes('quota') || 
                                (edit as any).aiAnalysisError.toLowerCase().includes('rate limit') ||
                                (edit as any).aiAnalysisError.toLowerCase().includes('exceeded') ||
                                (edit as any).aiAnalysisError.toLowerCase().includes('free tier')
                                  ? 'text-red-400 glass border border-red-500/30 bg-red-500/10'
                                  : 'text-amber-400 glass border border-amber-500/30 bg-amber-500/10'
                              }`}>
                                  {((edit as any).aiAnalysisError.toLowerCase().includes('quota') ||
                                  (edit as any).aiAnalysisError.toLowerCase().includes('rate limit') ||
                                  (edit as any).aiAnalysisError.toLowerCase().includes('exceeded') ||
                                  (edit as any).aiAnalysisError.toLowerCase().includes('free tier')) ? (
                                  <>
                                    ⚠️ <strong>Rate Limit / Quota Issue:</strong> {(edit as any).aiAnalysisError}. <a href="https://ai.google.dev/pricing" target="_blank" rel="noopener noreferrer" className="underline font-medium text-red-300 hover:text-red-200">Check your quota</a> or wait before trying again. Showing rule-based analysis.
                                  </>
                                ) : (
                                  <>
                                    ℹ️ {(edit as any).aiAnalysisError}. Showing rule-based analysis.
                                  </>
                                )}
                              </div>
                            )}
                            {learningPoints.length > 0 && (
                              <div className="text-xs mb-2 mt-2 p-2 glass rounded border border-green-500/30 bg-green-500/10">
                                <div className="font-semibold text-green-400 mb-1">
                                  {(edit as any).aiInsights && (edit as any).aiInsights.length > 0 || (edit as any).whyBetter
                                    ? '✓ AI Learned:'
                                    : '✓ Rule-based Analysis - AI Learned:'}
                                </div>
                                <div className="text-green-300 space-y-0.5">
                                  {learningPoints.map((point, i) => (
                                    <div key={i}>• {point}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {analysis.whyBetter && (
                              <div className="text-xs mb-2 p-2 glass rounded border border-blue-500/30 bg-blue-500/10">
                                <div className="font-semibold text-blue-400 mb-1">💡 Why This Is Better:</div>
                                <div className="text-blue-300">{analysis.whyBetter}</div>
                              </div>
                            )}
                            {(!(edit as any).aiInsights || (edit as any).aiInsights.length === 0) && 
                             (!(edit as any).aiPreferences || Object.keys((edit as any).aiPreferences).length === 0) &&
                             !(edit as any).whyBetter &&
                             !(edit as any).aiAnalysisFailed &&
                             settings.geminiApiKey &&
                             (analysis.addedText && analysis.addedText.length > 0 || analysis.removedText && analysis.removedText.length > 0) && (
                              <div className="text-xs text-amber-600 italic mt-1">
                                Note: AI analysis was attempted but returned no insights. Showing rule-based analysis.
                              </div>
                            )}
                            {!settings.geminiApiKey && (analysis.addedText && analysis.addedText.length > 0 || analysis.removedText && analysis.removedText.length > 0) && (
                              <div className="text-xs text-blue-600 italic mt-1">
                                Note: No Gemini API key configured. Add your API key in Settings for AI-powered insights.
                              </div>
                            )}
                            <div className="mt-2 space-y-1">
                              {analysis.removedText && analysis.removedText.length > 0 && (
                                <div className="text-xs space-y-0.5">
                                  <div className="text-red-600 font-medium">Removed:</div>
                                  {analysis.removedText.map((text: string, i: number) => (
                                    <div key={i} className="text-slate-200 ml-2 font-mono glass px-1 rounded bg-red-500/20">
                                      &quot;{text}&quot;
                                    </div>
                                  ))}
                                </div>
                              )}
                              {analysis.addedText && analysis.addedText.length > 0 && (
                                <div className="text-xs space-y-0.5">
                                  <div className="text-green-400 font-medium">Added:</div>
                                  {analysis.addedText.map((text: string, i: number) => (
                                    <div key={i} className="text-slate-200 ml-2 font-mono glass px-1 rounded bg-green-500/20">
                                      &quot;{text}&quot;
                                    </div>
                                  ))}
                                </div>
                              )}
                              {analysis.modifiedText && analysis.modifiedText.length > 0 && (
                                <div className="text-xs space-y-0.5 mt-1">
                                  <div className="text-blue-400 font-medium">Modified:</div>
                                  {analysis.modifiedText.slice(0, 2).map((mod: { original: string; modified: string }, i: number) => (
                                    <div key={i} className="text-slate-200 ml-2 space-y-0.5">
                                      <div className="font-mono glass px-1 rounded line-through text-red-400 bg-red-500/20">
                                        &quot;{mod.original}&quot;
                                      </div>
                                      <div className="font-mono glass px-1 rounded text-green-400 bg-green-500/20">
                                        → &quot;{mod.modified}&quot;
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Rejected Content Log */}
                {settings.contentPreferences?.rejectedContent && settings.contentPreferences.rejectedContent.length > 0 && (
                  <div className="glass rounded-lg p-4 border border-red-500/30 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                        <span className="text-red-400">✗</span>
                        <span>Rejected Content ({settings.contentPreferences.rejectedContent.length} total)</span>
                      </h4>
                      <button
                        onClick={() => {
                          const { updateSettings } = useStore.getState()
                          updateSettings({
                            contentPreferences: {
                              ...settings.contentPreferences,
                              acceptedContent: settings.contentPreferences?.acceptedContent || [],
                              rejectedContent: [],
                            },
                          })
                          toast.success('Rejected content history cleared')
                        }}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
                      >
                        Clear Rejected
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {(settings.contentPreferences?.rejectedContent || [])
                        .slice()
                        .reverse()
                        .map((rejected, idx) => (
                          <div key={idx} className="border-l-2 border-red-400/50 pl-3 py-2 glass rounded-r bg-red-500/10">
                            <div className="text-xs text-slate-400 mb-1">
                              {new Date(rejected.rejectedAt || Date.now()).toLocaleDateString()} - {rejected.platform} ({rejected.contentType})
                            </div>
                            <div className="text-xs text-slate-300 line-clamp-2">{rejected.content}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Scanned Posts Log */}
                {settings.contentPreferences?.scannedPosts && settings.contentPreferences.scannedPosts.length > 0 && (
                  <div className="glass rounded-lg p-4 border border-blue-500/30 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        <span>Scanned Social Media Posts ({settings.contentPreferences.scannedPosts.length} total)</span>
                      </h4>
                      <button
                        onClick={() => {
                          const { updateSettings } = useStore.getState()
                          updateSettings({
                            contentPreferences: {
                              ...settings.contentPreferences,
                              acceptedContent: settings.contentPreferences?.acceptedContent || [],
                              rejectedContent: settings.contentPreferences?.rejectedContent || [],
                              scannedPosts: [],
                            },
                          })
                          toast.success('Scanned posts history cleared. Style patterns learned from them are preserved in learned preferences.')
                        }}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
                      >
                        Clear Scanned Posts
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {(settings.contentPreferences?.scannedPosts || [])
                        .slice()
                        .reverse()
                        .map((post, idx) => (
                          <div key={idx} className="border-l-2 border-blue-400/50 pl-3 py-2 glass rounded-r bg-blue-500/10">
                            <div className="text-xs text-slate-400 mb-1">
                              {new Date(post.createdAt).toLocaleDateString()} - {post.platform}
                            </div>
                            <div className="text-xs text-slate-300 line-clamp-2 mb-1">{post.content}</div>
                            {post.styleAnalysis && (
                              <div className="text-xs text-blue-300 mt-1">
                                Learned: {post.styleAnalysis.tone?.join(', ') || 'N/A'} tone, {post.styleAnalysis.length?.average || 0} avg words
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center pt-4 border-t border-slate-700/50">
                  <div className="glass rounded-lg p-3 border border-slate-700/50">
                    <div className="text-2xl font-bold text-green-400">
                      {(settings.contentPreferences?.acceptedContent || [])?.length || 0}
                    </div>
                    <div className="text-xs text-slate-300 mt-1">Accepted</div>
                  </div>
                  <div className="glass rounded-lg p-3 border border-slate-700/50">
                    <div className="text-2xl font-bold text-blue-400">
                      {settings.contentPreferences.edits?.length || 0}
                    </div>
                    <div className="text-xs text-slate-300 mt-1">Edits</div>
                  </div>
                  <div className="glass rounded-lg p-3 border border-slate-700/50">
                    <div className="text-2xl font-bold text-red-400">
                      {settings.contentPreferences.rejectedContent?.length || 0}
                    </div>
                    <div className="text-xs text-slate-300 mt-1">Rejected</div>
                  </div>
                  <div className="glass rounded-lg p-3 border border-slate-700/50">
                    <div className="text-2xl font-bold text-purple-400">
                      {settings.contentPreferences.scannedPosts?.length || 0}
                    </div>
                    <div className="text-xs text-slate-300 mt-1">Scanned</div>
                  </div>
                </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 glass rounded-xl p-4 border border-blue-500/30 bg-blue-500/10">
          <h3 className="text-lg font-semibold text-white mb-2">{t('gettingStarted')}</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-200">
            <li>{t('addGeminiKey')}</li>
            <li>{t('fillBusinessInfo')}</li>
            <li>{t('startCreating')}</li>
            <li>{t('automateMarketing')}</li>
            <li>Connect ad platforms to create real paid ads</li>
          </ol>
        </div>
      </main>
    </div>
  )
}
