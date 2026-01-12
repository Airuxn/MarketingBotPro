'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, MessageSquare, Mail, Users, Eye, Heart, MessageCircle, Share2, Clock, Hash, Image as ImageIcon, Zap, Calendar, Brain } from 'lucide-react'
import { useStore } from '@/lib/store'
import { analyzeContentPerformance, calculateEngagementRate, calculatePerformanceScore, ScannedPost } from '@/lib/content-performance-analyzer'
import { EngagementTracker } from '@/components/EngagementTracker'
import { analyzeEdit, combineAllLearningSources } from '@/lib/content-learner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AnalyticsPage() {
  const { stats, posts, emailCampaigns, leads, updatePost, settings, updateSettings } = useStore()
  const [selectedPost, setSelectedPost] = useState<string | null>(null)

  // Calculate additional metrics
  const scheduledPosts = posts.filter((p) => p.status === 'scheduled').length
  const postedCount = posts.filter((p) => p.status === 'posted').length
  const totalEmails = emailCampaigns.reduce((sum, c) => sum + c.recipients.length, 0)
  const convertedLeads = leads.filter((l) => l.status === 'converted').length

  // Calculate engagement metrics
  const postedPosts = posts.filter((p) => p.status === 'posted' && p.engagement)
  const totalViews = postedPosts.reduce((sum, p) => sum + (p.engagement?.views || 0), 0)
  const totalLikes = postedPosts.reduce((sum, p) => sum + (p.engagement?.likes || 0), 0)
  const totalComments = postedPosts.reduce((sum, p) => sum + (p.engagement?.comments || 0), 0)
  const totalShares = postedPosts.reduce((sum, p) => sum + (p.engagement?.shares || 0), 0)
  const totalReach = postedPosts.reduce((sum, p) => sum + (p.engagement?.reach || 0), 0)
  const avgEngagementRate = postedPosts.length > 0
    ? postedPosts.reduce((sum, p) => sum + calculateEngagementRate(p), 0) / postedPosts.length
    : 0

  // Get performance insights (include scanned posts from social media)
  const scannedPosts: ScannedPost[] = settings.contentPreferences?.scannedPosts || []
  const insights = analyzeContentPerformance(posts, scannedPosts)

  // IMPORTANT: Learn from scanned posts if they exist but learnedStyle is empty
  useEffect(() => {
    const scannedPosts = settings.contentPreferences?.scannedPosts || []
    const learnedStyle = settings.contentPreferences?.learnedStyle
    
    // If we have scanned posts but no learned style, learn from them NOW!
    if (scannedPosts.length > 0 && (!learnedStyle || Object.keys(learnedStyle).length === 0)) {
      console.log('[Analytics] Triggering learning from scanned posts on page load...')
      const existingPreferences = settings.contentPreferences || {
        acceptedContent: [],
        edits: [],
        scannedPosts: [],
      }
      
      const newLearnedStyle = combineAllLearningSources(
        scannedPosts,
        existingPreferences.acceptedContent,
        existingPreferences.edits
      )
      
      if (Object.keys(newLearnedStyle).length > 0) {
        console.log('[Analytics] Learned style from scanned posts:', newLearnedStyle)
        updateSettings({
          contentPreferences: {
            ...existingPreferences,
            learnedStyle: newLearnedStyle,
          },
        })
      } else {
        console.warn('[Analytics] Learning returned empty style. Check scanned posts structure.')
      }
    }
  }, [settings.contentPreferences?.scannedPosts?.length, settings.contentPreferences?.learnedStyle, updateSettings])

  const metrics = [
    {
      label: 'Total Views',
      value: totalViews.toLocaleString(),
      icon: Eye,
      gradient: 'from-blue-500 to-cyan-500',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Total Reach',
      value: totalReach.toLocaleString(),
      icon: TrendingUp,
      gradient: 'from-purple-500 to-pink-500',
      iconColor: 'text-purple-400',
    },
    {
      label: 'Avg Engagement',
      value: `${avgEngagementRate.toFixed(2)}%`,
      icon: Zap,
      gradient: 'from-green-500 to-emerald-500',
      iconColor: 'text-green-400',
    },
    {
      label: 'Total Likes',
      value: totalLikes.toLocaleString(),
      icon: Heart,
      gradient: 'from-red-500 to-rose-500',
      iconColor: 'text-red-400',
    },
    {
      label: 'Total Comments',
      value: totalComments.toLocaleString(),
      icon: MessageCircle,
      gradient: 'from-orange-500 to-amber-500',
      iconColor: 'text-orange-400',
    },
    {
      label: 'Total Shares',
      value: totalShares.toLocaleString(),
      icon: Share2,
      gradient: 'from-indigo-500 to-blue-500',
      iconColor: 'text-indigo-400',
    },
  ]

  const selectedPostData = selectedPost ? posts.find(p => p.id === selectedPost) : null

  return (
    <div className="min-h-screen relative bg-slate-900">
      {/* Page Header */}
      <div className="glass-strong border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg blur-lg opacity-60"></div>
              <div className="relative w-7 h-7 lg:w-10 lg:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-glow">
                <BarChart3 className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg lg:text-2xl font-bold text-gradient">Analytics Dashboard</h1>
              <p className="text-xs lg:text-sm text-slate-300 hidden sm:block">Track engagement and optimize your content</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* AI Performance Insights with Current Learned Preferences */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6">
          {/* AI Performance Insights - Left Side */}
          {insights.recommendations.length > 0 ? (
            <div className="relative glass rounded-xl p-3 lg:p-4 hover-lift border border-blue-500/30 shadow-glow-lg" style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.15)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-2 lg:mb-3">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <h2 className="text-base lg:text-lg font-bold text-white">AI Performance Insights</h2>
                </div>
                <div className="space-y-1.5 lg:space-y-2">
                  {insights.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                      <p className="text-xs lg:text-sm text-slate-200">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative glass rounded-xl p-3 lg:p-4 border border-blue-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-2 lg:mb-3">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <h2 className="text-base lg:text-lg font-bold text-white">AI Performance Insights</h2>
                </div>
                <div className="glass rounded-lg p-3 lg:p-4">
                  <p className="text-xs lg:text-sm text-slate-200 mb-2 lg:mb-3">
                    <strong>No data yet.</strong> To see AI Performance Insights, you need:
                  </p>
                  <ol className="text-xs lg:text-sm text-slate-300 space-y-1.5 lg:space-y-2 list-decimal list-inside">
                    <li><strong>Connect social media accounts</strong> - The app will automatically scan your existing posts and use their engagement data</li>
                    <li><strong>OR</strong> Mark posts as <strong>"Posted"</strong> and add engagement metrics manually</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          
          {/* Current Learned Preferences - Right Side */}
          {settings.contentPreferences?.learnedStyle && Object.keys(settings.contentPreferences.learnedStyle).length > 0 ? (
            <div className="relative glass rounded-xl p-3 lg:p-4 hover-lift border border-purple-500/30 shadow-glow-lg" style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.15)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-2 lg:mb-3">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <h2 className="text-base lg:text-lg font-bold text-white">AI Current Learned Preferences</h2>
                </div>
                <div className="space-y-1.5 lg:space-y-2">
                  {settings.contentPreferences.learnedStyle.length && (
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                      <p className="text-xs lg:text-sm text-slate-200">Content length: <span className="font-semibold capitalize">{settings.contentPreferences.learnedStyle.length}</span></p>
                    </div>
                  )}
                  {settings.contentPreferences.learnedStyle.tone && settings.contentPreferences.learnedStyle.tone.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                      <p className="text-xs lg:text-sm text-slate-200">Tone: <span className="font-semibold">{settings.contentPreferences.learnedStyle.tone.slice(0, 3).join(', ')}</span></p>
                    </div>
                  )}
                  {settings.contentPreferences.learnedStyle.hashtagUsage && (
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                      <p className="text-xs lg:text-sm text-slate-200">Hashtags: <span className="font-semibold capitalize">{settings.contentPreferences.learnedStyle.hashtagUsage}</span></p>
                    </div>
                  )}
                  {settings.contentPreferences.learnedStyle.emojiUsage && (
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                      <p className="text-xs lg:text-sm text-slate-200">Emojis: <span className="font-semibold capitalize">{settings.contentPreferences.learnedStyle.emojiUsage}</span></p>
                    </div>
                  )}
                  {settings.contentPreferences.learnedStyle.ctaStyle && settings.contentPreferences.learnedStyle.ctaStyle.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                      <p className="text-xs lg:text-sm text-slate-200">CTA style: <span className="font-semibold">{settings.contentPreferences.learnedStyle.ctaStyle.slice(0, 2).join(', ')}</span></p>
                    </div>
                  )}
                  {settings.contentPreferences.learnedStyle.structure && settings.contentPreferences.learnedStyle.structure.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                      <p className="text-xs lg:text-sm text-slate-200">Structure: <span className="font-semibold">{settings.contentPreferences.learnedStyle.structure.slice(0, 3).join(', ')}</span></p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative glass rounded-xl p-3 lg:p-4 border border-purple-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl pointer-events-none"></div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-2 lg:mb-3">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <h2 className="text-base lg:text-lg font-bold text-white">AI Current Learned Preferences</h2>
                </div>
                <div className="glass rounded-lg p-3 lg:p-4">
                  <p className="text-xs lg:text-sm text-slate-200 mb-2">
                    <strong>No learned preferences yet.</strong> The AI learns your style from:
                  </p>
                  <ol className="text-xs lg:text-sm text-slate-300 space-y-1 list-decimal list-inside">
                    <li><strong>Scanned posts</strong> - Connect social accounts to automatically learn from your existing posts (most important for new users!)</li>
                    <li><strong>Accepted content</strong> - When you accept generated content</li>
                    <li><strong>Edits</strong> - When you edit generated content</li>
                  </ol>
                  {settings.contentPreferences?.scannedPosts && settings.contentPreferences.scannedPosts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-purple-200/30">
                      <p className="text-xs text-slate-300">
                        ✓ Found {settings.contentPreferences.scannedPosts.length} scanned posts.
                        {(!settings.contentPreferences.learnedStyle || Object.keys(settings.contentPreferences.learnedStyle).length === 0) ? (
                          <button
                            onClick={() => {
                              const scannedPosts = settings.contentPreferences?.scannedPosts || []
                              const existingPreferences = settings.contentPreferences || {
                                acceptedContent: [],
                                edits: [],
                                scannedPosts: [],
                              }
                              
                              const newLearnedStyle = combineAllLearningSources(
                                scannedPosts,
                                existingPreferences.acceptedContent,
                                existingPreferences.edits
                              )
                              
                              if (Object.keys(newLearnedStyle).length > 0) {
                                updateSettings({
                                  contentPreferences: {
                                    ...existingPreferences,
                                    learnedStyle: newLearnedStyle,
                                  },
                                })
                                toast.success('Learned style from scanned posts!')
                              } else {
                                toast.error('Could not learn from scanned posts. Check console for details.')
                              }
                            }}
                            className="block mt-2 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
                          >
                            Click to Learn from {settings.contentPreferences.scannedPosts.length} Scanned Posts
                          </button>
                        ) : (
                          <span className="block mt-1 text-green-400">✓ Style learned successfully!</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Engagement Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 lg:gap-3 mb-4 lg:mb-6">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div
                key={metric.label}
                className="glass rounded-xl p-2.5 lg:p-4 hover-lift border border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-2 lg:mb-3">
                  <div className={`bg-gradient-to-br ${metric.gradient} p-1.5 lg:p-2 rounded-lg`}>
                    <Icon className={`w-3.5 h-3.5 lg:w-5 lg:h-5 ${metric.iconColor}`} />
                  </div>
                </div>
                <p className="text-lg lg:text-2xl font-bold text-white mb-0.5 lg:mb-1">{metric.value}</p>
                <p className="text-[10px] lg:text-xs text-slate-300">{metric.label}</p>
              </div>
            )
          })}
        </div>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mb-3 lg:mb-4">
          {/* Best Posting Times */}
          {insights.bestPostingTimes.length > 0 && (
            <div className="glass rounded-xl p-3 lg:p-4 hover-lift border border-slate-700/50">
              <div className="flex items-center space-x-2 mb-2 lg:mb-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm lg:text-base font-semibold text-white">Best Posting Times</h3>
              </div>
              <div className="space-y-1.5 lg:space-y-2">
                {insights.bestPostingTimes.slice(0, 5).map((time, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg glass border border-slate-700/30">
                    <div>
                      <span className="font-medium text-white text-xs lg:text-sm">{time.day}</span>
                      <span className="text-slate-300 ml-2 text-xs lg:text-sm">{time.hour}:00</span>
                    </div>
                    <span className="text-xs lg:text-sm font-semibold text-blue-400">
                      {time.avgEngagement.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Content Types */}
          {insights.bestContentTypes.length > 0 && (
            <div className="glass rounded-xl p-3 lg:p-4 hover-lift border border-slate-700/50">
              <div className="flex items-center space-x-2 mb-2 lg:mb-3">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm lg:text-base font-semibold text-white">Content Type Performance</h3>
              </div>
              <div className="space-y-1.5 lg:space-y-2">
                {insights.bestContentTypes.map((type, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg glass border border-slate-700/30">
                    <span className="font-medium text-white capitalize text-xs lg:text-sm">{type.type}</span>
                    <div className="text-right">
                      <div className="text-xs lg:text-sm font-semibold text-white">
                        {type.avgViews.toLocaleString()} views
                      </div>
                      <div className="text-[10px] lg:text-xs text-slate-400">
                        {type.avgEngagement.toFixed(1)}% engagement
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Hashtags */}
          {insights.bestHashtags.length > 0 && (
            <div className="glass rounded-xl p-3 lg:p-4 hover-lift border border-slate-700/50">
              <div className="flex items-center space-x-2 mb-2 lg:mb-3">
                <Hash className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm lg:text-base font-semibold text-white">Top Performing Hashtags</h3>
              </div>
              <div className="space-y-1.5 lg:space-y-2">
                {insights.bestHashtags.slice(0, 10).map((tag, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg glass border border-slate-700/30">
                    <span className="font-medium text-white text-xs lg:text-sm">#{tag.tag}</span>
                    <div className="text-right">
                      <div className="text-xs lg:text-sm font-semibold text-white">
                        {tag.avgViews.toLocaleString()} avg views
                      </div>
                      <div className="text-[10px] lg:text-xs text-slate-400">Used {tag.usageCount}x</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Performance */}
          {insights.bestPlatforms.length > 0 && (
            <div className="glass rounded-xl p-3 lg:p-4 hover-lift border border-slate-700/50">
              <div className="flex items-center space-x-2 mb-2 lg:mb-3">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm lg:text-base font-semibold text-white">Platform Performance</h3>
              </div>
              <div className="space-y-1.5 lg:space-y-2">
                {insights.bestPlatforms.map((platform, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg glass border border-slate-700/30">
                    <span className="font-medium text-white capitalize text-xs lg:text-sm">{platform.platform}</span>
                    <div className="text-right">
                      <div className="text-xs lg:text-sm font-semibold text-white">
                        {platform.avgReach.toLocaleString()} avg reach
                      </div>
                      <div className="text-[10px] lg:text-xs text-slate-400">
                        {platform.avgEngagement.toFixed(1)}% engagement
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Performing Posts */}
        {insights.topPerformingPosts.length > 0 && (
          <div className="glass rounded-xl p-3 lg:p-4 mb-3 lg:mb-4 hover-lift border border-slate-700/50">
            <h3 className="text-sm lg:text-base font-semibold text-white mb-2 lg:mb-3">Top Performing Posts</h3>
            <div className="space-y-2 lg:space-y-3">
              {insights.topPerformingPosts.map((post) => {
                const score = calculatePerformanceScore(post)
                const engagement = calculateEngagementRate(post)
                return (
                  <div
                    key={post.id}
                    className="p-3 lg:p-4 rounded-lg glass border border-slate-700/50 hover:border-purple-500/50 hover:shadow-glow transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedPost(post.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 glass text-slate-200 rounded capitalize">
                            {post.platform}
                          </span>
                          <span className="text-xs text-slate-400">
                            {post.postedAt ? format(new Date(post.postedAt), 'MMM d, yyyy') : 'Not posted'}
                          </span>
                        </div>
                        <p className="text-xs lg:text-sm text-slate-200 line-clamp-2">{post.content}</p>
                      </div>
                      <div className="ml-3 text-right flex-shrink-0">
                        <div className="text-base lg:text-lg font-bold text-blue-400">{score}</div>
                        <div className="text-[10px] lg:text-xs text-slate-400">Score</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 lg:space-x-4 mt-2 lg:mt-3 text-xs text-slate-300 flex-wrap gap-1.5">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{post.engagement?.views || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3 h-3" />
                        <span>{post.engagement?.likes || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{post.engagement?.comments || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Share2 className="w-3 h-3" />
                        <span>{post.engagement?.shares || 0}</span>
                      </div>
                      <div className="ml-auto text-blue-400 font-medium">
                        {engagement.toFixed(1)}% engagement
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Engagement Tracker Modal */}
        {selectedPostData && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-glow-lg">
              <EngagementTracker
                post={selectedPostData}
                onUpdate={(engagement) => {
                  updatePost(selectedPostData.id, { engagement })
                  setSelectedPost(null)
                }}
                onClose={() => setSelectedPost(null)}
              />
            </div>
          </div>
        )}

        {/* All Posts with Engagement */}
        <div className="glass rounded-xl lg:rounded-2xl p-3 lg:p-6 hover-lift border border-slate-700/50">
          <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">All Posts</h3>
          {postedPosts.length === 0 ? (
            <div className="text-center py-8 lg:py-12 text-slate-400">
              <BarChart3 className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm lg:text-base">No posts with engagement data yet.</p>
              <p className="text-xs lg:text-sm mt-1">Track engagement metrics to see insights here.</p>
            </div>
          ) : (
            <div className="space-y-2.5 lg:space-y-3">
              {posts
                .filter(p => p.status === 'posted')
                .map((post) => {
                  const engagement = post.engagement ? calculateEngagementRate(post) : 0
                  return (
                    <div
                      key={post.id}
                      className="p-3 lg:p-4 rounded-lg glass border border-slate-700/50 hover:border-purple-500/50 hover:shadow-glow transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedPost(post.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1.5">
                            <span className="text-xs font-medium px-2 py-0.5 glass text-slate-200 rounded capitalize">
                              {post.platform}
                            </span>
                            {post.engagement && (
                              <span className="text-xs text-slate-400">
                                Updated {format(new Date(post.engagement.lastUpdated), 'MMM d')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs lg:text-sm text-slate-200 line-clamp-2">{post.content}</p>
                        </div>
                        {post.engagement && (
                          <div className="ml-3 text-right flex-shrink-0">
                            <div className="text-sm lg:text-base font-bold text-blue-400">
                              {engagement.toFixed(1)}%
                            </div>
                            <div className="text-[10px] lg:text-xs text-slate-400">Engagement</div>
                          </div>
                        )}
                      </div>
                      {post.engagement ? (
                        <div className="flex items-center space-x-3 lg:space-x-4 text-xs text-slate-300 flex-wrap gap-1.5">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{post.engagement.views.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3" />
                            <span>{post.engagement.likes.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>{post.engagement.comments.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Share2 className="w-3 h-3" />
                            <span>{post.engagement.shares.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1 ml-auto">
                            <TrendingUp className="w-3 h-3" />
                            <span>{post.engagement.reach.toLocaleString()} reach</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-2">
                          Click to add engagement metrics
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
