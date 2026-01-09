'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Twitter, Linkedin, Facebook, Instagram, Plus, Trash2, CheckCircle, BarChart3, Loader2, Edit2, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { format } from 'date-fns'
import { EngagementTracker } from '@/components/EngagementTracker'
import { publishPost } from '@/lib/post-publisher'
import toast from 'react-hot-toast'

export default function SchedulePage() {
  const { posts, updatePost, deletePost, settings } = useStore()
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [trackingPost, setTrackingPost] = useState<string | null>(null)
  const [postingInProgress, setPostingInProgress] = useState<Set<string>>(new Set())

  const platformIcons = {
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
    instagram: Instagram,
  }

  const handleSchedule = () => {
    if (!selectedPost || !scheduledDate || !scheduledTime) {
      toast.error('Please select a post and schedule time')
      return
    }

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
    updatePost(selectedPost, {
      scheduledFor,
      status: 'scheduled',
    })
    toast.success('Post scheduled successfully!')
    setSelectedPost(null)
    setScheduledDate('')
    setScheduledTime('')
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePost(id)
      toast.success('Post deleted')
    }
  }

  const handleUnschedule = (id: string) => {
    updatePost(id, {
      status: 'draft',
      scheduledFor: undefined,
    })
    toast.success('Post unscheduled and moved back to drafts')
  }

  const handleEditPost = (postId: string) => {
    // Navigate to content page with post data
    const post = posts.find(p => p.id === postId)
    if (post) {
      // Store post data in sessionStorage to pre-fill content page
      sessionStorage.setItem('editPost', JSON.stringify({
        id: postId,
        content: post.content,
        platform: post.platform,
        media: post.media,
        scheduledFor: post.scheduledFor,
        status: post.status,
      }))
      window.location.href = '/content'
    }
  }

  // Auto-publish scheduled posts when their time comes
  useEffect(() => {
    const checkAndPublishScheduledPosts = async () => {
      const now = new Date()
      const scheduledPosts = posts.filter(
        (p) => p.status === 'scheduled' && p.scheduledFor
      )

      for (const post of scheduledPosts) {
        // Skip if already posting
        if (postingInProgress.has(post.id)) continue
        if (!post.scheduledFor) continue

        const scheduledTime = new Date(post.scheduledFor)
        // Post if scheduled time has passed (within last 5 minutes to avoid missing posts)
        const timeDiff = now.getTime() - scheduledTime.getTime()
        const fiveMinutes = 5 * 60 * 1000

        if (timeDiff >= 0 && timeDiff <= fiveMinutes) {
          setPostingInProgress(prev => new Set(prev).add(post.id))

          try {
            const socialAccounts = (settings.socialAccounts || []).map(acc => ({
              platform: acc.platform as 'facebook' | 'twitter' | 'linkedin' | 'instagram',
              accessToken: acc.accessToken || '',
              userId: acc.userId,
              connected: acc.connected,
            }))

            const result = await publishPost(post, socialAccounts)

            if (result.success) {
              // Automatically mark as posted using store directly
              const { updatePost: updatePostFromStore } = useStore.getState()
              updatePostFromStore(post.id, {
                status: 'posted',
                postedAt: new Date().toISOString(),
              })
              toast.success(`✓ Post automatically published to ${post.platform}!`, { duration: 8000 })
            } else {
              toast.error(`Failed to publish post: ${result.error}`)
              // Keep as scheduled so user can retry manually
            }
          } catch (error: any) {
            console.error('Error publishing post:', error)
            toast.error(`Failed to publish post: ${error.message}`)
          } finally {
            setPostingInProgress(prev => {
              const next = new Set(prev)
              next.delete(post.id)
              return next
            })
          }
        }
      }
    }

    // Check every minute
    const interval = setInterval(checkAndPublishScheduledPosts, 60000)
    
    // Also check immediately
    checkAndPublishScheduledPosts()

    return () => clearInterval(interval)
  }, [posts, settings.socialAccounts])

  const scheduledPosts = posts.filter((p) => p.status === 'scheduled')
  const draftPosts = posts.filter((p) => p.status === 'draft')
  const postedPosts = posts.filter((p) => p.status === 'posted')

  return (
    <div className="min-h-screen relative">
      {/* Page Header */}
      <div className="glass-strong border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient mb-1">Schedule Posts</h1>
              <p className="text-sm text-slate-300">Manage your social media content</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Schedule Modal */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-strong rounded-xl p-5 max-w-md w-full shadow-glow-lg">
              <h3 className="text-lg font-bold text-white mb-4">Schedule Post</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 glass rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-4 py-2 glass rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSchedule}
                    className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300 font-medium shadow-sm hover:shadow-md"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPost(null)
                      setScheduledDate('')
                      setScheduledTime('')
                    }}
                    className="flex-1 glass text-slate-300 py-2.5 px-4 rounded-lg hover:bg-slate-700/50 transition-all duration-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Posts */}
        {scheduledPosts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Scheduled ({scheduledPosts.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledPosts.map((post) => {
                const Icon = platformIcons[post.platform]
                return (
                  <div
                    key={post.id}
                    className="glass rounded-xl p-5 hover-lift"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-slate-200 capitalize">
                          {post.platform}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    {post.media && (
                      <div className="mb-3">
                        {post.media.type === 'image' ? (
                          <img
                            src={post.media.file}
                            alt="Post media"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={post.media.file}
                            className="w-full h-32 object-cover rounded-lg"
                            controls
                          />
                        )}
                      </div>
                    )}
                    <p className="text-sm text-slate-300 mb-3 line-clamp-3">
                      {post.content}
                    </p>
                    {post.scheduledFor && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-400">
                          Scheduled: {format(new Date(post.scheduledFor), 'MMM d, yyyy h:mm a')}
                        </p>
                        {new Date(post.scheduledFor) <= new Date() && (
                          <p className="text-xs text-blue-600 mt-1">
                            {postingInProgress.has(post.id) ? (
                              <span className="flex items-center space-x-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Publishing...</span>
                              </span>
                            ) : (
                              <span>Will be published automatically...</span>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                    {postingInProgress.has(post.id) ? (
                      <div className="w-full mt-3 px-4 py-2.5 bg-blue-600/20 text-blue-400 text-sm font-medium rounded-lg flex items-center justify-center space-x-1.5 border border-blue-500/30">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 mt-3">
                        <button
                          onClick={() => handleEditPost(post.id)}
                          className="w-full px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm font-medium flex items-center justify-center space-x-1.5 border border-blue-500/30"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit Post</span>
                        </button>
                        <button
                          onClick={() => handleUnschedule(post.id)}
                          className="w-full px-4 py-2 glass text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors text-sm font-medium flex items-center justify-center space-x-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>Unschedule</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Draft Posts */}
        {draftPosts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Drafts ({draftPosts.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftPosts.map((post) => {
                const Icon = platformIcons[post.platform]
                return (
                  <div
                    key={post.id}
                    className="glass rounded-xl p-5 hover-lift"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-200 capitalize">
                          {post.platform}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    {post.media && (
                      <div className="mb-3">
                        {post.media.type === 'image' ? (
                          <img
                            src={post.media.file}
                            alt="Post media"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={post.media.file}
                            className="w-full h-32 object-cover rounded-lg"
                            controls
                          />
                        )}
                      </div>
                    )}
                    <p className="text-sm text-slate-300 mb-3 line-clamp-3">
                      {post.content}
                    </p>
                    <div className="flex flex-col gap-2 mt-3">
                      <button
                        onClick={() => handleEditPost(post.id)}
                        className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1.5"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit Post</span>
                      </button>
                      <button
                        onClick={() => setSelectedPost(post.id)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Schedule Now
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Posted Posts */}
        {postedPosts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Posted ({postedPosts.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {postedPosts.map((post) => {
                const Icon = platformIcons[post.platform]
                return (
                  <div
                    key={post.id}
                    className="glass rounded-xl p-5 hover-lift"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-slate-200 capitalize">
                          {post.platform}
                        </span>
                      </div>
                      {post.postedAt && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(post.postedAt), 'MMM d')}
                        </span>
                      )}
                    </div>
                    {post.media && (
                      <div className="mb-3">
                        {post.media.type === 'image' ? (
                          <img
                            src={post.media.file}
                            alt="Post media"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={post.media.file}
                            className="w-full h-32 object-cover rounded-lg"
                            controls
                          />
                        )}
                      </div>
                    )}
                    <p className="text-sm text-slate-300 mb-3 line-clamp-3">{post.content}</p>
                    {post.engagement ? (
                      <div className="mb-3 p-2 glass rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <span className="text-slate-400">Views:</span>
                            <span className="font-semibold">{post.engagement.views.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-500">Likes:</span>
                            <span className="font-semibold">{post.engagement.likes.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-500">Comments:</span>
                            <span className="font-semibold">{post.engagement.comments.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-500">Shares:</span>
                            <span className="font-semibold">{post.engagement.shares.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <button
                      onClick={() => setTrackingPost(post.id)}
                      className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center space-x-1.5 shadow-sm hover:shadow-md"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>{post.engagement ? 'Update Metrics' : 'Track Engagement'}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="glass rounded-xl p-8 text-center">
            <Calendar className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-slate-400 mb-6">
              Create your first post using the AI Content Generator
            </p>
            <Link
              href="/content"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Content</span>
            </Link>
          </div>
        )}

        {/* Engagement Tracker Modal */}
        {trackingPost && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-glow-lg">
              <EngagementTracker
                post={posts.find(p => p.id === trackingPost)!}
                onUpdate={(engagement) => {
                  updatePost(trackingPost, { engagement })
                  setTrackingPost(null)
                }}
                onClose={() => setTrackingPost(null)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
