'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings as SettingsIcon, Key, Building, Target, Save, Brain, TrendingUp, Eye, CheckCircle, XCircle, Facebook, Instagram, Linkedin, Twitter, Loader2, Sparkles, HardDrive, Database, RefreshCw, AlertCircle, CheckCircle2, Zap, X, Search, Download, Upload } from 'lucide-react'
import { useStore, getStorageUsage, getStorageQuota } from '@/lib/store'
import toast from 'react-hot-toast'
import { useLanguage } from '@/lib/language-context'
import { AdPlatform } from '@/lib/ad-platforms'
import { analyzeEdit, containsInappropriateContent } from '@/lib/content-learner'
import { connectFacebookAccount } from '@/lib/facebook-ads'
import { connectInstagramAccount } from '@/lib/instagram-ads'
import { connectLinkedInAccount } from '@/lib/linkedin-ads'
import { connectTwitterAccount } from '@/lib/twitter-ads'
import { exportData, importData } from '@/lib/backup'

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

export default function SettingsPage() {
  const { t } = useLanguage()
  const { settings, updateSettings } = useStore()
  const router = useRouter()
  const [formData, setFormData] = useState({
    geminiApiKey: settings.geminiApiKey || '',
    businessName: settings.businessName || '',
    businessType: settings.businessType || '',
    targetAudience: settings.targetAudience || '',
  })
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [hasHandledCallback, setHasHandledCallback] = useState(false)
  const [activeHistoryTab, setActiveHistoryTab] = useState<'overview' | 'accepted' | 'edits' | 'scanned' | 'storage'>('overview')
  const [showAllItems, setShowAllItems] = useState<Record<string, boolean>>({})
  const [storageInfo, setStorageInfo] = useState<ReturnType<typeof getStorageUsage> | null>(null)
  const [storageQuota, setStorageQuota] = useState<Awaited<ReturnType<typeof getStorageQuota>> | null>(null)
  const [showManualToken, setShowManualToken] = useState<string | null>(null)
  const [manualAccessToken, setManualAccessToken] = useState('')
  const [manualUserId, setManualUserId] = useState('')
  const [isValidatingToken, setIsValidatingToken] = useState(false)

  // Handle OAuth callback
  useEffect(() => {
    if (hasHandledCallback) return

    const searchParams = new URLSearchParams(window.location.search)
    const oauthSuccess = searchParams.get('oauth_success')
    const oauthError = searchParams.get('oauth_error')

    if (oauthSuccess || oauthError) {
      setHasHandledCallback(true)
      router.replace('/settings', { scroll: false })

      if (oauthError) {
        toast.error(`OAuth error: ${oauthError}`)
        setIsConnecting(null)
        return
      }

      if (oauthSuccess) {
        const retrieveToken = async () => {
          try {
            await new Promise(resolve => setTimeout(resolve, 500))
            const response = await fetch('/api/oauth/token')
            if (!response.ok) throw new Error('Failed to retrieve token')

            const data = await response.json()
            const { accessToken, userId, platform } = data

            if (!accessToken || !platform) throw new Error('Invalid token data')

            const currentSocialAccounts = settings.socialAccounts || []
            const newAccount = {
              platform: platform as any,
              accessToken,
              userId,
              connected: true,
              connectedAt: new Date().toISOString(),
            }

            // For Meta platforms (Facebook/Instagram), connect both with the same token
            // Facebook and Instagram share the same OAuth token from Meta
            // For other platforms, just replace the existing account for that platform
            // IMPORTANT: Preserve ALL other platforms when connecting a new one
            let updated: typeof currentSocialAccounts = []
            let connectedBoth = false
            
            if (platform === 'facebook' || platform === 'instagram') {
              // Remove existing Facebook and Instagram accounts (they'll be replaced with new token)
              // But preserve all other platforms (Twitter, LinkedIn)
              updated = currentSocialAccounts.filter((acc) => acc.platform !== 'facebook' && acc.platform !== 'instagram')
              
              // Add the connected platform
              updated.push(newAccount)
              
              // If connecting Facebook, also try to connect Instagram with the same token
              if (platform === 'facebook') {
                // Try to get Instagram Business Account ID
                try {
                  const pagesResponse = await fetch(
                    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,instagram_business_account{id,username}`
                  )
                  
                  if (pagesResponse.ok) {
                    const pagesData = await pagesResponse.json()
                    const pages = pagesData.data || []
                    
                    for (const page of pages) {
                      if (page.instagram_business_account?.id) {
                        updated.push({
                          platform: 'instagram',
                          accessToken, // Same token as Facebook
                          userId: page.instagram_business_account.id,
                          connected: true,
                          connectedAt: new Date().toISOString(),
                        })
                        connectedBoth = true
                        console.log(`Auto-connected Instagram Business Account: ${page.instagram_business_account.id}`)
                        break
                      }
                    }
                  }
                } catch (error) {
                  console.warn('Could not auto-connect Instagram:', error)
                }
              }
              
              // If connecting Instagram, also connect Facebook with the same token
              if (platform === 'instagram') {
                // Get Facebook user ID
                try {
                  const meResponse = await fetch(
                    `https://graph.facebook.com/v18.0/me?access_token=${accessToken}&fields=id,name`
                  )
                  
                  if (meResponse.ok) {
                    const meData = await meResponse.json()
                    updated.push({
                      platform: 'facebook',
                      accessToken, // Same token as Instagram
                      userId: meData.id,
                      connected: true,
                      connectedAt: new Date().toISOString(),
                    })
                    connectedBoth = true
                    console.log(`Auto-connected Facebook account: ${meData.id}`)
                  }
                } catch (error) {
                  console.warn('Could not auto-connect Facebook:', error)
                }
              }
              
              // Show appropriate success message
              if (connectedBoth) {
                toast.success(`Connected to Facebook and Instagram with one Meta account!`)
              } else {
                toast.success(`Connected to ${platformNames[platform as keyof typeof platformNames]}!`)
              }
            } else {
              // For other platforms, just replace the existing account
              updated = [
                ...currentSocialAccounts.filter((acc) => acc.platform !== platform),
                newAccount,
              ]
              toast.success(`Connected to ${platformNames[platform as keyof typeof platformNames]}!`)
            }

            updateSettings({ socialAccounts: updated })
            setIsConnecting(null)
          } catch (error: any) {
            toast.error(`Failed to complete connection: ${error.message}`)
            setIsConnecting(null)
          }
        }

        retrieveToken()
      }
    }
  }, [hasHandledCallback, router, settings, updateSettings])

  // Check Facebook login status on mount (if Facebook SDK is available)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Check if Facebook SDK is loaded
    const checkFacebookLoginStatus = () => {
      if (typeof (window as any).FB !== 'undefined') {
        const FB = (window as any).FB
        
        // Check if user is already logged into Facebook
        FB.getLoginStatus((response: any) => {
          if (response.status === 'connected' && response.authResponse) {
            // User is already logged into Facebook
            // Don't auto-connect, just log for debugging
            console.log('[Facebook SDK] User is already logged into Facebook', {
              userId: response.authResponse.userID,
              accessToken: response.authResponse.accessToken ? '***' : undefined,
            })
            
            // Check if we already have this Facebook account connected
            const currentSocialAccounts = settings.socialAccounts || []
            const existingFacebookAccount = currentSocialAccounts.find(
              (acc) => acc.platform === 'facebook' && acc.userId === response.authResponse.userID
            )
            
            if (!existingFacebookAccount) {
              // User is logged into Facebook but not connected to our app
              // We'll wait for them to click the Social button to connect
              console.log('[Facebook SDK] User is logged into Facebook but not connected to app')
            }
          } else {
            console.log('[Facebook SDK] User is not logged into Facebook', { status: response.status })
          }
        })
      } else {
        // SDK not loaded yet, try again after a short delay
        setTimeout(checkFacebookLoginStatus, 100)
      }
    }
    
    // Wait a bit for SDK to load, then check status
    setTimeout(checkFacebookLoginStatus, 500)
  }, [settings.socialAccounts])

  // Update storage info when settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info = getStorageUsage()
      setStorageInfo(info)
      
      // Try to get actual quota (async)
      getStorageQuota().then(quota => {
        if (quota) {
          setStorageQuota(quota)
        }
      }).catch(err => {
        console.error('Error getting storage quota:', err)
      })
    }
  }, [settings])

  const handleSocialConnect = async (platform: string) => {
    setIsConnecting(platform)
    
    // Use Facebook JavaScript SDK for Facebook login
    if (platform === 'facebook') {
      try {
        // Wait for FB SDK to be loaded
        if (typeof window === 'undefined' || typeof (window as any).FB === 'undefined') {
          // Wait for SDK to load
          await new Promise<void>((resolve) => {
            const checkFB = () => {
              if (typeof (window as any).FB !== 'undefined') {
                resolve()
              } else {
                setTimeout(checkFB, 100)
              }
            }
            checkFB()
          })
        }
        
        const FB = (window as any).FB
        
        FB.login((response: any) => {
          if (response.authResponse) {
            const accessToken = response.authResponse.accessToken
            
            // Get user info
            FB.api('/me', { fields: 'id,name' }, (userInfo: any) => {
              // Use async IIFE to handle async operations inside callback
              (async () => {
                try {
                  const userId = userInfo.id
                  
                  // Save the account
                  const currentSocialAccounts = settings.socialAccounts || []
                  const newAccount = {
                    platform: 'facebook' as const,
                    accessToken,
                    userId,
                    connected: true,
                    connectedAt: new Date().toISOString(),
                  }
                  
                  // For Meta platforms (Facebook/Instagram), connect both with the same token
                  let updated: typeof currentSocialAccounts = []
                  updated = currentSocialAccounts.filter((acc) => acc.platform !== 'facebook' && acc.platform !== 'instagram')
                  updated.push(newAccount)
                  
                  // Try to connect Instagram with the same token
                  try {
                    const pagesResponse = await fetch(
                      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,instagram_business_account{id,username}`
                    )
                    
                    if (pagesResponse.ok) {
                      const pagesData = await pagesResponse.json()
                      const pages = pagesData.data || []
                      
                      for (const page of pages) {
                        if (page.instagram_business_account?.id) {
                          updated.push({
                            platform: 'instagram',
                            accessToken, // Same token as Facebook
                            userId: page.instagram_business_account.id,
                            connected: true,
                            connectedAt: new Date().toISOString(),
                          })
                          break
                        }
                      }
                    }
                  } catch (error) {
                    console.error('Failed to connect Instagram:', error)
                    // Continue even if Instagram connection fails
                  }
                  
                  updateSettings({ socialAccounts: updated })
                  toast.success('Facebook connected successfully!')
                  setIsConnecting(null)
                } catch (error: any) {
                  console.error('Facebook connection error:', error)
                  toast.error(`Failed to connect: ${error.message}`)
                  setIsConnecting(null)
                }
              })()
            })
          } else {
            // User cancelled login
            toast.error('Facebook login was cancelled')
            setIsConnecting(null)
          }
        }, { scope: 'public_profile,pages_show_list,pages_read_engagement,pages_read_user_content,pages_manage_posts,pages_manage_metadata' })
      } catch (error: any) {
        console.error('Facebook SDK error:', error)
        toast.error(`Failed to initialize Facebook login: ${error.message}`)
        setIsConnecting(null)
      }
    } else {
      // Other platforms use OAuth redirect
      window.location.href = `/api/oauth/${platform}`
    }
  }

  const handleSocialDisconnect = (platform: string) => {
    const currentSocialAccounts = settings.socialAccounts || []
    // For Meta platforms, only disconnect the specific platform, not both
    // This allows users to keep one connected while disconnecting the other
    const updated = currentSocialAccounts.filter((acc) => acc.platform !== platform)
    updateSettings({ socialAccounts: updated })
    toast.success(`Disconnected from ${platformNames[platform as keyof typeof platformNames]}`)
  }

  const handleValidateAndDetectId = async () => {
    // Determine which platform we're validating for based on the currently shown modal
    const currentPlatform = showManualToken

    // If only ID is provided but no token, start OAuth flow to get token (Instagram only for now)
    if (currentPlatform === 'instagram' && manualUserId.trim() && !manualAccessToken.trim()) {
      toast.loading('Redirecting to Instagram to get access token...', { duration: 2000 })
      // Store the ID temporarily so we can use it after OAuth
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('instagram_manual_user_id', manualUserId.trim())
      }
      // Start OAuth flow
      window.location.href = '/api/oauth/instagram'
      return
    }

    // If token is provided, validate and auto-detect ID
    if (!manualAccessToken.trim()) {
      toast.error(`Please enter an Access Token${currentPlatform === 'instagram' ? ' or Instagram Business Account ID' : ''}`)
      return
    }

    setIsValidatingToken(true)
    try {
      let validationResponse: Response
      let validationData: any

      if (currentPlatform === 'instagram') {
        validationResponse = await fetch('/api/validate-instagram-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: manualAccessToken.trim(),
          }),
        })
        validationData = await validationResponse.json()

        if (!validationResponse.ok || !validationData.valid) {
          const errorMessage = validationData.error || 'Invalid token. Please check your access token and try again.'
          const errorType = validationData.errorType || 'unknown'
          
          if (errorType === 'OAuthException') {
            toast.error(`Invalid or expired token: ${errorMessage}`)
          } else if (errorMessage.includes('expired')) {
            toast.error('This token has expired. Please generate a new access token.')
          } else if (errorMessage.includes('permission')) {
            toast.error('This token does not have the required permissions. Please ensure your token has access to Instagram Business Account data.')
          } else {
            toast.error(errorMessage || 'Token validation failed. Please check your access token.')
          }
          return
        }

        // Token is valid - auto-fill the ID field if empty, or validate if ID matches
        if (manualUserId.trim()) {
          // User provided ID - check if it matches
          if (validationData.userId === manualUserId.trim()) {
            toast.success(`Token validated! Account ID matches: ${validationData.userId}`)
          } else if (validationData.userId) {
            toast.error(`Token belongs to different account. Detected ID: ${validationData.userId}, but you entered: ${manualUserId.trim()}`)
          }
        } else if (validationData.userId) {
          // No ID provided - auto-fill it
          setManualUserId(validationData.userId)
          if (validationData.username) {
            toast.success(`Token validated! Found Instagram account: @${validationData.username} (ID: ${validationData.userId})`)
          } else {
            toast.success(`Token validated! Found Account ID: ${validationData.userId}`)
          }
        } else {
          toast.error('Token is valid but could not detect Instagram Business Account ID. Please enter it manually.')
        }
      } else if (currentPlatform === 'twitter') {
        validationResponse = await fetch('/api/validate-twitter-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: manualAccessToken.trim(),
          }),
        })
        validationData = await validationResponse.json()

        if (!validationResponse.ok || !validationData.valid) {
          const errorMessage = validationData.error || 'Invalid token. Please check your access token and try again.'
          const errorType = validationData.errorType || 'unknown'
          
          if (errorMessage.includes('expired') || errorMessage.includes('Invalid')) {
            toast.error('This token has expired or is invalid. Please generate a new access token.')
          } else if (errorMessage.includes('permission') || errorMessage.includes('scope')) {
            toast.error('This token does not have the required permissions. Please ensure your token has tweet.read and tweet.write permissions.')
          } else {
            toast.error(errorMessage || 'Token validation failed. Please check your access token.')
          }
          return
        }

        // Token is valid - auto-fill the ID field if empty, or validate if ID matches
        if (manualUserId.trim()) {
          // User provided ID - check if it matches
          if (validationData.userId === manualUserId.trim()) {
            toast.success(`Token validated! User ID matches: ${validationData.userId}`)
          } else if (validationData.userId) {
            toast.error(`Token belongs to different account. Detected ID: ${validationData.userId}, but you entered: ${manualUserId.trim()}`)
          }
        } else if (validationData.userId) {
          // No ID provided - auto-fill it
          setManualUserId(validationData.userId)
          if (validationData.username) {
            toast.success(`Token validated! Found Twitter account: @${validationData.username} (ID: ${validationData.userId})`)
          } else {
            toast.success(`Token validated! Found User ID: ${validationData.userId}`)
          }
        } else {
          toast.error('Token is valid but could not detect Twitter User ID. Please enter it manually.')
        }
      } else if (currentPlatform === 'facebook') {
        // Facebook validation is handled directly in handleManualTokenConnect
        toast.error('Please use the Connect button to validate Facebook tokens.')
        return
      } else {
        toast.error('Platform not supported for token validation.')
        return
      }
    } catch (error: any) {
      console.error('Validation error:', error)
      toast.error(error.message || 'Failed to validate token. Please try again.')
    } finally {
      setIsValidatingToken(false)
    }
  }

  const handleManualTokenConnect = async (platform: string) => {
    if (!manualAccessToken.trim()) {
      toast.error('Please enter access token')
      return
    }

    setIsConnecting(platform)
    try {
      let userId: string | undefined = undefined
      const manualUserIdValue = manualUserId.trim()

      // For Instagram, validate the token using server-side endpoint
      if (platform === 'instagram') {
        const validationResponse = await fetch('/api/validate-instagram-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: manualAccessToken.trim(),
          }),
        })

        const validationData = await validationResponse.json()

        if (!validationResponse.ok || !validationData.valid) {
          const errorMessage = validationData.error || 'Invalid token. Please check your access token and try again.'
          const errorType = validationData.errorType || 'unknown'
          
          if (errorType === 'OAuthException') {
            throw new Error(`Invalid or expired token: ${errorMessage}`)
          } else if (errorMessage.includes('expired')) {
            throw new Error('This token has expired. Please generate a new access token.')
          } else if (errorMessage.includes('permission')) {
            throw new Error('This token does not have the required permissions. Please ensure your token has access to Instagram Business Account data.')
          } else {
            throw new Error(errorMessage || 'Token validation failed. Please check your access token.')
          }
        }

        // Token is valid - prioritize manually entered userId over auto-detected
        if (manualUserIdValue) {
          userId = manualUserIdValue
          console.log(`Using manually provided Instagram Business Account ID: ${userId}`)
          if (validationData.username) {
            toast.success(`Token validated! Using provided Account ID: ${userId}`)
          }
        } else if (validationData.userId) {
          userId = validationData.userId
          console.log(`Valid Instagram token - Auto-detected Account ID: ${userId}, Username: ${validationData.username || 'N/A'}, Source: ${validationData.source || 'unknown'}`)
          
          if (validationData.username) {
            toast.success(`Token validated! Found Instagram account: @${validationData.username} (ID: ${userId})`)
          } else {
            toast.success(`Token validated! Found Account ID: ${userId}`)
          }
        } else {
          // If no userId returned and no manual entry, token might be valid but can't find Instagram account
          throw new Error('Token is valid but could not detect Instagram Business Account ID. Please enter your Instagram Business Account ID manually.')
        }
      } else if (platform === 'facebook') {
        // Validate Facebook token by making a test API call
        try {
          const meResponse = await fetch(
            `https://graph.facebook.com/v18.0/me?access_token=${manualAccessToken.trim()}&fields=id,name`
          )
          
          if (!meResponse.ok) {
            const errorData = await meResponse.json()
            const errorMessage = errorData.error?.message || 'Invalid token'
            
            if (errorMessage.includes('expired') || errorMessage.includes('Invalid OAuth')) {
              throw new Error('This token has expired. Please generate a new access token.')
            } else if (errorMessage.includes('permission') || errorMessage.includes('scope')) {
              throw new Error('This token does not have the required permissions. Please ensure your token has the necessary Facebook permissions.')
            } else {
              throw new Error(`Invalid token: ${errorMessage}`)
            }
          }
          
          const meData = await meResponse.json()
          
          // Token is valid - use manually entered userId if provided, otherwise use detected user ID
          if (manualUserIdValue) {
            userId = manualUserIdValue
            console.log(`Using manually provided Facebook User ID: ${userId}`)
            toast.success(`Token validated! Using provided User ID: ${userId}`)
          } else {
            userId = meData.id
            console.log(`Valid Facebook token - Auto-detected User ID: ${userId}, Name: ${meData.name || 'N/A'}`)
            toast.success(`Token validated! Found Facebook account: ${meData.name || 'Unknown'} (ID: ${userId})`)
          }
        } catch (error: any) {
          console.error('Facebook token validation error:', error)
          throw new Error(error.message || 'Facebook token validation failed. Please check your access token.')
        }
      } else if (platform === 'twitter') {
        // Validate Twitter token using server-side endpoint
        const validationResponse = await fetch('/api/validate-twitter-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: manualAccessToken.trim(),
          }),
        })

        const validationData = await validationResponse.json()

        if (!validationResponse.ok || !validationData.valid) {
          const errorMessage = validationData.error || 'Invalid token. Please check your access token and try again.'
          const errorType = validationData.errorType || 'unknown'
          
          if (errorMessage.includes('expired') || errorMessage.includes('Invalid')) {
            throw new Error('This token has expired or is invalid. Please generate a new access token.')
          } else if (errorMessage.includes('permission') || errorMessage.includes('scope')) {
            throw new Error('This token does not have the required permissions. Please ensure your token has tweet.read and tweet.write permissions.')
          } else {
            throw new Error(errorMessage || 'Token validation failed. Please check your access token.')
          }
        }

        // Token is valid - prioritize manually entered userId over auto-detected
        if (manualUserIdValue) {
          userId = manualUserIdValue
          console.log(`Using manually provided Twitter User ID: ${userId}`)
          if (validationData.username) {
            toast.success(`Token validated! Using provided User ID: ${userId}`)
          }
        } else if (validationData.userId) {
          userId = validationData.userId
          console.log(`Valid Twitter token - Auto-detected User ID: ${userId}, Username: ${validationData.username || 'N/A'}, Name: ${validationData.name || 'N/A'}`)
          
          if (validationData.username) {
            toast.success(`Token validated! Found Twitter account: @${validationData.username} (ID: ${userId})`)
          } else {
            toast.success(`Token validated! Found Account ID: ${userId}`)
          }
        } else {
          // If no userId returned and no manual entry, token might be valid but can't find Twitter account
          throw new Error('Token is valid but could not detect Twitter User ID. Please enter your Twitter User ID manually.')
        }
      } else {
        // For other platforms, use manual userId if provided
        userId = manualUserIdValue || undefined
      }

      const currentSocialAccounts = settings.socialAccounts || []
      const newAccount = {
        platform: platform as any,
        accessToken: manualAccessToken.trim(),
        userId,
        connected: true,
        connectedAt: new Date().toISOString(),
      }

      const updated = [
        ...currentSocialAccounts.filter((acc) => acc.platform !== platform),
        newAccount,
      ]

      updateSettings({ socialAccounts: updated })
      toast.success(`Successfully connected to ${platformNames[platform as keyof typeof platformNames]}!`)
      setShowManualToken(null)
      setManualAccessToken('')
      setManualUserId('')
    } catch (error: any) {
      console.error('Connection error:', error)
      toast.error(error.message || `Connection failed: Invalid token. Please check your access token and try again.`)
    } finally {
      setIsConnecting(null)
    }
  }

  const [adConnecting, setAdConnecting] = useState<string | null>(null)
  const [showAdManual, setShowAdManual] = useState<string | null>(null)
  const [adAccessToken, setAdAccessToken] = useState('')
  const [adAccessTokenSecret, setAdAccessTokenSecret] = useState('')

  const handleAdConnect = async (platform: string) => {
    if (!adAccessToken.trim()) {
      toast.error('Please enter access token')
      return
    }

    setAdConnecting(platform)
    try {
      let account
      const connectedAccounts = settings.adAccounts || []

      switch (platform) {
        case 'facebook':
          account = await connectFacebookAccount(adAccessToken)
          break
        case 'instagram':
          account = await connectInstagramAccount(adAccessToken)
          break
        case 'linkedin':
          account = await connectLinkedInAccount(adAccessToken)
          break
        case 'twitter':
          if (!adAccessTokenSecret.trim()) {
            toast.error('Twitter requires both access token and secret')
            setAdConnecting(null)
            return
          }
          account = await connectTwitterAccount(adAccessToken, adAccessTokenSecret)
          break
        default:
          throw new Error('Unknown platform')
      }

      const updatedAccounts = [
        ...connectedAccounts.filter((acc) => acc.platform !== platform),
        account,
      ]
      updateSettings({ adAccounts: updatedAccounts })

      toast.success(`Connected to ${platformNames[platform as keyof typeof platformNames]} Ads!`)
      setShowAdManual(null)
      setAdAccessToken('')
      setAdAccessTokenSecret('')
    } catch (error: any) {
      toast.error(`Connection failed: ${error.message}`)
    } finally {
      setAdConnecting(null)
    }
  }

  const handleAdDisconnect = (platform: string) => {
    const updated = (settings.adAccounts || []).filter((acc) => acc.platform !== platform)
    updateSettings({ adAccounts: updated })
    toast.success(`Disconnected from ${platformNames[platform as keyof typeof platformNames]} Ads`)
  }

  const handleSave = () => {
    updateSettings(formData)
    toast.success(t('success') + ': ' + t('saveSettings'))
  }

  return (
    <div className="min-h-screen relative">
      {/* Page Header */}
      <div className="glass-strong border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg blur-lg opacity-60"></div>
              <div className="relative w-7 h-7 bg-gradient-to-br from-gray-500 to-gray-700 rounded-lg flex items-center justify-center shadow-glow">
                <SettingsIcon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">{t('settingsTitle')}</h1>
              <p className="text-xs text-slate-300 hidden sm:block">{t('configureYourMarketingAutomation')}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start" style={{ height: '503px', maxHeight: '503px' }}>
          {/* Left Column - Getting Started */}
          <div className="lg:col-span-1" style={{ height: '503px' }}>
            <div className="glass rounded-xl p-3 border border-slate-700/50 h-full flex flex-col">
              <h3 className="text-base font-semibold text-white mb-2 flex-shrink-0">Getting Started</h3>
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <div className="flex items-start gap-2 flex-1">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3 h-3 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white mb-0.5">1. Connect Socials</div>
                    <p className="text-xs text-slate-400 leading-tight">Connect your social media accounts (right column) to create and manage content automatically.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 flex-1">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Key className="w-3 h-3 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white mb-0.5">2. Add API Key</div>
                    <p className="text-xs text-slate-400 leading-tight">Add your Google Gemini API key in the middle column. Required for all AI-powered features.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 flex-1">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building className="w-3 h-3 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white mb-0.5">3. Business Info</div>
                    <p className="text-xs text-slate-400 leading-tight">Fill in your business name, type, and target audience. Helps AI create personalized content.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 flex-1">
                  <div className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white mb-0.5">4. Create Content</div>
                    <p className="text-xs text-slate-400 leading-tight">Go to Content page and start generating AI-powered posts. The AI learns from your accepted content.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 flex-1">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Target className="w-3 h-3 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white mb-0.5">5. Schedule Posts</div>
                    <p className="text-xs text-slate-400 leading-tight">Schedule or edit your generated content and automate your social media marketing.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Form Fields */}
          <div className="lg:col-span-1" style={{ height: '503px' }}>
            <div className="glass rounded-xl p-3 h-full flex flex-col">
              <div className="flex-1 space-y-2.5 overflow-y-auto">
          {/* API Key */}
          <div>
                <div className="flex items-center space-x-1.5 mb-1">
                  <Key className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <label className="text-xs font-medium text-slate-200">
                {t('geminiApiKey')}
              </label>
            </div>
            <input
              type="password"
              value={formData.geminiApiKey}
              onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
              placeholder="AIza..."
                  className="w-full px-3 py-1.5 text-xs glass rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-slate-400"
            />
                <p className="mt-1 text-xs text-slate-400 leading-tight">
                  Required for AI. Get key at{' '}
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

              {/* Business Name */}
          <div>
                <div className="flex items-center space-x-1.5 mb-1">
                  <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <label className="text-xs font-medium text-slate-200">
                {t('businessName')}
              </label>
            </div>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder={t('businessName')}
                  className="w-full px-3 py-1.5 text-xs glass rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-slate-400"
            />
          </div>

              {/* Business Type */}
          <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">
              {t('businessType')}
            </label>
            <input
              type="text"
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  placeholder="E.g., E-commerce, Consulting, SaaS..."
                  className="w-full px-3 py-1.5 text-xs glass rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-slate-400"
            />
          </div>

          {/* Target Audience */}
          <div>
                <div className="flex items-center space-x-1.5 mb-1">
                  <Target className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <label className="text-xs font-medium text-slate-200">
                {t('targetAudience')}
              </label>
            </div>
            <textarea
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              placeholder="E.g., Small business owners, Tech enthusiasts..."
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs glass rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white placeholder:text-slate-400 leading-snug"
            />
                <p className="mt-1 text-xs text-slate-400 leading-tight">
                  Describe your ideal customers
            </p>
          </div>
              </div>
              {/* Save Button */}
              <div className="pt-2 border-t border-slate-700/50 flex-shrink-0 mt-auto">
                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center space-x-1.5 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('saveSettings')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Account Connections */}
          <div className="lg:col-span-1" style={{ height: '503px' }}>
            <div className="glass rounded-xl p-3 border border-slate-700/50 h-full flex flex-col">
              <h3 className="text-base font-semibold text-white mb-3 flex-shrink-0">Account Connections</h3>
              
              <div className="flex-1 space-y-2 overflow-y-auto min-h-0">
                {(['facebook', 'instagram', 'linkedin', 'twitter'] as const).map((platform) => {
                  const socialAccounts = settings.socialAccounts || []
                  const adAccounts = settings.adAccounts || []
                  const socialAccount = socialAccounts.find((acc) => acc.platform === platform && acc.connected)
                  const adAccount = adAccounts.find((acc) => acc.platform === platform && acc.connected)
                  const Icon = platformIcons[platform]
                  
                  return (
                    <div key={platform} className="p-2 glass border border-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white">{platformNames[platform]}</p>
                        </div>
                        
                        {/* Social Account */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {socialAccount ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                              <button
                                onClick={() => handleSocialDisconnect(platform)}
                                className="px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              >
                                Disconnect
                              </button>
                            </>
                          ) : (
                            <>
                              {(platform === 'instagram' || platform === 'facebook' || platform === 'twitter') && (
                                <button
                                  onClick={() => setShowManualToken(showManualToken === platform ? null : platform)}
                                  className="px-1.5 py-0.5 text-xs glass hover:bg-slate-700/50 rounded transition-colors text-slate-300"
                                >
                                  {showManualToken === platform ? 'Cancel' : 'Token'}
                                </button>
                              )}
                              <button
                                onClick={() => handleSocialConnect(platform)}
                                disabled={isConnecting === platform}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                {isConnecting === platform ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : null}
                                <span>Social</span>
                              </button>
                            </>
                          )}
                        </div>


                        {/* Ad Account */}
                        <div className="flex items-center gap-1">
                          {adAccount ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                              <button
                                onClick={() => handleAdDisconnect(platform)}
                                className="px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              >
                                Disconnect
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setShowAdManual(showAdManual === platform ? null : platform)}
                              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                            >
                              Ads
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Ad Token Form */}
                      {showAdManual === platform && !adAccount && (
                        <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-col gap-2">
                          <input
                            type="password"
                            value={adAccessToken}
                            onChange={(e) => setAdAccessToken(e.target.value)}
                            placeholder="Access token..."
                            className="w-full px-2 py-1 text-xs glass rounded focus:ring-1 focus:ring-blue-500 text-white placeholder:text-slate-400"
                          />
                          {platform === 'twitter' && (
                            <input
                              type="password"
                              value={adAccessTokenSecret}
                              onChange={(e) => setAdAccessTokenSecret(e.target.value)}
                              placeholder="Token secret..."
                              className="w-full px-2 py-1 text-xs glass rounded focus:ring-1 focus:ring-blue-500 text-white placeholder:text-slate-400"
                            />
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAdConnect(platform)}
                              disabled={adConnecting === platform || !adAccessToken.trim()}
                              className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {adConnecting === platform ? (
                                <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                              ) : (
                                'Connect'
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setShowAdManual(null)
                                setAdAccessToken('')
                                setAdAccessTokenSecret('')
                              }}
                              className="px-2 py-1 text-xs glass text-slate-300 rounded hover:bg-slate-700/50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

          {/* Auto-scanning info */}
              <div className="mt-auto pt-3 border-t border-slate-700/50 flex-shrink-0">
          <div className="glass border border-blue-500/30 rounded-lg p-4 bg-blue-500/10">
            <h4 className="text-sm font-medium text-blue-300 mb-2">✨ Automatic Scanning</h4>
            <p className="text-xs text-blue-200 mb-2">
                    The app automatically scans your connected social media accounts to extract posts, analyze style, collect images, and learn patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>

        {/* History - AI Learning History */}
        {/* Always show history section - will display empty state if no data exists */}
        {true && (
          <div className="glass rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">AI Learning History</h3>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear ALL learning data? This will reset the AI\'s learned preferences and cannot be undone.')) {
                    const { updateSettings } = useStore.getState()
                    updateSettings({
                      contentPreferences: {
                        acceptedContent: [],
                        edits: [],
                        scannedPosts: [],
                        learnedStyle: {},
                      },
                    })
                    toast.success('All learning data cleared. AI will start learning from scratch.')
                  }
                }}
                className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors px-2 py-1 border border-red-500/30 rounded hover:bg-red-500/10"
                title="Clear all learning data"
              >
              Clear All
              </button>
            </div>
            
          {/* Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-700/50 pb-2">
            <div className="flex flex-wrap gap-2">
              {(['overview', 'accepted', 'edits', 'scanned'] as const).map((tab) => {
                const counts = {
                  overview: 0,
                  accepted: settings.contentPreferences?.acceptedContent?.length || 0,
                  edits: settings.contentPreferences?.edits?.length || 0,
                  scanned: settings.contentPreferences?.scannedPosts?.length || 0,
                }
                const labels = {
                  overview: 'Overview',
                  accepted: 'Accepted',
                  edits: 'Edits',
                  scanned: 'Scanned',
                }
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveHistoryTab(tab)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      activeHistoryTab === tab
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {labels[tab]} {counts[tab] > 0 && `(${counts[tab]})`}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setActiveHistoryTab('storage')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeHistoryTab === 'storage'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Storage
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px] max-h-[500px] overflow-y-auto">
              {/* Overview Tab */}
              {activeHistoryTab === 'overview' && (
                <div className="space-y-4">
                  {/* Learning Summary - Compact */}
                  <div className="p-3 glass rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="flex items-center space-x-2 mb-3">
                      <Brain className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-semibold text-white">Current Learned Preferences</h4>
              </div>
                    {settings.contentPreferences?.learnedStyle && Object.keys(settings.contentPreferences.learnedStyle).length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                    {settings.contentPreferences.learnedStyle.tone && settings.contentPreferences.learnedStyle.tone.length > 0 && (
                          <div className="text-slate-300">
                            <span className="text-slate-400">Tone:</span> {settings.contentPreferences.learnedStyle.tone.slice(0, 3).join(', ')}
                          </div>
                    )}
                    {settings.contentPreferences.learnedStyle.length && (
                          <div className="text-slate-300">
                            <span className="text-slate-400">Length:</span> {settings.contentPreferences.learnedStyle.length}
                          </div>
                    )}
                    {settings.contentPreferences.learnedStyle.hashtagUsage && (
                          <div className="text-slate-300">
                            <span className="text-slate-400">Hashtags:</span> {settings.contentPreferences.learnedStyle.hashtagUsage}
                          </div>
                    )}
                    {settings.contentPreferences.learnedStyle.emojiUsage && (
                          <div className="text-slate-300">
                            <span className="text-slate-400">Emojis:</span> {settings.contentPreferences.learnedStyle.emojiUsage}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No preferences learned yet. Start using the app to build your AI's understanding.</p>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="glass rounded p-2 border border-green-500/30 text-center">
                      <div className="text-lg font-bold text-green-400">{settings.contentPreferences?.acceptedContent?.length || 0}</div>
                      <div className="text-[10px] text-slate-300 mt-0.5">Accepted</div>
                </div>
                    <div className="glass rounded p-2 border border-purple-500/30 text-center">
                      <div className="text-lg font-bold text-purple-400">{settings.contentPreferences?.edits?.length || 0}</div>
                      <div className="text-[10px] text-slate-300 mt-0.5">Edits</div>
                    </div>
                    <div className="glass rounded p-2 border border-blue-500/30 text-center">
                      <div className="text-lg font-bold text-blue-400">{settings.contentPreferences?.scannedPosts?.length || 0}</div>
                      <div className="text-[10px] text-slate-300 mt-0.5">Scanned</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Accepted Content Tab */}
              {activeHistoryTab === 'accepted' && (
                settings.contentPreferences?.acceptedContent && settings.contentPreferences.acceptedContent.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-white flex items-center space-x-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        <span>Accepted Content ({settings.contentPreferences.acceptedContent.length})</span>
                      </h4>
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
                        className="text-[10px] text-red-400 hover:text-red-300 font-medium transition-colors px-2 py-1 border border-red-500/30 rounded hover:bg-red-500/10"
                        >
                        Clear
                        </button>
                      </div>
                    <div className="space-y-2 max-h-[450px] overflow-y-auto">
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
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    <p className="text-xs">No accepted content yet. Accept generated content to see it here.</p>
                  </div>
                )
              )}

              {/* Edits Tab */}
              {activeHistoryTab === 'edits' && (
                settings.contentPreferences?.edits && settings.contentPreferences.edits.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-white flex items-center space-x-2">
                        <Eye className="w-3.5 h-3.5 text-purple-400" />
                        <span>Recent Edits ({settings.contentPreferences.edits.length})</span>
                      </h4>
                        <button
                          onClick={() => {
                            const { updateSettings } = useStore.getState()
                          const currentSettings = useStore.getState().settings
                            updateSettings({
                              contentPreferences: {
                              ...(currentSettings.contentPreferences || {}),
                              acceptedContent: currentSettings.contentPreferences?.acceptedContent || [],
                                edits: [],
                              },
                            })
                            toast.success('Edit history cleared')
                          }}
                        className="text-[10px] text-red-400 hover:text-red-300 font-medium transition-colors px-2 py-1 border border-red-500/30 rounded hover:bg-red-500/10"
                          title="Clear edit history"
                        >
                        Clear
                        </button>
                    </div>
                    <div className="space-y-2 max-h-[450px] overflow-y-auto">
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
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Eye className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    <p className="text-xs">No edits yet. Edit content to see your changes here.</p>
                  </div>
                )
              )}

              {/* Scanned Posts Tab */}
              {activeHistoryTab === 'scanned' && (
                settings.contentPreferences?.scannedPosts && settings.contentPreferences.scannedPosts.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-white flex items-center space-x-2">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                        <span>Scanned Posts ({settings.contentPreferences.scannedPosts.length})</span>
                      </h4>
                      <button
                        onClick={() => {
                          const { updateSettings } = useStore.getState()
                          updateSettings({
                            contentPreferences: {
                              ...settings.contentPreferences,
                              acceptedContent: settings.contentPreferences?.acceptedContent || [],
                              scannedPosts: [],
                            },
                          })
                          toast.success('Scanned posts history cleared. Style patterns learned from them are preserved in learned preferences.')
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 font-medium transition-colors px-2 py-1 border border-red-500/30 rounded hover:bg-red-500/10"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[450px] overflow-y-auto">
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
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    <p className="text-xs">No scanned posts yet. Connect your social media accounts and they will be scanned automatically.</p>
                  </div>
                )
              )}

              {/* Storage Tab */}
              {activeHistoryTab === 'storage' && (
                storageInfo ? (
                  <div className="space-y-2.5">
                    {(() => {
                      const localStorageLimitMB = storageQuota?.localStorageLimitMB || storageInfo?.localStorageLimitMB || 5
                      const usagePercentage = storageInfo 
                        ? (storageInfo.totalSizeMB / localStorageLimitMB) * 100
                        : 0
                      const availableMB = storageQuota?.availableMB ?? (localStorageLimitMB - storageInfo.totalSizeMB)
                      
                      return (
                        <>
                          {/* Two Column Layout - Swapped */}
                          <div className="grid grid-cols-2 gap-3 items-stretch">
                            {/* Storage Details Card - Now on Left */}
                            <div className="glass rounded-lg p-3 border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/30 flex flex-col h-full">
                              <h5 className="text-xs font-semibold text-white mb-2.5 flex items-center space-x-1.5">
                                <div className="p-1 rounded bg-purple-500/20 border border-purple-500/30">
                                  <Database className="w-2.5 h-2.5 text-purple-400" />
                                </div>
                                <span>Storage Details</span>
                              </h5>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-800/30 border border-slate-700/30">
                                  <span className="text-slate-400">Browser</span>
                                  <span className="text-white font-medium">{storageInfo?.browser || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-800/30 border border-slate-700/30">
                                  <span className="text-slate-400">Storage Location</span>
                                  <span className="text-white font-medium text-right max-w-[65%]">localStorage (browser storage, not cache)</span>
                                </div>
                                <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-800/30 border border-slate-700/30">
                                  <span className="text-slate-400">localStorage Limit</span>
                                  <span className="text-white font-medium text-right max-w-[60%]">
                                    {storageQuota 
                                      ? `${storageQuota.localStorageLimitMB.toFixed(1)} MB ${
                                          storageQuota.method?.includes('tested') 
                                            ? '(tested)' 
                                            : storageQuota.method?.includes('estimated')
                                              ? '(estimated)'
                                              : ''
                                        }` 
                                      : storageInfo?.localStorageLimitMB 
                                        ? `${storageInfo.localStorageLimitMB} MB (estimated)`
                                        : '5-10 MB'
                                    }
                                  </span>
                                </div>
                                {storageQuota && storageQuota.totalQuotaMB > 1000 && (
                                  <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-800/30 border border-slate-700/30">
                                    <span className="text-slate-400">Total Quota</span>
                                    <span className="text-white font-medium">
                                      {storageQuota.totalQuotaMB.toFixed(0)} MB
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="pt-2 mt-auto border-t border-slate-700/30 text-xs text-slate-400 leading-relaxed">
                                <strong className="text-slate-300 font-medium">Note:</strong> Data is stored locally in your browser (localStorage). 
                                {storageQuota?.totalQuotaMB && storageQuota.totalQuotaMB > 1000 && (
                                  <> Your browser has {storageQuota.totalQuotaMB.toFixed(0)} MB total storage available, but this app uses localStorage which has its own ~{storageQuota.localStorageLimitMB.toFixed(1)} MB limit per origin.</>
                                )}
                                {!storageQuota?.totalQuotaMB || storageQuota.totalQuotaMB <= 1000 ? (
                                  <> Data is not synced across devices.</>
                                ) : null}
                              </div>
                            </div>

                            {/* Main Storage Card - Combined Stats & Progress - Now on Right */}
                            <div className="glass rounded-lg p-3 border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/30">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                                  </div>
                                  <h4 className="text-sm font-semibold text-white">Storage Usage</h4>
                                </div>
                                <button
                                  onClick={async () => {
                                    const info = getStorageUsage()
                                    setStorageInfo(info)
                                    try {
                                      const quota = await getStorageQuota()
                                      if (quota) {
                                        setStorageQuota(quota)
                                      }
                                    } catch (err) {
                                      console.error('Error refreshing quota:', err)
                                    }
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors text-cyan-400 hover:text-cyan-300 border border-slate-700/50"
                                  title="Refresh"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Stats Row */}
                              <div className="grid grid-cols-2 gap-2 mb-3 p-2 rounded-lg bg-slate-800/30 border border-slate-700/30">
                                <div>
                                  <div className="text-[10px] text-slate-400 mb-0.5">Used</div>
                                  <div className="text-sm font-bold text-blue-400">
                                    {storageInfo.totalSizeMB.toFixed(2)} <span className="text-xs text-blue-300">MB</span>
                                  </div>
                                  <div className="text-[9px] text-slate-500 mt-0.5">
                                    {(storageInfo.totalSize / 1024).toFixed(0)} KB
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] text-slate-400 mb-0.5">Available</div>
                                  <div className={`text-sm font-bold ${
                                    availableMB < 1 ? 'text-red-400' : 
                                    availableMB < 2 ? 'text-yellow-400' : 
                                    'text-green-400'
                                  }`}>
                                    {availableMB.toFixed(2)} <span className={`text-xs ${
                                      availableMB < 1 ? 'text-red-300' : 
                                      availableMB < 2 ? 'text-yellow-300' : 
                                      'text-green-300'
                                    }`}>MB</span>
                                  </div>
                                  <div className={`text-[9px] mt-0.5 ${
                                    availableMB < 1 ? 'text-red-400/70' : 
                                    availableMB < 2 ? 'text-yellow-400/70' : 
                                    'text-green-400/70'
                                  }`}>
                                    {((availableMB / localStorageLimitMB) * 100).toFixed(0)}% of limit
                                  </div>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="mb-2">
                                <div className="flex items-center justify-between mb-1.5 text-xs">
                                  <span className="text-slate-400 font-medium">localStorage Usage</span>
                                  <span className={`font-bold ${
                                    usagePercentage > 80 ? 'text-red-400' : 
                                    usagePercentage > 50 ? 'text-yellow-400' : 
                                    'text-green-400'
                                  }`}>
                                    {usagePercentage.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="relative w-full h-2 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/30">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      usagePercentage > 80 
                                        ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                        : usagePercentage > 50
                                          ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                                          : 'bg-gradient-to-r from-green-500 to-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Limit Info */}
                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-700/30 mb-3">
                                <span>
                                  {storageQuota 
                                    ? `${storageQuota.localStorageLimitMB.toFixed(1)} MB ${
                                        storageQuota.method?.includes('tested') 
                                          ? '(tested)' 
                                          : storageQuota.method?.includes('estimated')
                                            ? '(estimated)'
                                            : ''
                                      }`
                                    : `${localStorageLimitMB} MB (estimated)`
                                  }
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Database className="w-3 h-3" />
                                  <span>{storageInfo?.browser || 'Unknown'}</span>
                                </span>
                              </div>

                              {/* Export/Import Buttons */}
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/30">
                                <button
                                  onClick={() => {
                                    try {
                                      exportData()
                                      toast.success('Data exported successfully!', {
                                        icon: '✅',
                                        duration: 3000,
                                      })
                                    } catch (error: any) {
                                      console.error('Export error:', error)
                                      toast.error(`Failed to export data: ${error.message}`, {
                                        duration: 5000,
                                      })
                                    }
                                  }}
                                  className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 transition-all text-blue-400 hover:text-blue-300 text-xs font-medium"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Export Data</span>
                                </button>
                                <label className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 hover:border-green-500/50 transition-all text-green-400 hover:text-green-300 text-xs font-medium cursor-pointer">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Import Data</span>
                                  <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return

                                      // Confirm before importing (destructive operation)
                                      if (!window.confirm(
                                        '⚠️ WARNING: Importing will replace all existing data (posts, leads, campaigns, etc.).\n\n' +
                                        'This action cannot be undone. Make sure you have a backup!\n\n' +
                                        'Do you want to continue?'
                                      )) {
                                        e.target.value = ''
                                        return
                                      }

                                      try {
                                        await importData(file)
                                        toast.success('Data imported successfully!', {
                                          icon: '✅',
                                          duration: 3000,
                                        })
                                        // Refresh storage info after import
                                        const info = getStorageUsage()
                                        setStorageInfo(info)
                                        try {
                                          const quota = await getStorageQuota()
                                          if (quota) {
                                            setStorageQuota(quota)
                                          }
                                        } catch (err) {
                                          console.error('Error refreshing quota:', err)
                                        }
                                      } catch (error: any) {
                                        console.error('Import error:', error)
                                        toast.error(`Failed to import data: ${error.message}`, {
                                          duration: 5000,
                                        })
                                      } finally {
                                        // Reset file input
                                        e.target.value = ''
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Warning Message if needed - Full Width */}
                          {usagePercentage > 80 || storageInfo?.totalSizeMB > localStorageLimitMB * 0.8 ? (
                            <div className="p-2.5 rounded-lg border border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-600/5">
                              <div className="flex items-start space-x-2">
                                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-red-300 mb-0.5">Storage Almost Full</p>
                                  <p className="text-[10px] text-red-200/80 leading-tight">
                                    {usagePercentage.toFixed(0)}% used ({storageInfo?.totalSizeMB.toFixed(2) || 0} MB / {localStorageLimitMB.toFixed(1)} MB). 
                                    Consider clearing old data.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : usagePercentage > 50 || storageInfo?.totalSizeMB > localStorageLimitMB * 0.5 ? (
                            <div className="p-2.5 rounded-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
                              <div className="flex items-start space-x-2">
                                <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-yellow-300 mb-0.5">Storage Getting Full</p>
                                  <p className="text-[10px] text-yellow-200/80 leading-tight">
                                    {usagePercentage.toFixed(0)}% used. {availableMB.toFixed(1)} MB remaining.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <HardDrive className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    <p className="text-xs">Loading storage information...</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Instagram Token Connection Modal */}
        {showManualToken === 'instagram' && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" 
            onClick={() => {
              setShowManualToken(null)
              setManualAccessToken('')
              setManualUserId('')
            }}
          >
            <div 
              className="glass rounded-xl border-2 border-purple-500/30 max-w-md w-full shadow-glow-lg max-h-[90vh] flex flex-col overflow-hidden" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Fixed */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <Instagram className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Connect Instagram with Token</h2>
                </div>
                <button
                  onClick={() => {
                    setShowManualToken(null)
                    setManualAccessToken('')
                    setManualUserId('')
                  }}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Instagram Access Token <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={manualAccessToken}
                    onChange={(e) => setManualAccessToken(e.target.value)}
                    placeholder="Enter your Instagram access token (required)"
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder:text-slate-500 outline-none transition-all"
                    autoFocus
                  />
                  {!manualAccessToken.trim() && (
                    <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                      <span>⚠</span>
                      <span>Access Token is required to connect</span>
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
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
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Instagram Business Account ID <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualUserId}
                      onChange={(e) => setManualUserId(e.target.value)}
                      placeholder="Will be auto-detected if not provided"
                      className="flex-1 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder:text-slate-500 outline-none transition-all"
                    />
                    <button
                      onClick={handleValidateAndDetectId}
                      disabled={(!manualAccessToken.trim() && !manualUserId.trim()) || isValidatingToken}
                      className={`px-4 py-2.5 rounded-lg transition-all font-medium flex items-center justify-center gap-2 border whitespace-nowrap ${
                        (!manualAccessToken.trim() && !manualUserId.trim()) || isValidatingToken
                          ? 'bg-slate-700/30 text-slate-400 border-slate-700 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500 hover:border-purple-400 cursor-pointer'
                      }`}
                      title={
                        !manualAccessToken.trim() && !manualUserId.trim()
                          ? "Please enter either an Access Token or Business Account ID first"
                          : manualUserId.trim() && !manualAccessToken.trim()
                          ? "Click to get Access Token via OAuth"
                          : "Validate token and auto-detect Instagram Business Account ID"
                      }
                    >
                      {isValidatingToken ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Validating...</span>
                        </>
                      ) : manualUserId.trim() && !manualAccessToken.trim() ? (
                        <>
                          <Key className="w-4 h-4" />
                          <span className="hidden sm:inline">Get Token</span>
                        </>
                      ) : manualAccessToken.trim() ? (
                        <>
                          <Search className="w-4 h-4" />
                          <span className="hidden sm:inline">Auto-detect ID</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span className="hidden sm:inline">Auto-detect</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Enter your Access Token and click "Auto-detect ID" to find your Business Account ID, OR enter your Business Account ID first and click "Get Token" to authenticate via OAuth.
                  </p>
                </div>
              </div>

              {/* Footer with Buttons - Fixed */}
              <div className="p-6 border-t border-slate-700/50 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => handleManualTokenConnect('instagram')}
                  disabled={isConnecting === 'instagram' || !manualAccessToken.trim()}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-all font-medium flex items-center justify-center gap-2 shadow-lg ${
                    isConnecting === 'instagram' || !manualAccessToken.trim()
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                  }`}
                >
                  {isConnecting === 'instagram' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Connect with Token</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowManualToken(null)
                    setManualAccessToken('')
                    setManualUserId('')
                  }}
                  className="px-4 py-2.5 bg-slate-800/80 border border-slate-700 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Facebook Token Connection Modal */}
        {showManualToken === 'facebook' && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" 
            onClick={() => {
              setShowManualToken(null)
              setManualAccessToken('')
              setManualUserId('')
            }}
          >
            <div 
              className="glass rounded-xl border-2 border-blue-500/30 max-w-md w-full shadow-glow-lg max-h-[90vh] flex flex-col overflow-hidden" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Fixed */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
                    <Facebook className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Connect Facebook with Token</h2>
                </div>
                <button
                  onClick={() => {
                    setShowManualToken(null)
                    setManualAccessToken('')
                    setManualUserId('')
                  }}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Facebook Access Token <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={manualAccessToken}
                    onChange={(e) => setManualAccessToken(e.target.value)}
                    placeholder="Enter your Facebook access token (required)"
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder:text-slate-500 outline-none transition-all"
                    autoFocus
                  />
                  {!manualAccessToken.trim() && (
                    <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                      <span>⚠</span>
                      <span>Access Token is required to connect</span>
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
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
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Facebook User ID <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={manualUserId}
                    onChange={(e) => setManualUserId(e.target.value)}
                    placeholder="Will be auto-detected if not provided"
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder:text-slate-500 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Your Facebook User ID. We'll automatically detect it from your token if not provided. You can also connect via OAuth using the "Social" button above.
                  </p>
                </div>
              </div>

              {/* Footer with Buttons - Fixed */}
              <div className="p-6 border-t border-slate-700/50 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => handleManualTokenConnect('facebook')}
                  disabled={isConnecting === 'facebook' || !manualAccessToken.trim()}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-all font-medium flex items-center justify-center gap-2 shadow-lg ${
                    isConnecting === 'facebook' || !manualAccessToken.trim()
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                  }`}
                >
                  {isConnecting === 'facebook' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Connect with Token</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowManualToken(null)
                    setManualAccessToken('')
                    setManualUserId('')
                  }}
                  className="px-4 py-2.5 bg-slate-800/80 border border-slate-700 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Twitter Token Connection Modal */}
        {showManualToken === 'twitter' && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" 
            onClick={() => {
              setShowManualToken(null)
              setManualAccessToken('')
              setManualUserId('')
            }}
          >
            <div 
              className="glass rounded-xl border-2 border-blue-500/30 max-w-md w-full shadow-glow-lg max-h-[90vh] flex flex-col overflow-hidden" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Fixed */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
                    <Twitter className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Connect Twitter/X with Token</h2>
                </div>
                <button
                  onClick={() => {
                    setShowManualToken(null)
                    setManualAccessToken('')
                    setManualUserId('')
                  }}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Twitter/X Access Token <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={manualAccessToken}
                    onChange={(e) => setManualAccessToken(e.target.value)}
                    placeholder="Enter your Twitter/X access token (required)"
                    className="w-full px-3 py-2 glass rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder:text-slate-400"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Enter a valid Twitter/X OAuth 2.0 access token with tweet.read and tweet.write permissions.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Twitter/X User ID <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={manualUserId}
                    onChange={(e) => setManualUserId(e.target.value)}
                    placeholder="Enter your Twitter/X User ID (auto-detected if not provided)"
                    className="w-full px-3 py-2 glass rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder:text-slate-400"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Your Twitter User ID will be auto-detected from the token if not provided.
                  </p>
                </div>

                <div className="p-3 glass border border-blue-500/30 rounded-lg bg-blue-500/10">
                  <p className="text-xs text-blue-200">
                    <strong className="text-blue-300">How to get a Twitter/X token:</strong>
                  </p>
                  <ol className="mt-2 space-y-1 text-xs text-blue-200/90 list-decimal list-inside">
                    <li>Go to <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-100">Twitter Developer Portal</a></li>
                    <li>Create a new app or use an existing one</li>
                    <li>Enable OAuth 2.0 in app settings</li>
                    <li>Generate an access token with tweet.read and tweet.write scopes</li>
                    <li>Copy the token and paste it here</li>
                  </ol>
                </div>

                <div className="p-3 glass border border-amber-500/30 rounded-lg bg-amber-500/10">
                  <p className="text-xs text-amber-200">
                    <strong className="text-amber-300">Note:</strong> The token will be validated before connecting. Make sure it has the necessary permissions for reading and creating posts.
                  </p>
                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700/50 flex-shrink-0">
                <button
                  onClick={handleValidateAndDetectId}
                  disabled={isValidatingToken || !manualAccessToken.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium flex items-center gap-2"
                >
                  {isValidatingToken ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Validate Token
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleManualTokenConnect('twitter')}
                  disabled={isConnecting === 'twitter' || !manualAccessToken.trim()}
                  className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium flex items-center gap-2"
                >
                  {isConnecting === 'twitter' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowManualToken(null)
                    setManualAccessToken('')
                    setManualUserId('')
                  }}
                  className="px-4 py-2.5 bg-slate-800/80 border border-slate-700 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
