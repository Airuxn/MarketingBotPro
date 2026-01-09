'use client'

import { useState } from 'react'
import { X, DollarSign, Calendar, Target, Image as ImageIcon } from 'lucide-react'
import { AdPlatform } from '@/lib/ad-platforms'
import { createFacebookCampaign, createFacebookAdSet, createFacebookAdCreative, createFacebookAd } from '@/lib/facebook-ads'
import { useStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface CreateAdDialogProps {
  isOpen: boolean
  onClose: () => void
  platform: AdPlatform
  content: string
  imageUrl?: string
  headline?: string
  description?: string
  linkUrl?: string
}

export function CreateAdDialog({
  isOpen,
  onClose,
  platform,
  content,
  imageUrl,
  headline,
  description,
  linkUrl,
}: CreateAdDialogProps) {
  const { settings } = useStore()
  const [campaignName, setCampaignName] = useState('')
  const [objective, setObjective] = useState('')
  const [dailyBudget, setDailyBudget] = useState('')
  const [targeting, setTargeting] = useState({
    ageMin: '18',
    ageMax: '65',
    genders: [] as string[],
    locations: [] as string[],
  })
  const [isCreating, setIsCreating] = useState(false)

  const connectedAccount = settings.adAccounts?.find(
    (acc) => acc.platform === platform && acc.connected
  )

  if (!isOpen) return null

  const handleCreate = async () => {
    if (!connectedAccount?.accessToken) {
      toast.error('Please connect your ad account first')
      return
    }

    if (!campaignName || !objective || !dailyBudget) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    try {
      if (platform === 'facebook') {
        // Create campaign
        const campaignId = await createFacebookCampaign(
          connectedAccount.accessToken,
          connectedAccount.accountId,
          {
            name: campaignName,
            objective,
            status: 'PAUSED',
            dailyBudget: parseFloat(dailyBudget),
          }
        )

        // Create ad set
        const adSetId = await createFacebookAdSet(
          connectedAccount.accessToken,
          connectedAccount.accountId,
          campaignId,
          {
            name: `${campaignName} - Ad Set`,
            targeting: {
              ageMin: parseInt(targeting.ageMin),
              ageMax: parseInt(targeting.ageMax),
              genders: targeting.genders,
              locations: targeting.locations,
            },
            dailyBudget: parseFloat(dailyBudget),
            optimizationGoal: 'LINK_CLICKS',
            billingEvent: 'IMPRESSIONS',
          }
        )

        // Create creative
        const creativeId = await createFacebookAdCreative(
          connectedAccount.accessToken,
          connectedAccount.accountId,
          {
            name: `${campaignName} - Creative`,
            message: content,
            imageUrl,
            linkUrl: linkUrl || 'https://example.com',
            headline,
            description,
            callToAction: 'LEARN_MORE',
          }
        )

        // Create ad
        const adId = await createFacebookAd(
          connectedAccount.accessToken,
          connectedAccount.accountId,
          adSetId,
          creativeId,
          `${campaignName} - Ad`,
          'PAUSED'
        )

        toast.success('Ad created successfully! Check your Facebook Ads Manager.')
      } else {
        toast.success(`${platform} integration coming soon!`)
      }

      onClose()
    } catch (error: any) {
      toast.error(`Failed to create ad: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const objectives: Record<Exclude<AdPlatform, 'google'>, Array<{ value: string; label: string }>> = {
    facebook: [
      { value: 'OUTCOME_TRAFFIC', label: 'Traffic' },
      { value: 'OUTCOME_ENGAGEMENT', label: 'Engagement' },
      { value: 'OUTCOME_LEADS', label: 'Leads' },
      { value: 'OUTCOME_SALES', label: 'Sales' },
      { value: 'OUTCOME_AWARENESS', label: 'Awareness' },
    ],
    instagram: [
      { value: 'OUTCOME_TRAFFIC', label: 'Traffic' },
      { value: 'OUTCOME_ENGAGEMENT', label: 'Engagement' },
      { value: 'OUTCOME_LEADS', label: 'Leads' },
      { value: 'OUTCOME_SALES', label: 'Sales' },
      { value: 'OUTCOME_AWARENESS', label: 'Awareness' },
    ],
    linkedin: [
      { value: 'WEBSITE_VISITS', label: 'Website Visits' },
      { value: 'LEAD_GENERATION', label: 'Lead Generation' },
    ],
    twitter: [
      { value: 'WEBSITE_CLICKS', label: 'Website Clicks' },
      { value: 'TWEET_ENGAGEMENTS', label: 'Engagements' },
    ],
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Create Paid Ad</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!connectedAccount ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800">
              Please connect your {platform} account in Settings first.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="My Ad Campaign"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objective *
              </label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select objective...</option>
                {platform !== 'google' && objectives[platform as Exclude<AdPlatform, 'google'>]?.map((obj) => (
                  <option key={obj.value} value={obj.value}>
                    {obj.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Daily Budget ($) *</span>
              </label>
              <input
                type="number"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                placeholder="10.00"
                min="1"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Targeting</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Age</label>
                  <input
                    type="number"
                    value={targeting.ageMin}
                    onChange={(e) =>
                      setTargeting({ ...targeting, ageMin: e.target.value })
                    }
                    min="18"
                    max="65"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Age</label>
                  <input
                    type="number"
                    value={targeting.ageMax}
                    onChange={(e) =>
                      setTargeting({ ...targeting, ageMax: e.target.value })
                    }
                    min="18"
                    max="65"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {imageUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>Ad Image</span>
                </label>
                <img src={imageUrl} alt="Ad creative" className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Ad Copy:</p>
              <p className="text-sm text-gray-600">{content}</p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
              >
                {isCreating ? 'Creating Ad...' : 'Create Ad'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
