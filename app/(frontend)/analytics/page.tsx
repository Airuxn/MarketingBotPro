'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, MessageSquare, Mail, Users, Eye, Heart, MessageCircle, Share2, Clock, Hash, Image as ImageIcon, Zap, Calendar, Brain, ChevronRight } from 'lucide-react'
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
      color: 'text-blue-400',
    },
    {
      label: 'Total Reach',
      value: totalReach.toLocaleString(),
      icon: TrendingUp,
      color: 'text-purple-400',
    },
    {
      label: 'Avg Engagement',
      value: `${avgEngagementRate.toFixed(2)}%`,
      icon: Zap,
      color: 'text-green-400',
    },
    {
      label: 'Total Likes',
      value: totalLikes.toLocaleString(),
      icon: Heart,
      color: 'text-red-400',
    },
    {
      label: 'Total Comments',
      value: totalComments.toLocaleString(),
      icon: MessageCircle,
      color: 'text-orange-400',
    },
    {
      label: 'Total Shares',
      value: totalShares.toLocaleString(),
      icon: Share2,
      color: 'text-indigo-400',
    },
  ]

  const selectedPostData = selectedPost ? posts.find(p => p.id === selectedPost) : null
  const learnedStyle = settings.contentPreferences?.learnedStyle

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
              <h1 className="text-lg lg:text-2xl font-bold text-gradient">Analytics</h1>
              <p className="text-xs lg:text-sm text-slate-300 hidden sm:block">Track engagement and optimize your content</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div
                key={metric.label}
                className="glass rounded-lg p-3 border border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${metric.color} opacity-80`} />
                </div>
                <div className="text-xl lg:text-2xl font-semibold text-white mb-0.5">{metric.value}</div>
                <div className="text-[10px] lg:text-xs text-slate-400 font-medium">{metric.label}</div>
              </div>
            )
          })}
        </div>

        {/* AI Insights - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          {/* AI Performance Insights */}
          <div className="glass rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-white">Performance Insights</h2>
              </div>
            </div>
            {insights.recommendations.length > 0 ? (
              <div className="space-y-1.5">
                {insights.recommendations.slice(0, 4).map((rec, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300 leading-relaxed">
                    <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 leading-relaxed">
                Connect social accounts or add engagement data to see AI insights.
              </div>
            )}
          </div>

          {/* Learned Preferences */}
          <div className="glass rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-semibold text-white">Learned Preferences</h2>
              </div>
            </div>
            {learnedStyle && Object.keys(learnedStyle).length > 0 ? (
              <div className="space-y-1.5">
                {learnedStyle.length && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Length</span>
                    <span className="text-white font-medium capitalize">{learnedStyle.length}</span>
                  </div>
                )}
                {learnedStyle.tone && learnedStyle.tone.length > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tone</span>
                    <span className="text-white font-medium">{learnedStyle.tone.slice(0, 2).join(', ')}</span>
                  </div>
                )}
                {learnedStyle.hashtagUsage && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Hashtags</span>
                    <span className="text-white font-medium capitalize">{learnedStyle.hashtagUsage}</span>
                  </div>
                )}
                {learnedStyle.structure && learnedStyle.structure.length > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Structure</span>
                    <span className="text-white font-medium">{learnedStyle.structure.slice(0, 2).join(', ')}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 leading-relaxed">
                AI learns from your scanned posts, accepted content, and edits.
              </div>
            )}
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          {/* Best Posting Times */}
          {insights.bestPostingTimes.length > 0 && (
            <div className="glass rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-white">Best Posting Times</h3>
              </div>
              <div className="space-y-1.5">
                {insights.bestPostingTimes.slice(0, 5).map((time, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 text-xs border-b border-slate-700/30 last:border-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{time.day}</span>
                      <span className="text-slate-400">{time.hour}:00</span>
                    </div>
                    <span className="text-slate-300 font-medium">{time.avgEngagement.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Content Types */}
          {insights.bestContentTypes.length > 0 && (
            <div className="glass rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-white">Content Type Performance</h3>
              </div>
              <div className="space-y-1.5">
                {insights.bestContentTypes.map((type, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 text-xs border-b border-slate-700/30 last:border-0">
                    <span className="text-white font-medium capitalize">{type.type}</span>
                    <div className="text-right">
                      <div className="text-white font-medium">{type.avgViews.toLocaleString()}</div>
                      <div className="text-slate-400 text-[10px]">{type.avgEngagement.toFixed(1)}% engagement</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Hashtags */}
          {insights.bestHashtags.length > 0 && (
            <div className="glass rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <Hash className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-white">Top Hashtags</h3>
              </div>
              <div className="space-y-1.5">
                {insights.bestHashtags.slice(0, 8).map((tag, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 text-xs border-b border-slate-700/30 last:border-0">
                    <span className="text-white font-medium">#{tag.tag}</span>
                    <div className="text-right">
                      <div className="text-white font-medium">{tag.avgViews.toLocaleString()}</div>
                      <div className="text-slate-400 text-[10px]">{tag.usageCount}x used</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Performance */}
          {insights.bestPlatforms.length > 0 && (
            <div className="glass rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-white">Platform Performance</h3>
              </div>
              <div className="space-y-1.5">
                {insights.bestPlatforms.map((platform, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 text-xs border-b border-slate-700/30 last:border-0">
                    <span className="text-white font-medium capitalize">{platform.platform}</span>
                    <div className="text-right">
                      <div className="text-white font-medium">{platform.avgReach.toLocaleString()}</div>
                      <div className="text-slate-400 text-[10px]">{platform.avgEngagement.toFixed(1)}% engagement</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Performing Posts */}
        {insights.topPerformingPosts.length > 0 && (
          <div className="glass rounded-lg p-3 border border-slate-700/50 mb-6">
            <h3 className="text-sm font-semibold text-white mb-3">Top Performing Posts</h3>
            <div className="space-y-2">
              {insights.topPerformingPosts.slice(0, 5).map((post) => {
                const score = calculatePerformanceScore(post)
                const engagement = calculateEngagementRate(post)
                return (
                  <div
                    key={post.id}
                    className="p-3 rounded-lg glass border border-slate-700/30 hover:border-slate-600/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedPost(post.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1.5">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-700/50 text-slate-200 rounded capitalize">
                            {post.platform}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {post.postedAt ? format(new Date(post.postedAt), 'MMM d, yyyy') : 'Not posted'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">{post.content}</p>
                      </div>
                      <div className="ml-3 text-right flex-shrink-0">
                        <div className="text-base font-semibold text-white">{score}</div>
                        <div className="text-[10px] text-slate-400">Score</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 pt-2 border-t border-slate-700/30">
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
                      <div className="ml-auto text-slate-300 font-medium">
                        {engagement.toFixed(1)}%
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

        {/* All Posts */}
        <div className="glass rounded-lg p-3 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-3">All Posts</h3>
          {postedPosts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No posts with engagement data yet.</p>
              <p className="text-xs mt-1 text-slate-500">Track engagement metrics to see insights here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {posts
                .filter(p => p.status === 'posted')
                .map((post) => {
                  const engagement = post.engagement ? calculateEngagementRate(post) : 0
                  return (
                    <div
                      key={post.id}
                      className="p-3 rounded-lg glass border border-slate-700/30 hover:border-slate-600/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedPost(post.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1.5">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-700/50 text-slate-200 rounded capitalize">
                              {post.platform}
                            </span>
                            {post.engagement && (
                              <span className="text-[10px] text-slate-400">
                                Updated {format(new Date(post.engagement.lastUpdated), 'MMM d')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">{post.content}</p>
                        </div>
                        {post.engagement && (
                          <div className="ml-3 text-right flex-shrink-0">
                            <div className="text-sm font-semibold text-white">
                              {engagement.toFixed(1)}%
                            </div>
                            <div className="text-[10px] text-slate-400">Engagement</div>
                          </div>
                        )}
                      </div>
                      {post.engagement ? (
                        <div className="flex items-center space-x-3 text-xs text-slate-400 pt-2 border-t border-slate-700/30">
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
                            <span>{post.engagement.reach.toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700/30">
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
