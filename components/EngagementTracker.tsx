'use client'

import { useState } from 'react'
import { Eye, Heart, MessageCircle, Share2, TrendingUp, Save, X } from 'lucide-react'
import { Post } from '@/lib/store'
import toast from 'react-hot-toast'

interface EngagementTrackerProps {
  post: Post
  onUpdate: (engagement: Post['engagement']) => void
  onClose?: () => void
}

export function EngagementTracker({ post, onUpdate, onClose }: EngagementTrackerProps) {
  const defaultEngagement: NonNullable<Post['engagement']> = {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    reach: 0,
    lastUpdated: new Date().toISOString()
  }
  const [engagement, setEngagement] = useState<NonNullable<Post['engagement']>>(post.engagement || defaultEngagement)

  const handleSave = () => {
    const updated: NonNullable<Post['engagement']> = {
      views: engagement.views,
      likes: engagement.likes,
      comments: engagement.comments,
      shares: engagement.shares,
      reach: engagement.reach,
      lastUpdated: new Date().toISOString()
    }
    onUpdate(updated)
    toast.success('Engagement metrics updated!')
    onClose?.()
  }

  const engagementRate = engagement.reach > 0 
    ? ((engagement.likes + engagement.comments + engagement.shares) / engagement.reach * 100).toFixed(2)
    : '0.00'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Track Engagement</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Views */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Eye className="w-4 h-4" />
            <span>Views</span>
          </label>
          <input
            type="number"
            min="0"
            value={engagement.views}
            onChange={(e) => setEngagement({ ...engagement, views: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        {/* Reach */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Reach</span>
          </label>
          <input
            type="number"
            min="0"
            value={engagement.reach}
            onChange={(e) => setEngagement({ ...engagement, reach: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        {/* Likes */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Heart className="w-4 h-4" />
            <span>Likes</span>
          </label>
          <input
            type="number"
            min="0"
            value={engagement.likes}
            onChange={(e) => setEngagement({ ...engagement, likes: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        {/* Comments */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <MessageCircle className="w-4 h-4" />
            <span>Comments</span>
          </label>
          <input
            type="number"
            min="0"
            value={engagement.comments}
            onChange={(e) => setEngagement({ ...engagement, comments: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        {/* Shares */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Share2 className="w-4 h-4" />
            <span>Shares</span>
          </label>
          <input
            type="number"
            min="0"
            value={engagement.shares}
            onChange={(e) => setEngagement({ ...engagement, shares: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>

        {/* Engagement Rate Display */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Engagement Rate</span>
            <span className="text-lg font-bold text-blue-600">{engagementRate}%</span>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Metrics</span>
        </button>
      </div>
    </div>
  )
}
