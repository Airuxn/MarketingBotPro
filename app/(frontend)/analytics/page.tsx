'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart3, TrendingUp, TrendingDown, MessageSquare, Mail, Users, Eye, Heart, MessageCircle, Share2, Clock, Hash, Image as ImageIcon, Zap, Calendar, Brain, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react'
import { useStore } from '@/lib/store'
import { analyzeContentPerformance, calculateEngagementRate, calculatePerformanceScore, ScannedPost } from '@/lib/content-performance-analyzer'
import { EngagementTracker } from '@/components/EngagementTracker'
import { analyzeEdit, combineAllLearningSources } from '@/lib/content-learner'
import { format, subDays } from 'date-fns'
import toast from 'react-hot-toast'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// Animated Counter Component
function AnimatedCounter({ value, duration = 2000 }: { value: number, duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    const endValue = value
    const startValue = 0

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + (endValue - startValue) * easeOutQuart
      
      setDisplayValue(Math.floor(currentValue))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, duration])

  return <>{displayValue.toLocaleString()}</>
}

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

  // Generate real trend data from posted posts AND scanned posts (last 7 days)
  const trendData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      return {
        day: format(date, 'EEE'),
        date: format(date, 'yyyy-MM-dd'),
        views: 0,
        engagement: 0,
        count: 0
      }
    })

    // Aggregate data from posted posts
    postedPosts.forEach(post => {
      if (post.engagement?.lastUpdated) {
        const postDate = format(new Date(post.engagement.lastUpdated), 'yyyy-MM-dd')
        const dayData = days.find(d => d.date === postDate)
        if (dayData) {
          dayData.views += post.engagement.views || 0
          dayData.engagement += calculateEngagementRate(post)
          dayData.count += 1
        }
      }
    })

    // Aggregate data from scanned posts
    scannedPosts.forEach(scannedPost => {
      if (scannedPost.engagement && scannedPost.createdAt) {
        const postDate = format(new Date(scannedPost.createdAt), 'yyyy-MM-dd')
        const dayData = days.find(d => d.date === postDate)
        if (dayData) {
          // Scanned posts don't have views/reach in engagement, estimate from likes
          const { likes = 0, comments = 0, shares = 0 } = scannedPost.engagement
          const totalEngagements = likes + comments + shares
          // Estimate views: typically views are 20x likes
          const estimatedViews = likes > 0 ? likes * 20 : totalEngagements * 10
          dayData.views += estimatedViews
          
          // Estimate engagement rate: typically 2-5% engagement rate
          // Use a conservative estimate: (engagements / estimated_reach) * 100
          // Estimated reach is typically 2-3x views
          const estimatedReach = estimatedViews * 2.5
          const engagementRate = estimatedReach > 0 
            ? (totalEngagements / estimatedReach) * 100
            : 0
          dayData.engagement += engagementRate
          dayData.count += 1
        }
      }
    })

    // Calculate averages for engagement
    return days.map(day => ({
      day: day.day,
      views: day.views,
      engagement: day.count > 0 ? day.engagement / day.count : 0
    }))
  }, [postedPosts, scannedPosts])

  // Chart data for posting times
  const postingTimesChartData = useMemo(() => {
    if (!insights.bestPostingTimes.length) return []
    return insights.bestPostingTimes.slice(0, 5).map((time, idx) => ({
      name: `${time.day.slice(0, 3)} ${time.hour}:00`,
      engagement: time.avgEngagement,
      index: idx
    }))
  }, [insights.bestPostingTimes])

  // Chart data for content types
  const contentTypesChartData = useMemo(() => {
    if (!insights.bestContentTypes.length) return []
    return insights.bestContentTypes.map((type) => ({
      name: type.type.charAt(0).toUpperCase() + type.type.slice(1),
      views: type.avgViews,
      engagement: type.avgEngagement
    }))
  }, [insights.bestContentTypes])

  // IMPORTANT: Learn from scanned posts if they exist but learnedStyle is empty
  useEffect(() => {
    const scannedPosts = settings.contentPreferences?.scannedPosts || []
    const learnedStyle = settings.contentPreferences?.learnedStyle
    
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
      }
    }
  }, [settings.contentPreferences?.scannedPosts?.length, settings.contentPreferences?.learnedStyle, updateSettings])

  const metrics = [
    {
      label: 'Total Views',
      value: totalViews,
      icon: Eye,
      color: '#60a5fa',
    },
    {
      label: 'Total Reach',
      value: totalReach,
      icon: TrendingUp,
      color: '#a78bfa',
    },
    {
      label: 'Avg Engagement',
      value: avgEngagementRate,
      isPercentage: true,
      icon: Zap,
      color: '#34d399',
    },
    {
      label: 'Total Likes',
      value: totalLikes,
      icon: Heart,
      color: '#f87171',
    },
    {
      label: 'Total Comments',
      value: totalComments,
      icon: MessageCircle,
      color: '#fb923c',
    },
    {
      label: 'Total Shares',
      value: totalShares,
      icon: Share2,
      color: '#818cf8',
    },
  ]

  const selectedPostData = selectedPost ? posts.find(p => p.id === selectedPost) : null
  const learnedStyle = settings.contentPreferences?.learnedStyle

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-2 border border-slate-700/50 shadow-lg">
          <p className="text-xs text-white font-medium">{payload[0].payload.day}</p>
          {payload.find((p: any) => p.dataKey === 'views') && (
            <p className="text-xs text-blue-400">{`Views: ${payload.find((p: any) => p.dataKey === 'views')?.value.toLocaleString() || 0}`}</p>
          )}
          {payload.find((p: any) => p.dataKey === 'engagement') && (
            <p className="text-xs text-green-400">{`Engagement: ${payload.find((p: any) => p.dataKey === 'engagement')?.value.toFixed(2)}%`}</p>
          )}
        </div>
      )
    }
    return null
  }

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
            const displayValue = metric.isPercentage 
              ? `${metric.value.toFixed(2)}%`
              : metric.value.toLocaleString()
            
            return (
              <div
                key={metric.label}
                className="glass rounded-lg p-3 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity" style={{ color: metric.color }} />
                  {metric.value > 0 && (
                    <div className="flex items-center space-x-0.5 text-[10px] text-green-400">
                      <ArrowUp className="w-3 h-3" />
                      <span className="font-medium">12%</span>
                    </div>
                  )}
                </div>
                <div className="text-xl lg:text-2xl font-semibold text-white mb-1 truncate">
                  {metric.isPercentage ? (
                    displayValue
                  ) : (
                    <AnimatedCounter value={metric.value} />
                  )}
                </div>
                <div className="text-[10px] lg:text-xs text-slate-400 font-medium truncate">{metric.label}</div>
              </div>
            )
          })}
        </div>

        {/* Trend Chart */}
        <div className="glass rounded-lg p-4 border border-slate-700/50 mb-6">
          <div className="glass rounded-lg p-4 border border-slate-700/50 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">7-Day Engagement Trend</h2>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span>Views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span>Engagement %</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#34d399" 
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="views" 
                  stroke="#60a5fa" 
                  strokeWidth={2}
                  dot={{ fill: '#60a5fa', r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#34d399" 
                  strokeWidth={2}
                  dot={{ fill: '#34d399', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

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
              <div className="space-y-2">
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

        {/* Performance Breakdown with Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          {/* Best Posting Times with Chart */}
          {insights.bestPostingTimes.length > 0 && (
            <div className="glass rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-white">Best Posting Times</h3>
              </div>
              {postingTimesChartData.length > 0 && (
                <div className="mb-3">
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={postingTimesChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="engagement" radius={[4, 4, 0, 0]}>
                        {postingTimesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#60a5fa" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
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

          {/* Best Content Types with Chart */}
          {insights.bestContentTypes.length > 0 && (
            <div className="glass rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center space-x-2 mb-3">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-white">Content Type Performance</h3>
              </div>
              {contentTypesChartData.length > 0 && (
                <div className="mb-3">
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={contentTypesChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                        {contentTypesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#a78bfa" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
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
                    className="p-3 rounded-lg glass border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 cursor-pointer group"
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
