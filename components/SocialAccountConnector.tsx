'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Facebook, Linkedin, Twitter, Instagram, CheckCircle, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface SocialAccount {
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram'
  accessToken: string
  userId?: string
  connected: boolean
  connectedAt?: string
}

const platformIcons = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
}

const platformNames = {
  facebook: 'Facebook',
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
}

export function SocialAccountConnector() {
  const { settings, updateSettings } = useStore()
  const router = useRouter()
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [hasHandledCallback, setHasHandledCallback] = useState(false)
  const [showManualToken, setShowManualToken] = useState<string | null>(null)
  const [manualAccessToken, setManualAccessToken] = useState('')
  const [manualUserId, setManualUserId] = useState('')

  // Handle OAuth callback
  useEffect(() => {
    if (hasHandledCallback) return

    const searchParams = new URLSearchParams(window.location.search)
    const oauthSuccess = searchParams.get('oauth_success')
    const oauthError = searchParams.get('oauth_error')

    if (oauthSuccess || oauthError) {
      setHasHandledCallback(true)
      
      // Remove query params from URL
      router.replace('/settings', { scroll: false })

      if (oauthError) {
        toast.error(`OAuth error: ${oauthError}`)
        setIsConnecting(null)
        return
      }

      if (oauthSuccess) {
        // Retrieve the token
        const retrieveToken = async () => {
          try {
            // Small delay to ensure cookie is set
            await new Promise(resolve => setTimeout(resolve, 500))
            
            const response = await fetch('/api/oauth/token')
            if (!response.ok) {
              throw new Error('Failed to retrieve token')
            }

            const data = await response.json()
            const { accessToken, userId, platform } = data

            if (!accessToken || !platform) {
              throw new Error('Invalid token data')
            }

            // Get current social accounts from store (get latest state)
            const currentSettings = settings
            const currentSocialAccounts = currentSettings.socialAccounts || []

            // Save the account
            // Note: Instagram uses Facebook OAuth, so both Facebook and Instagram
            // share the same underlying authentication, but are stored as separate
            // platform entries so they can be used independently
            const newAccount: SocialAccount = {
              platform: platform as any,
              accessToken,
              userId,
              connected: true,
              connectedAt: new Date().toISOString(),
            }

            // Filter out any existing account with the same platform, then add the new one
            // This allows Facebook and Instagram to coexist even though they use the same OAuth
            const existingOtherPlatforms = currentSocialAccounts.filter((acc) => acc.platform !== platform)
            const updated = [
              ...existingOtherPlatforms,
              newAccount,
            ]

            console.log('Updating social accounts:', { 
              platform, 
              existingCount: currentSocialAccounts.length,
              updatedCount: updated.length,
              existingPlatforms: currentSocialAccounts.map(acc => acc.platform),
              newPlatforms: updated.map(acc => acc.platform)
            })

            updateSettings({ socialAccounts: updated })
            toast.success(`Connected to ${platformNames[platform as keyof typeof platformNames]}!`)
            setIsConnecting(null)
          } catch (error: any) {
            console.error('Error retrieving OAuth token:', error)
            toast.error(`Failed to complete connection: ${error.message}`)
            setIsConnecting(null)
          }
        }

        retrieveToken()
      }
    }
  }, [hasHandledCallback, router, settings, updateSettings])

  const handleConnect = async (platform: string) => {
    setIsConnecting(platform)
    try {
      // Redirect to OAuth endpoint
      window.location.href = `/api/oauth/${platform}`
    } catch (error: any) {
      toast.error(`Failed to start OAuth: ${error.message}`)
      setIsConnecting(null)
    }
  }

  const handleDisconnect = (platform: string) => {
    const currentSocialAccounts = settings.socialAccounts || []
    const updated = currentSocialAccounts.filter((acc) => acc.platform !== platform)
    updateSettings({ socialAccounts: updated })
    toast.success(`Disconnected from ${platformNames[platform as keyof typeof platformNames]}`)
  }

  const handleManualTokenConnect = async (platform: string) => {
    if (!manualAccessToken.trim()) {
      toast.error('Please enter an access token')
      return
    }

    setIsConnecting(platform)
    try {
      // Validate the token by making a test API call
      let userId: string | undefined = manualUserId.trim() || undefined
      
      if (platform === 'instagram') {
        // Try to get Instagram Business Account ID from the token
        if (!userId) {
          try {
            // First try Instagram Graph API
            const meResponse = await fetch(
              `https://graph.instagram.com/me?fields=id,username&access_token=${manualAccessToken}`
            )
            
            if (meResponse.ok) {
              const meData = await meResponse.json()
              userId = meData.id
              console.log(`Got Instagram Business Account ID: ${userId}`)
            } else {
              // Try Facebook Graph API to get pages and Instagram Business Account
              const pagesResponse = await fetch(
                `https://graph.facebook.com/v18.0/me/accounts?access_token=${manualAccessToken}&fields=id,name,instagram_business_account`
              )
              
              if (pagesResponse.ok) {
                const pagesData = await pagesResponse.json()
                const pages = pagesData.data || []
                
                for (const page of pages) {
                  if (page.instagram_business_account?.id) {
                    userId = page.instagram_business_account.id
                    console.log(`Found Instagram Business Account ID: ${userId}`)
                    break
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error validating Instagram token:', error)
            // Continue anyway - user can provide userId manually
          }
        }

        if (!userId && !manualUserId.trim()) {
          toast.error('Could not automatically detect Instagram Business Account ID. Please enter it manually.')
          setIsConnecting(null)
          return
        }
      } else {
        // For other platforms, try to get user ID
        try {
          const response = await fetch(
            `https://graph.facebook.com/v18.0/me?access_token=${manualAccessToken}&fields=id`
          )
          if (response.ok) {
            const data = await response.json()
            userId = data.id
          }
        } catch (error) {
          console.error('Error validating token:', error)
        }
      }

      // Get current social accounts
      const currentSettings = settings
      const currentSocialAccounts = currentSettings.socialAccounts || []

      // Create new account
      const newAccount: SocialAccount = {
        platform: platform as any,
        accessToken: manualAccessToken.trim(),
        userId: userId || manualUserId.trim() || undefined,
        connected: true,
        connectedAt: new Date().toISOString(),
      }

      // Update accounts
      const existingOtherPlatforms = currentSocialAccounts.filter((acc) => acc.platform !== platform)
      const updated = [...existingOtherPlatforms, newAccount]

      updateSettings({
        socialAccounts: updated,
      })

      toast.success(`Connected to ${platformNames[platform as keyof typeof platformNames]}!`)
      setShowManualToken(null)
      setManualAccessToken('')
      setManualUserId('')
    } catch (error: any) {
      toast.error(`Connection failed: ${error.message || 'Invalid token'}`)
    } finally {
      setIsConnecting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-slate-200 mb-2">Social Media Accounts</h4>
        <p className="text-xs text-slate-400 mb-4">
          Click "Connect" to log in with your social media account - no tokens needed!
        </p>
      </div>

      {(['facebook', 'twitter', 'linkedin', 'instagram'] as const).map((platform) => {
        const Icon = platformIcons[platform]
        const socialAccounts = settings.socialAccounts || []
        const account = socialAccounts.find((acc) => acc.platform === platform && acc.connected)

        if (account) {
          return (
            <div key={platform} className="p-4 glass border border-green-500/30 rounded-lg bg-green-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-green-300">{platformNames[platform]}</p>
                    <p className="text-sm text-green-400">Connected</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <button
                  onClick={() => handleDisconnect(platform)}
                  className="px-3 py-1 text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )
        }

        return (
          <div key={platform} className="p-4 glass border border-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{platformNames[platform]}</p>
                  <p className="text-sm text-slate-400">Not connected</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {platform === 'instagram' && (
                  <button
                    onClick={() => setShowManualToken(showManualToken === platform ? null : platform)}
                    className="px-3 py-2 text-sm glass hover:bg-slate-700/50 rounded transition-colors text-slate-300"
                  >
                    {showManualToken === platform ? 'Cancel' : 'Use Access Token'}
                  </button>
                )}
              <button
                onClick={() => handleConnect(platform)}
                disabled={isConnecting === platform}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm flex items-center space-x-2"
              >
                {isConnecting === platform ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Connect with {platformNames[platform]}</span>
                )}
              </button>
            </div>
            </div>

            {/* Manual Token Form for Instagram */}
            {showManualToken === platform && platform === 'instagram' && (
              <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1.5">
                    Instagram Access Token
                  </label>
                  <input
                    type="text"
                    value={manualAccessToken}
                    onChange={(e) => setManualAccessToken(e.target.value)}
                    placeholder="Enter your Instagram access token"
                    className="w-full px-3 py-2 glass rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-400 text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Get your token from{' '}
                    <a
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Facebook Graph API Explorer
                    </a>
                    {' '}or{' '}
                    <a
                      href="https://www.facebook.com/settings?tab=business_tools"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Business Settings
                    </a>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1.5">
                    Instagram Business Account ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualUserId}
                    onChange={(e) => setManualUserId(e.target.value)}
                    placeholder="Will be auto-detected if not provided"
                    className="w-full px-3 py-2 glass rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-400 text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Your Instagram Business Account ID. We'll try to detect it automatically from your token.
                  </p>
                </div>
                <button
                  onClick={() => handleManualTokenConnect(platform)}
                  disabled={isConnecting === platform || !manualAccessToken.trim()}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
                >
                  {isConnecting === platform ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Connect with Token</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
