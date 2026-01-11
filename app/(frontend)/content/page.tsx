'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { Sparkles, Copy, Check, Loader2, Twitter, Linkedin, Facebook, Instagram, X, Search, CheckCircle, AlertCircle, RefreshCw, Edit2, Save, Video, ArrowDown, Zap, Trophy, Star, Upload } from 'lucide-react'
import { generateContent, generateMultipleVariations } from '@/lib/ai'
import { useStore } from '@/lib/store'
import { BrandImageLibrary } from '@/components/BrandImageLibrary'
import { autoScanAllPlatforms } from '@/lib/auto-scanner'
import { CreateAdDialog } from '@/components/CreateAdDialog'
import { PlatformPreview } from '@/components/PlatformPreview'
import { StyleAnalysis, generateStylePrompt } from '@/lib/content-analyzer'
import { analyzeContentPerformance, generatePerformancePrompt } from '@/lib/content-performance-analyzer'
import { generateLearningPrompt, trackAcceptedContent, trackContentEdit, containsInappropriateContent } from '@/lib/content-learner'
import { AdPlatform, AdAccount } from '@/lib/ad-platforms'
import { useLanguage } from '@/lib/language-context'
import toast from 'react-hot-toast'

interface MediaFile {
  file: File
  preview: string
  type: 'image' | 'video'
  width?: number
  height?: number
  size: number
  validated: boolean
  error?: string
  warnings?: string[]
}

