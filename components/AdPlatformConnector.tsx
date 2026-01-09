'use client'

import { useState } from 'react'
import { Facebook, Linkedin, Twitter, Instagram, CheckCircle, X, Loader2 } from 'lucide-react'
import { AdPlatform, AdAccount } from '@/lib/ad-platforms'
import { connectFacebookAccount } from '@/lib/facebook-ads'
import { connectInstagramAccount } from '@/lib/instagram-ads'
import { connectLinkedInAccount } from '@/lib/linkedin-ads'
import { connectTwitterAccount } from '@/lib/twitter-ads'
import { useStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface AdPlatformConnectorProps {
  platform: AdPlatform
  onConnected: (account: AdAccount) => void
}

const platformIcons: Record<Exclude<AdPlatform, 'google'>, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
}

const platformNames: Record<AdPlatform, string> = {
  facebook: 'Facebook Ads',
  instagram: 'Instagram Ads',
  linkedin: 'LinkedIn Ads',
  twitter: 'Twitter/X Ads',
  google: 'Google Ads',
}

export function AdPlatformConnector({ platform, onConnected }: AdPlatformConnectorProps) {
  const { settings, updateSettings } = useStore()
  const [isConnecting, setIsConnecting] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [accessTokenSecret, setAccessTokenSecret] = useState('') // For Twitter

  const connectedAccounts = settings.adAccounts || []
  const isConnected = connectedAccounts.some((acc) => acc.platform === platform && acc.connected)

  const handleOAuthConnect = async () => {
    setIsConnecting(true)
    try {
      // In production, this would open OAuth popup
      // For now, we'll use manual token entry
      setShowManual(true)
    } catch (error: any) {
      toast.error(`Failed to connect: ${error.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleManualConnect = async () => {
    if (!accessToken.trim()) {
      toast.error('Please enter access token')
      return
    }

    setIsConnecting(true)
    try {
      let account: AdAccount

      switch (platform) {
        case 'facebook':
          account = await connectFacebookAccount(accessToken)
          break
        case 'instagram':
          account = await connectInstagramAccount(accessToken)
          break
        case 'linkedin':
          account = await connectLinkedInAccount(accessToken)
          break
        case 'twitter':
          if (!accessTokenSecret.trim()) {
            toast.error('Twitter requires both access token and secret')
            return
          }
          account = await connectTwitterAccount(accessToken, accessTokenSecret)
          break
        default:
          throw new Error('Unknown platform')
      }

      // Save to settings
      const updatedAccounts = [
        ...connectedAccounts.filter((acc) => acc.platform !== platform),
        account,
      ]
      updateSettings({ adAccounts: updatedAccounts })

      onConnected(account)
      toast.success(`Connected to ${platformNames[platform]}!`)
      setShowManual(false)
      setAccessToken('')
      setAccessTokenSecret('')
    } catch (error: any) {
      toast.error(`Connection failed: ${error.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    const updatedAccounts = connectedAccounts.filter((acc) => acc.platform !== platform)
    updateSettings({ adAccounts: updatedAccounts })
    toast.success(`Disconnected from ${platformNames[platform]}`)
  }

  // Safety check - if platform is 'google' or doesn't exist, show message
  if (platform === 'google') {
    return (
      <div className="p-4 glass border border-blue-500/30 rounded-lg bg-blue-500/10">
        <p className="text-sm text-blue-400">Google Ads integration coming soon!</p>
      </div>
    )
  }
  
  const Icon = platformIcons[platform as Exclude<AdPlatform, 'google'>]
  
  // Safety check - if platform doesn't exist, use a default icon
  if (!Icon) {
    console.error(`Unknown platform: ${platform}`)
    return (
      <div className="p-4 glass border border-red-500/30 rounded-lg bg-red-500/10">
        <p className="text-sm text-red-400">Unknown platform: {platform}</p>
      </div>
    )
  }

  if (isConnected) {
    const account = connectedAccounts.find((acc) => acc.platform === platform && acc.connected)!
    return (
      <div className="p-4 glass border border-green-500/30 rounded-lg bg-green-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-300">{platformNames[platform]}</p>
              <p className="text-sm text-green-400">{account.name}</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <button
            onClick={handleDisconnect}
            className="px-3 py-1 text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 glass border border-slate-700/50 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-white">{platformNames[platform]}</p>
            <p className="text-sm text-slate-400">Not connected</p>
          </div>
        </div>
        <button
          onClick={handleOAuthConnect}
          disabled={isConnecting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
        </button>
      </div>

      {showManual && (
        <div className="mt-4 p-4 glass border border-slate-700/50 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Enter access token..."
              className="w-full px-3 py-2 glass rounded-lg focus:ring-2 focus:ring-blue-500 text-white placeholder:text-slate-400"
            />
          </div>
          {platform === 'twitter' && (
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Access Token Secret
              </label>
              <input
                type="password"
                value={accessTokenSecret}
                onChange={(e) => setAccessTokenSecret(e.target.value)}
                placeholder="Enter access token secret..."
                className="w-full px-3 py-2 glass rounded-lg focus:ring-2 focus:ring-blue-500 text-white placeholder:text-slate-400"
              />
            </div>
          )}
          <div className="flex space-x-2">
            <button
              onClick={handleManualConnect}
              disabled={isConnecting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </button>
            <button
              onClick={() => {
                setShowManual(false)
                setAccessToken('')
                setAccessTokenSecret('')
              }}
              className="px-4 py-2 glass text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Get your access token from {platformNames[platform]} Developer Console
          </p>
        </div>
      )}
    </div>
  )
}