export default function ContentPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { settings, addPost, updatePost, posts } = useStore()
  const [isMounted, setIsMounted] = useState(false)
  
  const [prompt, setPrompt] = useState('')
  const [contentType, setContentType] = useState<'post' | 'ad'>('post')
  const [platform, setPlatform] = useState<'twitter' | 'linkedin' | 'facebook' | 'instagram'>('twitter')
  const [adPlatform, setAdPlatform] = useState<AdPlatform>('twitter')
  
  // Ensure client-side only rendering
  useEffect(() => {
    setIsMounted(true)
    
    // Check if we're editing an existing post
    const editPostData = sessionStorage.getItem('editPost')
    if (editPostData) {
      try {
        const editPost = JSON.parse(editPostData)
        // Pre-fill the form with post data
        setEditingPostId(editPost.id)
        setGeneratedContent(editPost.content)
        setOriginalContent(editPost.content)
        setEditedContent(editPost.content)
        setPlatform(editPost.platform)
        setContentType('post')
        
        // Show indicator that we're editing
        if (editPost.status === 'scheduled') {
          toast.success(`Editing scheduled post. Scheduled time will be preserved.`, { duration: 6000 })
        }
        
        // Set a default prompt for learning purposes
        setPrompt('Editing existing post')
        
        // Set media if exists
        if (editPost.media) {
          if (editPost.media.file) {
            // Check if it's a base64 data URL or regular URL
            if (editPost.media.file.startsWith('data:') || editPost.media.file.startsWith('http')) {
              setSelectedBrandImage(editPost.media.file)
            }
          }
        }
        
        // Clear the sessionStorage
        sessionStorage.removeItem('editPost')
        
        toast.success('Post loaded for editing. Make your changes and save.', { duration: 6000 })
      } catch (error) {
        console.error('Error loading post for editing:', error)
      }
    }
  }, [])
  
  // Update ad platform when content type changes
  const handleContentTypeChange = (type: 'post' | 'ad') => {
    setContentType(type)
    if (type === 'ad' && adPlatform) {
      // Keep current ad platform
    } else if (type === 'post') {
      // Reset to default post platform
      setPlatform('twitter')
    }
    // Keep library hidden by default
  }
  
  // Don't auto-show brand library - keep it hidden by default
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [variations, setVariations] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState<string>('')
  const [originalContent, setOriginalContent] = useState<string>('')
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null)
  const [styleAnalyses, setStyleAnalyses] = useState<StyleAnalysis[]>([])
  const [selectedBrandImage, setSelectedBrandImage] = useState<string | null>(null)
  const [showBrandLibrary, setShowBrandLibrary] = useState(false)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const fullPreviewRef = useRef<HTMLDivElement>(null)
  
  // Handle scroll to show/hide scroll indicator
  useEffect(() => {
    if (!generatedContent) {
      setShowScrollIndicator(false)
      return
    }

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Show indicator if we're near the top and there's more content below
      const isNearTop = scrollY < windowHeight * 0.5
      const hasMoreContent = documentHeight > windowHeight + 100
      setShowScrollIndicator(isNearTop && hasMoreContent)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [generatedContent])
  
  // Scroll to full preview function
  const scrollToFullPreview = () => {
    if (fullPreviewRef.current) {
      fullPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
  const [showLibraryModal, setShowLibraryModal] = useState(false)
  const [showCreateAd, setShowCreateAd] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [showScanStatus, setShowScanStatus] = useState(true)
  const [hasScannedOnce, setHasScannedOnce] = useState(false)
  const scanInProgressRef = useRef(false)
  const toastShownRef = useRef(false)

  // Auto-scan connected accounts only on mount or when new accounts are connected
  useEffect(() => {
    // Prevent multiple simultaneous scans
    if (scanInProgressRef.current) return
    
    const scanAccounts = async () => {
      const adAccounts = settings.adAccounts || []
      const socialAccounts = settings.socialAccounts || []
      const connectedAdAccounts = adAccounts.filter(acc => acc.connected && acc.accessToken)
      const connectedSocialAccounts = socialAccounts.filter(acc => acc.connected && acc.accessToken)
      
      console.log('[Content Page] Scanning accounts:', {
        totalAdAccounts: adAccounts.length,
        totalSocialAccounts: socialAccounts.length,
        connectedAdAccounts: connectedAdAccounts.map(acc => ({ platform: acc.platform, hasToken: !!acc.accessToken, accountId: acc.accountId })),
        connectedSocialAccounts: connectedSocialAccounts.map(acc => ({ platform: acc.platform, hasToken: !!acc.accessToken, userId: acc.userId || 'MISSING' })),
      })
      
      // Debug: Check Twitter account specifically
      const twitterAccount = connectedSocialAccounts.find(acc => acc.platform === 'twitter')
      if (twitterAccount) {
        console.log('[Content Page] Twitter account found:', {
          platform: twitterAccount.platform,
          connected: twitterAccount.connected,
          hasAccessToken: !!twitterAccount.accessToken,
          hasUserId: !!twitterAccount.userId,
          userId: twitterAccount.userId || 'MISSING - THIS WILL CAUSE SCAN TO FAIL!',
        })
        if (!twitterAccount.userId || twitterAccount.userId === 'me') {
          console.error('[Content Page] ERROR: Twitter account missing userId!')
          console.error('[Content Page] The scanner will skip this account because userId is required.')
        }
      }
      
      if (connectedAdAccounts.length === 0 && connectedSocialAccounts.length === 0) {
        console.log('[Content Page] No connected accounts found, skipping scan')
        return
      }

      // Check if we should scan: platform-specific caching for Twitter (free tier optimization)
      const scanKey = JSON.stringify([connectedAdAccounts.map(a => a.accountId || ''), connectedSocialAccounts.map(a => a.userId || '')])
      const lastScanKey = sessionStorage.getItem('lastScanKey')
      
      // Check per-platform rate limits (especially important for Twitter free tier)
      // Free tier limits: 1 request per 15 minutes AND 100 posts per MONTH total (SHARED across all customers!)
      // Each scan fetches 5 tweets, so with 20 customers: 20 customers × 5 tweets = 100 posts/month
      // Each customer can scan once per month max (to stay within shared monthly limit)
      const hasTwitter = connectedSocialAccounts.some(acc => acc.platform === 'twitter')
      const lastTwitterScanTime = sessionStorage.getItem('lastTwitterScanTime')
      const twitterRateLimitMs = 15 * 60 * 1000 // 15 minutes minimum between requests
      const twitterCacheMs = 30 * 24 * 60 * 60 * 1000 // 30 days cache for Twitter (free tier: 100 posts/month shared = 1 scan/month per customer)
      
      // For Twitter: Check both rate limit (15 mins) and cache (30 days to stay within shared monthly limit)
      if (hasTwitter && lastTwitterScanTime) {
        const timeSinceLastTwitterScan = Date.now() - parseInt(lastTwitterScanTime)
        if (timeSinceLastTwitterScan < twitterRateLimitMs) {
          const minutesLeft = Math.ceil((twitterRateLimitMs - timeSinceLastTwitterScan) / 60000)
          console.log(`[Content Page] Twitter rate limit: Skipping scan (free tier allows 1 request per 15 minutes). Wait ${minutesLeft} more minute(s).`)
          toast(`Twitter: Rate limit active. Wait ${minutesLeft} minute(s) before next scan. Free tier: 100 posts/month shared across all customers.`, { duration: 5000, icon: '⏱️' })
          return
        }
        // If we have cached data from less than 30 days ago, use it instead of scanning (to stay within shared monthly limit)
        if (timeSinceLastTwitterScan < twitterCacheMs && lastScanKey === scanKey) {
          const daysAgo = Math.floor(timeSinceLastTwitterScan / (24 * 60 * 60 * 1000))
          console.log(`[Content Page] Using cached Twitter data (scanned ${daysAgo} day(s) ago). Free tier: 100 posts/month shared = 1 scan/month per customer max.`)
          return
        }
      }
      
      // For other platforms: standard 1 hour cache
      const shouldScan = !lastScanKey || 
                        lastScanKey !== scanKey ||
                        !lastScanned || 
                        (Date.now() - new Date(lastScanned).getTime()) > 3600000 // 1 hour for other platforms
      
      if (!shouldScan && !hasTwitter) {
        return // Skip scanning if not needed (only applies to non-Twitter platforms)
      }

      scanInProgressRef.current = true
      setIsScanning(true)
      setHasScannedOnce(true)
      sessionStorage.setItem('lastScanKey', scanKey)
      try {
        const result = await autoScanAllPlatforms(connectedAdAccounts as AdAccount[], connectedSocialAccounts)
        
        // Update style analyses
        if (result.styleAnalyses.length > 0) {
          setStyleAnalyses(result.styleAnalyses)
        }

        // Save scanned posts with style analyses to store (with AI analysis if available)
        if (result.content.length > 0) {
          const { updateSettings } = useStore.getState()
          
          // First, do rule-based analysis (already done in auto-scanner)
          let scannedPosts: Array<{
            id: string
            platform: string
            content: string
            images?: string[]
            createdAt: string
            styleAnalysis: any
            engagement?: any
            aiPreferences?: Partial<any>
            aiInsights?: string[]
          }> = result.content
            .filter(item => item.styleAnalysis) // Only posts with style analysis
            .map(item => ({
              id: item.id,
              platform: item.platform,
              content: item.content,
              images: item.images, // Include images from scanned content
              createdAt: item.createdAt,
              styleAnalysis: item.styleAnalysis!,
              engagement: item.engagement,
            }))
          
          // Add AI analysis for scanned posts if API key is available (AI analysis for all sources!)
          if (settings.geminiApiKey && scannedPosts.length > 0) {
            console.log('[Content Page] Adding AI analysis for scanned posts...')
            const { analyzeContentWithAI } = await import('@/lib/content-learner')
            
            // Save original posts for fallback
            const originalScannedPosts = [...scannedPosts]
            
            // Analyze each scanned post with AI (batch process, don't await all to avoid blocking)
            const aiAnalysisPromises = scannedPosts.map(async (post) => {
              try {
                const aiAnalysis = await analyzeContentWithAI(
                  post.content,
                  'post', // All scanned posts are posts
                  post.platform,
                  settings.geminiApiKey
                )
                return {
                  ...post,
                  aiPreferences: aiAnalysis.preferences && Object.keys(aiAnalysis.preferences).length > 0 
                    ? aiAnalysis.preferences 
                    : undefined,
                  aiInsights: aiAnalysis.insights && aiAnalysis.insights.length > 0 
                    ? aiAnalysis.insights 
                    : undefined,
                }
              } catch (error: any) {
                console.error(`[Content Page] AI analysis failed for post ${post.id}:`, error.message)
                // Continue with rule-based analysis only if AI fails
                return post
              }
            })
            
            // Wait for all AI analyses to complete (but don't block if some fail)
            scannedPosts = await Promise.allSettled(aiAnalysisPromises).then(results =>
              results.map((result, idx) => {
                if (result.status === 'fulfilled') {
                  return result.value
                } else {
                  // If AI analysis failed, keep the original post with rule-based analysis only
                  console.error(`[Content Page] AI analysis failed for post:`, result.reason)
                  return originalScannedPosts[idx] // Return original post
                }
              })
            )
            
            console.log(`[Content Page] AI analysis completed for ${scannedPosts.filter((p: any) => p.aiPreferences).length} scanned posts`)
          }
          
          // Merge with existing scanned posts, keep unique by ID, newest first
          const existingScannedPosts = settings.contentPreferences?.scannedPosts || []
          const allScannedPosts = [...scannedPosts, ...existingScannedPosts]
          const uniqueScannedPosts = allScannedPosts.filter((post, idx, self) =>
            idx === self.findIndex(p => p.id === post.id && p.platform === post.platform)
          )
          
          // Sort by date (newest first) and keep last 35 (optimized for free-tier APIs, 100 learning inputs total)
          // Free-tier Twitter: 100 posts/month shared, 30-day cache per customer = ~5 tweets/month per customer (20 customers max)
          // Remove images from older posts (keep images only for newest 14) to save storage space
          const sortedScannedPosts = uniqueScannedPosts
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 35)
            .map((post, idx) => idx < 14 ? post : { ...post, images: undefined })
          
          // IMPORTANT: Learn from scanned posts! This is the PRIMARY source for new users
          // AI analysis is now included if available, providing deeper insights than rule-based only
          const { combineAllLearningSources } = await import('@/lib/content-learner')
          const existingPreferences = settings.contentPreferences || {
            acceptedContent: [],
            edits: [],
            scannedPosts: [],
          }
          
          // Combine all learning sources: scanned posts (highest priority), accepted content, and edits
          // All sources now use AI analysis if API key is available!
          const learnedStyle = combineAllLearningSources(
            sortedScannedPosts,
            existingPreferences.acceptedContent,
            existingPreferences.edits
          )
          
          console.log('[Content Page] Learned style from scanned posts:', learnedStyle)
          console.log('[Content Page] Scanned posts count:', sortedScannedPosts.length)
          
          updateSettings({
            contentPreferences: {
              ...existingPreferences,
              scannedPosts: sortedScannedPosts,
              learnedStyle, // Update learned style from scanned posts!
            },
          })
          
        }

        // Update brand images - sort by date and keep most recent
        if (result.images.length > 0) {
          const { updateSettings } = useStore.getState()
          const existingImages = settings.brandImages || []
          
          // Normalize URLs by removing query parameters for better deduplication
          const normalizeUrl = (url: string) => {
            try {
              const urlObj = new URL(url)
              return `${urlObj.origin}${urlObj.pathname}`
            } catch {
              // If URL parsing fails, try simple string split
              return url.split('?')[0].split('#')[0]
            }
          }
          
          const newImages = result.images.map((img, idx) => ({
            id: `auto-${img.platform}-${img.sourceId}-${idx}`,
            url: img.url,
            sourceUrl: `${img.platform}://${img.sourceId}`,
            platform: img.platform,
            extractedAt: new Date().toISOString(),
          }))
          
          // Merge and deduplicate by normalized URL (remove query params)
          const allImages = [...existingImages, ...newImages]
          const seenUrls = new Set<string>()
          const uniqueImages = allImages.filter((img) => {
            const normalizedUrl = normalizeUrl(img.url)
            if (seenUrls.has(normalizedUrl)) {
              return false // Duplicate
            }
            seenUrls.add(normalizedUrl)
            return true
          })
          
          // Sort by date (newest first) and keep only most recent per platform
          const sortedImages = uniqueImages.sort((a, b) => {
            const dateA = new Date(a.extractedAt || 0).getTime()
            const dateB = new Date(b.extractedAt || 0).getTime()
            return dateB - dateA
          })
          
          // Group by platform and keep last 10 per platform (optimized for free-tier: ~150KB each = ~1.5MB max per platform)
          // Free-tier APIs: Limited scanning, fewer images extracted
          const platformGroups: Record<string, typeof sortedImages> = {}
          sortedImages.forEach(img => {
            if (!platformGroups[img.platform]) {
              platformGroups[img.platform] = []
            }
            if (platformGroups[img.platform].length < 10) {
              platformGroups[img.platform].push(img)
            }
          })
          
          // Flatten back to array and limit total to 20 images max (optimized: ~150KB each = ~3MB max total)
          // Fits within 5MB localStorage per customer
          const finalImages = Object.values(platformGroups).flat().slice(-20)
          
          updateSettings({ brandImages: finalImages })
        }

        setLastScanned(new Date().toISOString())
        
        // Track Twitter scan time separately for rate limiting
        if (connectedSocialAccounts.some(acc => acc.platform === 'twitter')) {
          sessionStorage.setItem('lastTwitterScanTime', Date.now().toString())
        }
        
        // Only show toast if we found NEW content (not on every scan)
        const existingScannedPosts = settings.contentPreferences?.scannedPosts || []
        const existingPostIds = new Set(existingScannedPosts.map(p => `${p.id}-${p.platform}`))
        const newPosts = result.content.filter(item => !existingPostIds.has(`${item.id}-${item.platform}`))
        
        // Only show toast for genuinely new posts, and only once per scan session
        if (newPosts.length > 0 && !toastShownRef.current) {
          toast.success(`Auto-scanned: ${newPosts.length} new posts found`, { duration: 3000 })
          toastShownRef.current = true
        }
      } catch (error: any) {
        console.error('Auto-scan error:', error)
        
        // Handle Twitter 401 Unauthorized errors (expired/invalid token)
        if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('expired') || error.message?.includes('invalid')) {
          const twitterAccount = connectedSocialAccounts.find(acc => acc.platform === 'twitter')
          if (twitterAccount) {
            toast.error(`Twitter token expired. Please disconnect and reconnect Twitter in Settings using the OAuth popup to refresh your token.`, { duration: 10000, icon: '🔑' })
            // Don't fail the entire scan - other platforms may have scanned successfully
            return
          }
        }
        
        // Handle Twitter rate limit errors gracefully
        if (error.isRateLimit || error.message?.includes('429') || error.message?.includes('Rate Limit') || error.message?.includes('rate limit')) {
          const twitterAccount = connectedSocialAccounts.find(acc => acc.platform === 'twitter')
          if (twitterAccount) {
            // Update rate limit timestamp to prevent immediate retry (wait 15 minutes minimum)
            sessionStorage.setItem('lastTwitterScanTime', Date.now().toString())
            const waitMinutes = error.waitMinutes || 15
            const existingPosts = settings.contentPreferences?.scannedPosts || []
            const twitterPosts = existingPosts.filter(p => p.platform === 'twitter')
            if (twitterPosts.length > 0) {
              toast(`Twitter rate limit reached. Using cached data (${twitterPosts.length} posts). Wait ${waitMinutes} minute(s) for next scan. Free tier: 100 posts/month shared across all customers.`, { duration: 7000, icon: '⏱️' })
            } else {
              toast(`Twitter rate limit reached. Wait ${waitMinutes} minute(s) before scanning again. Free tier: 100 posts/month shared across all customers.`, { duration: 7000, icon: '⚠️' })
            }
            // Don't fail the entire scan - other platforms may have scanned successfully
            return
          }
        }
        
        // Show error to user if scanning fails (for non-rate-limit errors)
        // Note: connectedAdAccounts and connectedSocialAccounts are already defined in the outer scope (line 164-165)
        const hasConnectedAccounts = connectedAdAccounts.length > 0 || connectedSocialAccounts.length > 0
        if (hasConnectedAccounts) {
          toast.error(`Scanning failed: ${error.message || 'Unknown error. Check browser console for details.'}`, { duration: 5000 })
        }
      } finally {
        setIsScanning(false)
        scanInProgressRef.current = false
        // Reset toast flag after a delay so it can show again for future scans
        setTimeout(() => {
          toastShownRef.current = false
        }, 10000)
      }
    }

    // Determine if we should trigger a scan
    const adAccounts = settings.adAccounts || []
    const socialAccounts = settings.socialAccounts || []
    const connectedAdAccounts = adAccounts.filter(acc => acc.connected && acc.accessToken)
    const connectedSocialAccounts = socialAccounts.filter(acc => acc.connected && acc.accessToken)
    
    if (connectedAdAccounts.length === 0 && connectedSocialAccounts.length === 0) {
      return // No accounts connected, skip scanning
    }
    
    const scanKey = JSON.stringify([connectedAdAccounts.map(a => a.accountId || ''), connectedSocialAccounts.map(a => a.userId || '')])
    const lastScanKey = sessionStorage.getItem('lastScanKey')
    const lastScanTime = sessionStorage.getItem('lastScanTime')
    const lastScanned = sessionStorage.getItem('lastScanned')
    
    // Platform-specific scan logic:
    // - Twitter: Check rate limit (15 mins) and cache (24 hours) - handled inside scanAccounts
    // - Other platforms: Standard 1 hour cache
    const hasTwitter = connectedSocialAccounts.some(acc => acc.platform === 'twitter')
    const timeSinceLastScan = lastScanTime ? Date.now() - parseInt(lastScanTime) : Infinity
    
    // Only scan if:
    // 1. First time (no scan key), OR
    // 2. Accounts changed (different scan key), OR
    // 3. More than 1 hour since last scan (for non-Twitter platforms)
    // Note: Twitter-specific rate limiting is handled inside scanAccounts()
    const shouldScan = !lastScanKey || 
                      lastScanKey !== scanKey ||
                      !lastScanTime || 
                      (!hasTwitter && timeSinceLastScan > 3600000) || // 1 hour for non-Twitter
                      (hasTwitter && timeSinceLastScan > 900000) // 15 minutes minimum for Twitter (rate limit check inside scanAccounts will handle cache and monthly limit)
    
    if (shouldScan) {
      scanAccounts()
      sessionStorage.setItem('lastScanTime', Date.now().toString())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.adAccounts?.length, settings.socialAccounts?.length])

  const handleGenerate = async (isRegenerate = false) => {
    if (!prompt.trim()) {
      toast.error(t('error') + ': ' + t('required'))
      return
    }

    if (!settings.geminiApiKey) {
      toast.error(t('error') + ': ' + t('addGeminiKey'))
      router.push('/settings')
      return
    }

    if (isRegenerate) {
      setIsRegenerating(true)
    } else {
      setIsGenerating(true)
    }

    try {
      const platformName = contentType === 'ad' 
        ? (adPlatform === 'instagram' ? 'Instagram Ads' : adPlatform === 'facebook' ? 'Facebook Ads' : adPlatform === 'linkedin' ? 'LinkedIn Ads' : 'Twitter Ads')
        : platform
      let fullPrompt = `${prompt}\n\nBusiness: ${settings.businessName || 'My Business'}\nType: ${settings.businessType || 'General'}\nTarget Audience: ${settings.targetAudience || 'General audience'}\nPlatform: ${platformName}`
      
      // Add style guide if reference links were analyzed
      if (styleAnalyses.length > 0) {
        const stylePrompt = generateStylePrompt(styleAnalyses)
        fullPrompt += stylePrompt
      }
      
      // Add performance insights to improve content generation
      const { posts } = useStore.getState()
      const performanceInsights = analyzeContentPerformance(posts)
      if (performanceInsights.recommendations.length > 0) {
        const performancePrompt = generatePerformancePrompt(performanceInsights)
        fullPrompt += performancePrompt
      }

      // Add learned preferences
      const learnedStyle = settings.contentPreferences?.learnedStyle
      const recentEdits = settings.contentPreferences?.edits?.slice(-5) || [] // Last 5 edits
      let learningPrompt = ''
      if (learnedStyle && Object.keys(learnedStyle).length > 0) {
        learningPrompt = generateLearningPrompt(learnedStyle, contentType, recentEdits)
      }
      
      const content = await generateContent(fullPrompt, contentType, settings.geminiApiKey, learningPrompt, language)
      
      // Clean up AI meta-text that might appear at the beginning
      let cleanedContent = content
      // Remove common AI introductory phrases
      const metaPhrases = [
        /^Here's an? .+? post.*?:?\s*/i,
        /^Here's .+? content.*?:?\s*/i,
        /^This is .+? post.*?:?\s*/i,
        /^Below is .+? post.*?:?\s*/i,
        /^Tweet:\s*/i,
        /^Post:\s*/i,
        /^Content:\s*/i,
        /^---\s*/,
        /^\*\*Tweet:\*\*\s*/i,
        /^\*\*Post:\*\*\s*/i,
      ]
      
      for (const phrase of metaPhrases) {
        cleanedContent = cleanedContent.replace(phrase, '').trim()
      }
      
      // Remove any leading separators or markdown
      cleanedContent = cleanedContent.replace(/^[-=*]{3,}\s*/m, '').trim()
      cleanedContent = cleanedContent.replace(/^\*\*.*?:\*\*\s*/m, '').trim()
      
      // CRITICAL: Reject inappropriate content - double check after cleaning
      if (containsInappropriateContent(cleanedContent)) {
        throw new Error('Generated content contains inappropriate language and has been rejected. Please modify your prompt to request professional, appropriate content.')
      }
      
      setGeneratedContent(cleanedContent)
      setOriginalContent(cleanedContent) // Store original for edit tracking
      setEditedContent(cleanedContent) // Initialize edited content
      setCurrentPrompt(fullPrompt + learningPrompt)
      setIsEditing(false) // Reset edit mode
      
      // Clear variations - we'll only show one example at a time
      setVariations([])
      
      if (!isRegenerate) {
        toast.success('Content generated! Review it and regenerate if needed.')
      } else {
        toast.success('New version generated!')
      }
    } catch (error: any) {
      // Parse and format error messages for better UX
      let errorMessage = 'Failed to generate content'
      
      if (error.message) {
        const message = error.message
        
        // Handle quota exceeded errors
        if (message.includes('quota') || message.includes('429') || message.includes('exceeded')) {
          errorMessage = 'API quota exceeded. Please wait a moment and try again, or check your API usage limits.'
        }
        // Handle API key errors
        else if (message.includes('API key') || message.includes('authentication') || message.includes('401') || message.includes('403')) {
          errorMessage = 'API key issue. Please check your Gemini API key in Settings.'
        }
        // Handle network errors
        else if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
          errorMessage = 'Network error. Please check your internet connection and try again.'
        }
        // Handle rate limit errors
        else if (message.includes('rate limit') || message.includes('too many requests')) {
          errorMessage = 'Rate limit reached. Please wait a moment before trying again.'
        }
        // For other errors, show a shorter, cleaner version
        else {
          // Extract the main error message (before any technical details)
          const mainError = message.split(':').slice(-1)[0].trim()
          // Limit length to avoid overly long messages
          errorMessage = mainError.length > 100 ? mainError.substring(0, 100) + '...' : mainError
        }
      }
      
      toast.error(errorMessage, { duration: 6000 })
    } finally {
      setIsGenerating(false)
      setIsRegenerating(false)
    }
  }

  const handleRegenerate = () => {
    handleGenerate(true)
  }

  const handleAcceptContent = async () => {
    const contentToAccept = isEditing ? editedContent : generatedContent
    if (!contentToAccept) {
      toast.error('No content to accept')
      return
    }

    const platformName = contentType === 'ad' ? adPlatform : platform
    const { updateSettings } = useStore.getState()
    
    // If we're editing an existing post, update it directly
    if (editingPostId) {
      const existingPost = posts.find(p => p.id === editingPostId)
      if (existingPost) {
        // Check if content actually changed
        const contentChanged = contentToAccept !== existingPost.content
        
        // Update the post with new content
        await handleSave(contentToAccept)
        
        // Track learning if content was edited (async - don't await to avoid blocking)
        if (contentChanged && originalContent && contentToAccept !== originalContent) {
          trackContentEdit(
            originalContent,
            contentToAccept,
            contentType,
            platformName,
            prompt || 'Post edit',
            updateSettings,
            settings
          ).catch(err => console.error('Learning error:', err))
          toast.success('✓ Post updated! The AI is learning from your changes...', { duration: 8000 })
        } else if (contentChanged) {
          // Content changed but no original to compare (direct edit)
          trackAcceptedContent(
            contentToAccept,
            contentType,
            platformName,
            prompt || 'Post edit',
            updateSettings,
            settings
          ).catch(err => console.error('Learning error:', err))
          toast.success('✓ Post updated! The AI is learning from this content...', { duration: 6000 })
        } else {
          // No changes made, just confirm
          toast.success('✓ Post confirmed (no changes made)', { duration: 5000 })
        }
        
        // Reset editing state
        if (isEditing) {
          setGeneratedContent(editedContent)
          setOriginalContent(editedContent)
          setIsEditing(false)
        }
        
        return
      }
    }
    
    // For new content (not editing existing post)
    if (!currentPrompt && !editingPostId) {
      toast.error('Please generate content first')
      return
    }
    
    // CRITICAL: Reject content with inappropriate language
    if (containsInappropriateContent(contentToAccept)) {
      toast.error('Content contains inappropriate language and cannot be saved. Please remove inappropriate content before saving.', { duration: 8000 })
      return
    }
    
    // If content was edited, check if inappropriate content was added
    if (isEditing && editedContent !== originalContent && originalContent) {
      const originalHasInappropriate = containsInappropriateContent(originalContent)
      const editedHasInappropriate = containsInappropriateContent(editedContent)
      
      // If inappropriate content was ADDED (wasn't in original, but is in edited), reject
      if (!originalHasInappropriate && editedHasInappropriate) {
        toast.error('You added inappropriate content. Please remove it before saving. The AI will not learn from inappropriate content.', { duration: 8000 })
        return
      }
    }
    
    // If content was edited, track the edit to learn from it
    if (isEditing && editedContent !== originalContent && originalContent) {
      trackContentEdit(
        originalContent,
        editedContent,
        contentType,
        platformName,
        prompt,
        updateSettings,
        settings
      )
      toast.success('✓ Edit saved! The AI learned from your changes and will improve future generations.', { duration: 8000 })
    } else if (currentPrompt) {
      // Just track as accepted (only if we have a prompt, meaning it was generated)
      trackAcceptedContent(
        contentToAccept,
        contentType,
        platformName,
        prompt,
        updateSettings,
        settings
      ).catch(err => console.error('Learning error:', err))
      toast.success('✓ Content accepted! The AI is learning from this content and will improve future generations.', { duration: 8000 })
    }
    
    // Update generated content to edited version if edited
    if (isEditing) {
      setGeneratedContent(editedContent)
      setOriginalContent(editedContent)
      setIsEditing(false)
    }
    
    // Automatically save the content and redirect to schedule page (for posts) or show success
    if (contentType === 'post') {
      await handleSave(contentToAccept)
      // handleSave already redirects to schedule, so we're done
    } else if (contentType === 'ad') {
      // For ads, save as draft
      await handleSave(contentToAccept)
      toast.success('Ad saved as draft! You can create the paid ad from the schedule page.', { duration: 6000 })
    }
  }

  const handleStartEdit = () => {
    setEditedContent(generatedContent)
    setOriginalContent(generatedContent)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditedContent(generatedContent)
    setIsEditing(false)
  }

  const handleSaveEdit = () => {
    if (editedContent.trim() === '') {
      toast.error('Content cannot be empty')
      return
    }
    
    // CRITICAL: Reject if inappropriate content was added
    if (originalContent && containsInappropriateContent(editedContent)) {
      const originalHasInappropriate = containsInappropriateContent(originalContent)
      const editedHasInappropriate = containsInappropriateContent(editedContent)
      
      // If inappropriate content was ADDED (wasn't in original, but is in edited), reject
      if (!originalHasInappropriate && editedHasInappropriate) {
        toast.error('You added inappropriate content. Please remove it before saving. The AI will not learn from inappropriate content.', { duration: 8000 })
        return
      }
      
      // If inappropriate content exists in edited version, reject
      if (editedHasInappropriate) {
        toast.error('Content contains inappropriate language and cannot be saved. Please remove inappropriate content.', { duration: 8000 })
        return
      }
    }
    
    setGeneratedContent(editedContent)
    setIsEditing(false)
    toast.success('Edit saved! Click "I\'m Happy - Use This" to learn from your changes.', { duration: 7000 })
  }

  // Removed handleRejectContent - rejected content tracking is not needed
  // Content with offensive words cannot be created in the first place due to filtering

  const convertMediaToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Smart compression for storage: high quality (90-95%) but optimized size
  // Original quality is preserved for direct posting (using File object in memory)
  const compressForStorage = (file: File, maxWidth: number = 4096, quality: number = 0.92): Promise<string> => {
    return new Promise((resolve, reject) => {
      // For videos or very small images, use original
      if (!file.type.startsWith('image/') || file.size < 500000) {
        convertMediaToBase64(file).then(resolve).catch(reject)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          let width = img.width
          let height = img.height
          const maxHeight = Math.round((maxWidth / width) * height)
          
          // Only resize if exceeds max dimensions (preserve quality for smaller images)
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height
            if (width > height) {
              width = maxWidth
              height = Math.round(maxWidth / aspectRatio)
            } else {
              height = maxHeight
              width = Math.round(maxHeight * aspectRatio)
            }
          }
          
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }
          
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)
          
          const fileType = file.type.toLowerCase()
          const mimeType = fileType.includes('png') ? 'image/png' : 'image/jpeg'
          const compressed = canvas.toDataURL(
            mimeType, 
            fileType.includes('png') ? undefined : quality // 92% quality - excellent for posting, smaller for storage
          )
          resolve(compressed)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleSave = async (content?: string) => {
    const contentToSave = content || (isEditing ? editedContent : generatedContent)
    if (!contentToSave) return
    
    // CRITICAL: Reject content with inappropriate language
    if (containsInappropriateContent(contentToSave)) {
      toast.error('Content contains inappropriate language and cannot be saved. Please remove inappropriate content before saving.', { duration: 8000 })
      return
    }
    
    // If content was edited, check if inappropriate content was added
    if (isEditing && editedContent !== originalContent && originalContent) {
      const originalHasInappropriate = containsInappropriateContent(originalContent)
      const editedHasInappropriate = containsInappropriateContent(editedContent)
      
      // If inappropriate content was ADDED (wasn't in original, but is in edited), reject
      if (!originalHasInappropriate && editedHasInappropriate) {
        toast.error('You added inappropriate content. Please remove it before saving. The AI will not learn from inappropriate content.', { duration: 8000 })
        return
      }
    }
    
    let mediaData = undefined
    
    // Prefer brand image over uploaded media
    if (selectedBrandImage) {
      mediaData = {
        file: selectedBrandImage, // Already a data URL or URL
        type: 'image' as const,
      }
    } else if (selectedMedia) {
      try {
        // Smart approach: compress for storage efficiency but maintain excellent quality (92%)
        // Original File object is kept in memory for direct posting (100% quality)
        // When saving as draft/scheduled, we use compressed version for storage
        // When posting directly, we can use original File object from selectedMedia
        const base64 = await compressForStorage(selectedMedia.file) // 92% quality, max 4096px - excellent for posting, efficient for storage
        mediaData = {
          file: base64, // High quality compressed (92%) - excellent for posting, efficient for storage
          type: selectedMedia.type,
          width: selectedMedia.width,
          height: selectedMedia.height,
        }
      } catch (error) {
        toast.error('Failed to process media file')
        return
      }
    }

    // Extract hashtags from content
    const hashtagRegex = /#[\w]+/g
    const hashtags = contentToSave.match(hashtagRegex)?.map(tag => tag.substring(1)) || []

    // Determine content type
    const postContentType = mediaData 
      ? (mediaData.type === 'video' ? 'video' : 'image')
      : 'text'

    // If editing existing post, update it; otherwise create new
    if (editingPostId) {
      const existingPost = posts.find(p => p.id === editingPostId)
      if (existingPost) {
        updatePost(editingPostId, {
          content: contentToSave,
          platform,
          media: mediaData,
          contentType: postContentType as 'text' | 'image' | 'video',
          hashtags: hashtags,
          hasMedia: !!mediaData,
          // Preserve scheduled time and status if it was scheduled
          scheduledFor: existingPost.scheduledFor,
          status: existingPost.status, // Keep status (scheduled, draft, etc.)
        })
        toast.success('Post updated successfully!', { duration: 5000 })
        setEditingPostId(null)
      }
    } else {
      const newPost = {
        id: Date.now().toString(),
        content: contentToSave,
        platform,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        media: mediaData,
        contentType: postContentType as 'text' | 'image' | 'video',
        hashtags: hashtags,
        hasMedia: !!mediaData,
      }
      addPost(newPost)
    }
    
    // If content was edited, track the edit to learn from it (async - don't await)
    if (isEditing && editedContent !== originalContent) {
      const platformName = contentType === 'ad' ? adPlatform : platform
      const { updateSettings } = useStore.getState()
      trackContentEdit(
        originalContent,
        editedContent,
        contentType,
        platformName,
        prompt,
        updateSettings,
        settings
      ).catch(err => console.error('Learning error:', err))
      toast.success(contentType === 'ad' ? 'Ad saved! The AI is learning from your edits...' : 'Post saved! The AI is learning from your edits...', { duration: 7000 })
    } else if (!editingPostId) {
      // Only show "saved" message if it's a new post, not an update
      toast.success(contentType === 'ad' ? 'Ad saved as draft!' : 'Post saved!', { duration: 5000 })
    }
    
    // Update state if edited
    if (isEditing) {
      setGeneratedContent(editedContent)
      setOriginalContent(editedContent)
      setIsEditing(false)
    }
    
    // Reset editing state
    if (editingPostId) {
      setEditingPostId(null)
    }
    
    if (contentType === 'post') {
      router.push('/schedule')
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const platformIcons = {
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
    instagram: Instagram,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative">
      {/* Dynamic gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/10 animate-pulse pointer-events-none"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur-xl opacity-50"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
            </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t('aiContentGenerator')}
            </h1>
          </div>
          {generatedContent && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-semibold text-yellow-300">Ready!</span>
        </div>
          )}
      </div>

        {/* Main Content Grid - Everything on one screen */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {/* Left Column - Type/Platform & Prompt */}
          <div className="lg:col-span-1 flex flex-col space-y-1.5" style={{ height: '503px' }}>
            {/* Combined Type & Platform */}
            <div className="glass rounded-xl p-3 border border-slate-700/50 flex-1 flex flex-col">
              <label className="text-xs font-semibold text-slate-300 mb-2 block">Type & Platform</label>
              <div className="space-y-2">
                {/* Content Type */}
                <div className="flex gap-2">
                  {(['post', 'ad'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleContentTypeChange(type)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    contentType === type
                      ? type === 'ad' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                  }`}
                >
                      {type === 'ad' ? 'Paid Ad' : 'Post'}
                </button>
              ))}
            </div>
                {/* Platform */}
          {(contentType === 'post' || contentType === 'ad') && (
                  <div className="grid grid-cols-4 gap-1.5">
                  {(['twitter', 'linkedin', 'facebook', 'instagram'] as const).map((p) => {
                    const Icon = platformIcons[p]
                      const isSelected = contentType === 'post' ? platform === p : adPlatform === p
                    return (
                      <button
                        key={p}
                          onClick={() => contentType === 'post' ? setPlatform(p) : setAdPlatform(p as AdPlatform)}
                          className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                          isSelected
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md scale-105'
                              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                        }`}
                      >
                          <Icon className="w-4 h-4" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            </div>

            {/* Prompt Input - Same width as Type/Platform */}
            <div className="glass rounded-xl p-4 border border-slate-700/50 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <label className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>{t('whatDoYouWantToCreate')}</span>
                </label>
                {prompt && (
                  <div className="flex items-center space-x-1 text-xs text-purple-400">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">Ready!</span>
                  </div>
                )}
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('placeholder')}
                className="w-full flex-1 px-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none text-white placeholder:text-slate-500 text-sm transition-all min-h-[100px]"
              />
            </div>

            {/* Connected Social Accounts Status */}
            {(contentType === 'post' || contentType === 'ad') && (() => {
              const adAccounts = settings.adAccounts || []
              const socialAccounts = settings.socialAccounts || []
              const connectedSocialAccounts = socialAccounts.filter(acc => acc.connected && acc.accessToken)
              const scannedPosts = settings.contentPreferences?.scannedPosts || []
              const hasScannedPosts = scannedPosts.length > 0
              const lastScanTime = isMounted ? sessionStorage.getItem('lastScanTime') : null
              const platformIcons: Record<string, any> = {
                facebook: Facebook,
                instagram: Instagram,
                twitter: Twitter,
                linkedin: Linkedin,
              }
              
              if (connectedSocialAccounts.length === 0 && !isScanning) return null
              
              return (
                <div className="glass rounded-xl p-2.5 border border-green-500/30 bg-gradient-to-br from-green-500/10 to-blue-500/10 relative overflow-hidden flex-shrink-0">
                  {/* Decorative gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
                  
                  <div className="relative w-full">
                    {/* Header */}
                    <div className="flex items-center mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <h3 className="text-xs font-bold text-white">Connected Social</h3>
                </div>
              </div>
              
                    {isScanning ? (
                      <div className="flex items-center space-x-1.5">
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
                        <p className="text-xs text-blue-300">Scanning...</p>
                </div>
                    ) : connectedSocialAccounts.length > 0 ? (
                      <div className="space-y-1.5">
                        {/* Platform badges - compact */}
                        <div className="flex flex-wrap gap-1">
                          {connectedSocialAccounts.map((acc) => {
                            const Icon = platformIcons[acc.platform]
                            const platformNames: Record<string, string> = {
                              facebook: 'Facebook',
                              instagram: 'Instagram',
                              twitter: 'Twitter/X',
                              linkedin: 'LinkedIn',
                            }
                            return (
                              <div
                                key={acc.platform}
                                className="flex items-center space-x-1 px-1.5 py-0.5 bg-slate-800/50 rounded border border-slate-700/50"
                              >
                                {Icon && <Icon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
                                <span className="text-[10px] font-medium text-white">
                                  {platformNames[acc.platform] || acc.platform}
                                </span>
                </div>
                            )
                          })}
                        </div>

                        {/* Stats - compact */}
                        {hasScannedPosts && (
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-700/50 mt-1.5">
                            <div className="flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
                              <p className="text-[10px] font-medium text-slate-300">
                                {scannedPosts.length} {scannedPosts.length === 1 ? 'post' : 'posts'}
                        </p>
                      </div>
                            <div className="inline-flex items-center px-1.5 py-0.5 bg-green-500/30 rounded border border-green-500/50">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
                              <span className="text-[9px] font-semibold text-green-300">Active</span>
                    </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Middle Column - Media */}
          {(contentType === 'post' || contentType === 'ad') && (
            <div className="lg:col-span-1 flex flex-col" style={{ height: '503px' }}>
              <div className="glass rounded-xl p-4 border border-slate-700/50 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <label className="text-sm font-semibold text-white">Media</label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const fileInput = document.createElement('input')
                        fileInput.type = 'file'
                        fileInput.accept = 'image/*,video/*'
                        fileInput.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (!file) return
                          
                          // Use ORIGINAL quality for posting (100% quality preserved)
                          // Image is NOT automatically added to library (user can do that manually if needed)
                          const objectUrl = URL.createObjectURL(file)
                          const mediaFile: MediaFile = {
                            file, // Original File object - 100% quality for posting
                            preview: objectUrl,
                            type: file.type.startsWith('image/') ? 'image' : 'video',
                            size: file.size,
                            validated: true,
                          }
                          setSelectedMedia(mediaFile)
                          setSelectedBrandImage(null)
                          toast.success('Image loaded with original quality for posting')
                        }
                        fileInput.click()
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors flex items-center space-x-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                    <button
                      onClick={() => setShowLibraryModal(true)}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors relative pr-5"
                    >
                      Library
                      {(() => {
                        const currentPlatform = contentType === 'ad' ? adPlatform : platform
                        const imageCount = (settings.brandImages || []).filter(
                          img => img.platform === currentPlatform
                        ).length
                        if (imageCount > 0) {
                          return (
                            <span className="absolute -top-1.5 right-0 bg-purple-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center border-2 border-slate-900 shadow-lg leading-none">
                              {imageCount > 99 ? '99+' : imageCount}
                            </span>
                          )
                        }
                        return null
                      })()}
                    </button>
                  </div>
                </div>
                <div className="border border-dashed border-slate-700 rounded-lg p-3 flex-1 flex items-center justify-center overflow-hidden min-h-0" style={{ minHeight: '200px' }}>
                  {selectedMedia && !selectedBrandImage ? (
                    <div className="flex items-center justify-center relative w-full h-full max-w-full max-h-full overflow-hidden">
                      {selectedMedia.type === 'image' ? (
                        <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center">
                          <img
                            src={selectedMedia.preview}
                            alt="Selected media"
                            className="max-w-full max-h-full w-auto h-auto object-contain rounded"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                          <Video className="w-12 h-12" />
                          <p className="text-xs">Video selected</p>
                        </div>
                      )}
                    <button
                      onClick={() => setSelectedMedia(null)}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  ) : selectedBrandImage ? (
                    <div className="flex items-center justify-center relative w-full h-full max-w-full max-h-full overflow-hidden">
                      <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center">
                        <img
                          src={selectedBrandImage}
                          alt="Selected brand image"
                          className="max-w-full max-h-full w-auto h-auto object-contain rounded"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <button
                        onClick={() => setSelectedBrandImage(null)}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-slate-500" style={{ minHeight: '150px' }}>
                      <p className="text-xs text-center">No media selected</p>
                </div>
              )}
                </div>
              </div>
            </div>
          )}

          {/* Right Column - Generated Content Preview */}
          <div className="lg:col-span-1 flex flex-col space-y-1.5" style={{ height: '503px' }}>
            {/* Generate Button - Above content area */}
          <button
            onClick={() => handleGenerate()}
              disabled={isGenerating || isRegenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-size-200 animate-gradient text-white py-3 px-4 rounded-xl font-bold text-sm hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl relative overflow-hidden group flex-shrink-0"
          >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            {isGenerating || isRegenerating ? (
              <>
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                  <span className="relative z-10">{isRegenerating ? 'Regenerating...' : 'Creating Magic...'}</span>
              </>
            ) : (
              <>
                  <Zap className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">{t('generateContent')}</span>
                  <Star className="w-4 h-4 text-yellow-300 relative z-10" />
              </>
            )}
          </button>
          
            {/* Preview with inline editing */}
            <div className="glass rounded-xl border border-slate-700/50 flex-1 flex flex-col overflow-hidden relative">
              {/* Header - Fixed position, z-index to stay on top */}
              <div className="flex items-center justify-between px-3 pt-3 pb-3 border-b border-slate-700/50 flex-shrink-0 bg-slate-800/50 backdrop-blur-sm relative z-10" style={{ minHeight: '45px' }}>
                <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Preview</span>
                </h3>
        {generatedContent && (
                  <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleCopy(isEditing ? editedContent : generatedContent)}
                      className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                      title="Copy"
                  >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                    {!isEditing && (
                      <>
                        <button
                          onClick={handleStartEdit}
                          className="px-2 py-1 text-[10px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={handleRegenerate}
                          disabled={isRegenerating}
                          className="px-2 py-1 text-[10px] bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium disabled:opacity-50"
                        >
                          {isRegenerating ? '...' : 'New'}
                        </button>
                        <button
                          onClick={handleAcceptContent}
                          className="px-2 py-1 text-[10px] bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Use
                        </button>
                      </>
                    )}
                    {isEditing && (
                      <>
                      <button
                        onClick={handleSaveEdit}
                          className="px-2 py-1 text-[10px] bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                          Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                          className="px-2 py-1 text-[10px] bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Content - Starts AFTER header, scrollable */}
              <div className="flex-1 overflow-y-auto px-3 py-4 relative" style={{ paddingTop: '12px' }}>
                <div className="w-full flex items-start justify-center">
                  <div className="w-full flex items-start justify-center" style={{ maxWidth: '100%' }}>
                    <div style={{ 
                      transform: 'scale(0.85)', 
                      transformOrigin: 'top center', 
                      width: '100%',
                      maxWidth: '100%'
                    }}>
                  <PlatformPreview
                    platform={(contentType === 'ad' ? (adPlatform === 'google' ? 'facebook' : adPlatform) : platform) as 'twitter' | 'linkedin' | 'facebook' | 'instagram'}
                        content={isEditing && editedContent ? editedContent : (generatedContent || "Your generated content will appear here")}
                    imageUrl={selectedBrandImage || selectedMedia?.preview}
                    businessName={settings.businessName}
                        isEditable={isEditing && !!generatedContent}
                        onContentChange={(newContent) => {
                          if (isEditing) {
                            setEditedContent(newContent)
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator - Show when content is generated and user hasn't scrolled down */}
        {generatedContent && showScrollIndicator && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <button
              onClick={scrollToFullPreview}
              className="glass rounded-full px-4 py-2 border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/30 to-pink-500/30 shadow-glow-lg animate-bounce-down hover:from-purple-500/40 hover:to-pink-500/40 transition-all cursor-pointer"
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-xs font-bold text-white">Scroll for full preview</span>
                <ArrowDown className="w-5 h-5 text-purple-300 animate-bounce" />
              </div>
            </button>
                </div>
              )}
              
        {/* Full-Size Preview - Below scroll */}
        {generatedContent && (
          <div ref={fullPreviewRef} className="mt-8 pb-8">
            <div className="glass rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span>Full Preview</span>
                </h3>
                {generatedContent && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopy(isEditing ? editedContent : generatedContent)}
                      className="p-2 hover:bg-slate-700/50 rounded transition-colors"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                    </button>
              {!isEditing && (
                      <>
                  <button
                    onClick={handleStartEdit}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                          Edit
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                          className="px-3 py-1.5 text-xs bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium disabled:opacity-50"
                  >
                          {isRegenerating ? '...' : 'New'}
                  </button>
                  <button
                    onClick={handleAcceptContent}
                          className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                          Use
                  </button>
                      </>
              )}
                    {isEditing && (
                <>
                      <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                          Save
                      </button>
                      <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-xs bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
                      >
                          Cancel
                      </button>
                </>
              )}
            </div>
                )}
              </div>
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <PlatformPreview
                    platform={(contentType === 'ad' ? (adPlatform === 'google' ? 'facebook' : adPlatform) : platform) as 'twitter' | 'linkedin' | 'facebook' | 'instagram'}
                    content={isEditing && editedContent ? editedContent : generatedContent}
                    imageUrl={selectedBrandImage || selectedMedia?.preview}
                    businessName={settings.businessName}
                    isEditable={isEditing && !!generatedContent}
                    onContentChange={(newContent) => {
                      if (isEditing) {
                        setEditedContent(newContent)
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Ad Dialog */}

        {/* Create Ad Dialog */}
        {contentType === 'ad' && (
          <CreateAdDialog
            isOpen={showCreateAd}
            onClose={() => setShowCreateAd(false)}
            platform={adPlatform}
            content={generatedContent}
            imageUrl={selectedBrandImage || selectedMedia?.preview}
            headline={generatedContent?.split('\n')[0]}
            description={generatedContent || ''}
            linkUrl={settings.businessName ? `https://${settings.businessName.toLowerCase().replace(/\s+/g, '')}.com` : undefined}
          />
        )}

        {/* Brand Image Library Modal */}
        {showLibraryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowLibraryModal(false)}>
            <div className="glass rounded-xl border-2 border-purple-500/30 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span>Brand Image Library</span>
                </h2>
                <button
                  onClick={() => setShowLibraryModal(false)}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <BrandImageLibrary
                onImageSelect={(url) => {
                  setSelectedBrandImage(url)
                  setSelectedMedia(null)
                  setShowLibraryModal(false)
                }}
                onMediaSelect={(media) => {
                  setSelectedMedia(media)
                  setSelectedBrandImage(null)
                  setShowLibraryModal(false)
                }}
                selectedImageUrl={selectedBrandImage || undefined}
                platform={contentType === 'ad' ? adPlatform : platform}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
