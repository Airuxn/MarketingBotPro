/**
 * Automatic scanning of connected social media accounts
 * Extracts posts, ads, images, and style patterns automatically
 */

import { analyzeContent, StyleAnalysis } from './content-analyzer'
import { extractImagesFromUrl } from './image-extractor'
import { AdAccount } from './ad-platforms'

interface SocialAccount {
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram'
  accessToken: string
  userId?: string
  connected: boolean
}

export interface ScannedContent {
  id: string
  platform: string
  content: string
  images: string[]
  createdAt: string
  engagement?: {
    likes?: number
    comments?: number
    shares?: number
  }
  styleAnalysis?: StyleAnalysis
}

export async function scanFacebookAccount(accessToken: string, accountId: string): Promise<ScannedContent[]> {
  try {
    const allScanned: ScannedContent[] = []
    
    // Try to scan personal posts first (works with Consumer login)
    // Use 'me' to get user's personal posts
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/posts?access_token=${accessToken}&fields=id,message,created_time,attachments{media{image{src}}},likes.summary(true),comments.summary(true),shares&limit=50`,
        {
          method: 'GET',
        }
      )

      const data = await response.json()

      if (!data.error && data.data) {
        for (const post of data.data) {
          const images: string[] = []
          
          // Extract images from attachments (only photos, not videos)
          if (post.attachments?.data) {
            for (const attachment of post.attachments.data) {
              // Only include photo attachments
              if (attachment.media?.type === 'photo' && attachment.media?.image?.src) {
                images.push(attachment.media.image.src)
              }
            }
          }

          // Also check for photos field if available
          if (post.photos?.data) {
            for (const photo of post.photos.data) {
              if (photo.picture || photo.images?.[0]?.source) {
                images.push(photo.picture || photo.images[0].source)
              }
            }
          }

          // Analyze content style (only if post has meaningful content)
          let styleAnalysis: StyleAnalysis | undefined
          if (post.message && post.message.trim().length > 0) {
            styleAnalysis = analyzeContent(post.message)
          }

          allScanned.push({
            id: post.id,
            platform: 'facebook',
            content: post.message || '',
            images,
            createdAt: post.created_time,
            engagement: {
              likes: post.likes?.summary?.total_count,
              comments: post.comments?.summary?.total_count,
              shares: post.shares?.count,
            },
            styleAnalysis,
          })
        }
      }
    } catch (personalError) {
      // Personal posts scan failed - might not have permission or using Business login
      console.log('Personal posts scan failed, trying pages...')
    }

    // Also try to scan Pages (works with Business login or if user has pages)
    try {
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token`,
        {
          method: 'GET',
        }
      )

      const pagesData = await pagesResponse.json()

      // If we got pages, scan each page
      if (pagesData.data && pagesData.data.length > 0) {
        for (const page of pagesData.data) {
          try {
            // Use page access token to get page posts
            const pageToken = page.access_token || accessToken
            const response = await fetch(
              `https://graph.facebook.com/v18.0/${page.id}/posts?access_token=${pageToken}&fields=id,message,created_time,attachments{media{image{src}}},likes.summary(true),comments.summary(true),shares&limit=25`,
              {
                method: 'GET',
              }
            )

            const data = await response.json()

            if (data.error) {
              continue
            }

            for (const post of data.data || []) {
              const images: string[] = []
              
              if (post.attachments?.data) {
                for (const attachment of post.attachments.data) {
                  if (attachment.media?.type === 'photo' && attachment.media?.image?.src) {
                    images.push(attachment.media.image.src)
                  }
                }
              }

              let styleAnalysis: StyleAnalysis | undefined
            if (post.message && post.message.trim().length > 0) {
                styleAnalysis = analyzeContent(post.message)
              }

              allScanned.push({
                id: post.id,
                platform: 'facebook',
                content: post.message || '',
                images,
                createdAt: post.created_time,
                engagement: {
                  likes: post.likes?.summary?.total_count,
                  comments: post.comments?.summary?.total_count,
                  shares: post.shares?.count,
                },
                styleAnalysis,
              })
            }
          } catch (pageError) {
            continue
          }
        }
      }
    } catch (pagesError) {
      // Pages scan failed
    }

    return allScanned
  } catch (error: any) {
    console.error('Facebook scan error:', error)
    return []
  }
}

export async function scanTwitterAccount(accessToken: string, userId: string): Promise<ScannedContent[]> {
  try {
    // Validate userId - Twitter User ID should not be 'me' or empty
    if (!userId || userId === 'me' || userId.trim() === '') {
      console.error('Twitter scan error: Invalid userId. Twitter requires a specific User ID, not "me".')
      console.error('Current userId:', userId)
      console.error('Please ensure the Twitter account was connected properly via OAuth and userId was retrieved.')
      return []
    }

    console.log(`[Twitter Scan] Starting scan for userId: ${userId}`)

    // Twitter API v2 - get user tweets
    // Note: Using userId from the connected account (not 'me' endpoint)
    const apiUrl = `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=created_at,text,public_metrics,attachments&expansions=attachments.media_keys&media.fields=url,preview_image_url,type&exclude=replies,retweets`
    
    console.log(`[Twitter Scan] Calling API: ${apiUrl.replace(userId, 'USER_ID')}`)
    
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.errors?.[0]?.detail || errorData.title || `HTTP ${response.status}`
      const errorType = errorData.errors?.[0]?.type || 'unknown'
      
      console.error(`[Twitter Scan] API Error (${response.status}):`, errorMessage)
      console.error(`[Twitter Scan] Error type:`, errorType)
      console.error(`[Twitter Scan] Full error data:`, JSON.stringify(errorData, null, 2))
      
      // Common issues:
      if (response.status === 403) {
        console.error('[Twitter Scan] 403 Forbidden - This usually means:')
        console.error('1. The token does not have tweet.read permission')
        console.error('2. The app does not have "Read and write" permissions enabled')
        console.error('3. The userId might be incorrect or not accessible with this token')
      } else if (response.status === 401) {
        console.error('[Twitter Scan] 401 Unauthorized - Token might be expired or invalid')
      } else if (response.status === 404) {
        console.error('[Twitter Scan] 404 Not Found - User ID might be incorrect or user does not exist')
      }
      
      throw new Error(`Twitter API error: ${errorMessage}`)
    }

    const data = await response.json()

    if (data.errors && data.errors.length > 0) {
      const errorDetail = data.errors[0].detail || data.errors[0].title || 'Unknown error'
      console.error('[Twitter Scan] API returned errors:', JSON.stringify(data.errors, null, 2))
      throw new Error(`Twitter API error: ${errorDetail}`)
    }

    if (!data.data || data.data.length === 0) {
      console.log('[Twitter Scan] No tweets found for this user (user might have no tweets, or all are replies/retweets)')
      return []
    }

    console.log(`[Twitter Scan] Found ${data.data.length} tweets`)

    const scanned: ScannedContent[] = []
    const mediaMap = new Map()

    // Map media (only images, not videos)
    if (data.includes?.media) {
      console.log(`[Twitter Scan] Found ${data.includes.media.length} media items`)
      for (const media of data.includes.media) {
        // Only include images, skip videos
        if (media.type === 'photo' && (media.url || media.preview_image_url)) {
          mediaMap.set(media.media_key, media.url || media.preview_image_url)
        }
      }
    }

    for (const tweet of data.data) {
      const images: string[] = []
      
      // Extract images from attachments
      if (tweet.attachments?.media_keys) {
        for (const key of tweet.attachments.media_keys) {
          const mediaUrl = mediaMap.get(key)
          if (mediaUrl) {
            images.push(mediaUrl)
          }
        }
      }

      // Analyze content style
      let styleAnalysis: StyleAnalysis | undefined
      if (tweet.text && tweet.text.trim().length > 0) {
        styleAnalysis = analyzeContent(tweet.text)
      }

      scanned.push({
        id: tweet.id,
        platform: 'twitter',
        content: tweet.text || '',
        images,
        createdAt: tweet.created_at,
        engagement: {
          likes: tweet.public_metrics?.like_count,
          comments: tweet.public_metrics?.reply_count,
          shares: tweet.public_metrics?.retweet_count,
        },
        styleAnalysis,
      })
    }

    console.log(`[Twitter Scan] Successfully scanned ${scanned.length} tweets`)
    return scanned
  } catch (error: any) {
    console.error('[Twitter Scan] Error scanning Twitter account:', error)
    console.error('[Twitter Scan] Error message:', error.message)
    console.error('[Twitter Scan] UserId used:', userId)
    return []
  }
}

export async function scanLinkedInAccount(accessToken: string): Promise<ScannedContent[]> {
  try {
    // LinkedIn API - get user posts
    const response = await fetch(
      'https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(me)',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const data = await response.json()

    if (data.errorCode) {
      throw new Error(data.message)
    }

    const scanned: ScannedContent[] = []

    for (const post of data.elements || []) {
      const content = post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || ''
      const images: string[] = []

      // Extract images from share media
      const shareMedia = post.specificContent?.['com.linkedin.ugc.ShareContent']?.media
      if (shareMedia) {
        for (const media of shareMedia) {
          if (media.media) {
            images.push(media.media)
          }
        }
      }

      // Analyze content style
      let styleAnalysis: StyleAnalysis | undefined
      if (content && content.trim().length > 0) {
        styleAnalysis = analyzeContent(content)
      }

      scanned.push({
        id: post.id,
        platform: 'linkedin',
        content,
        images,
        createdAt: post.created?.time || new Date().toISOString(),
        styleAnalysis,
      })
    }

    return scanned
  } catch (error: any) {
    console.error('LinkedIn scan error:', error)
    return []
  }
}

export async function scanInstagramAccount(accessToken: string, userId: string): Promise<ScannedContent[]> {
  try {
    // Instagram Graph API requires Instagram Business Account ID (not Facebook user ID or 'me')
    if (!userId || userId === 'me') {
      console.error('Instagram scan: userId is required and must be an Instagram Business Account ID')
      return []
    }

    // Instagram Graph API - get user media (limit to 100 to get more images)
    const response = await fetch(
      `https://graph.instagram.com/${userId}/media?access_token=${accessToken}&limit=100&fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count`,
      {
        method: 'GET',
      }
    )

    const data = await response.json()

    if (data.error) {
      console.error('Instagram API error:', data.error)
      throw new Error(data.error.message || 'Instagram API error')
    }

    const scanned: ScannedContent[] = []

    for (const media of data.data || []) {
      const images: string[] = []
      
      if (media.media_type === 'IMAGE' && media.media_url) {
        images.push(media.media_url)
      } else if (media.media_type === 'VIDEO') {
        // For videos, use thumbnail_url (if available) or media_url
        if (media.thumbnail_url) {
          images.push(media.thumbnail_url)
        } else if (media.media_url) {
          images.push(media.media_url)
        }
      } else if (media.media_type === 'CAROUSEL_ALBUM') {
        // Would need additional API call to get carousel items
        if (media.media_url) {
          images.push(media.media_url)
        }
      }

      // Analyze content style
      let styleAnalysis: StyleAnalysis | undefined
      if (media.caption && media.caption.trim().length > 0) {
        styleAnalysis = analyzeContent(media.caption)
      }

      scanned.push({
        id: media.id,
        platform: 'instagram',
        content: media.caption || '',
        images,
        createdAt: media.timestamp,
        engagement: {
          likes: media.like_count,
          comments: media.comments_count,
        },
        styleAnalysis,
      })
    }

    return scanned
  } catch (error: any) {
    console.error('Instagram scan error:', error)
    return []
  }
}

export async function autoScanAllPlatforms(
  adAccounts: AdAccount[],
  socialAccounts: SocialAccount[]
): Promise<{
  content: ScannedContent[]
  images: Array<{ url: string; platform: string; sourceId: string }>
  styleAnalyses: StyleAnalysis[]
}> {
  const allContent: ScannedContent[] = []
  const allImages: Array<{ url: string; platform: string; sourceId: string }> = []
  const allStyleAnalyses: StyleAnalysis[] = []

  // Scan ad accounts (Facebook, Twitter, LinkedIn for ads)
  for (const account of adAccounts) {
    if (!account.connected || !account.accessToken) continue

    try {
      let scanned: ScannedContent[] = []

      switch (account.platform) {
        case 'facebook':
          scanned = await scanFacebookAccount(account.accessToken, account.accountId)
          break
        case 'twitter':
          scanned = await scanTwitterAccount(account.accessToken, account.accountId)
          break
        case 'linkedin':
          scanned = await scanLinkedInAccount(account.accessToken)
          break
        default:
          continue
      }

      // Process scanned content
      for (const item of scanned) {
        allContent.push(item)

        // Extract images
        for (const imageUrl of item.images) {
          allImages.push({
            url: imageUrl,
            platform: item.platform,
            sourceId: item.id,
          })
        }

        // Collect style analyses
        if (item.styleAnalysis) {
          allStyleAnalyses.push(item.styleAnalysis)
        }
      }
    } catch (error) {
      console.error(`Error scanning ${account.platform}:`, error)
    }
  }

  // Scan social accounts (Facebook, Twitter, LinkedIn, Instagram for posts)
  for (const account of socialAccounts) {
    if (!account.connected || !account.accessToken) {
      console.log(`[Auto Scanner] Skipping ${account.platform} - connected: ${account.connected}, hasToken: ${!!account.accessToken}`)
      continue
    }

    try {
      let scanned: ScannedContent[] = []

      switch (account.platform) {
        case 'facebook':
          console.log(`[Auto Scanner] Scanning Facebook account (userId: ${account.userId || 'me'})`)
          scanned = await scanFacebookAccount(account.accessToken, account.userId || 'me')
          console.log(`[Auto Scanner] Facebook scan completed: ${scanned.length} items found`)
          break
        case 'twitter':
          console.log(`[Auto Scanner] Scanning Twitter account (userId: ${account.userId || 'NOT SET'})`)
          if (!account.userId || account.userId === 'me') {
            console.error('[Auto Scanner] Twitter account missing userId. Twitter requires a specific User ID.')
            console.error('[Auto Scanner] This usually means the OAuth callback failed to retrieve the User ID.')
            console.error('[Auto Scanner] Please disconnect and reconnect Twitter to fix this.')
          } else {
            scanned = await scanTwitterAccount(account.accessToken, account.userId)
            console.log(`[Auto Scanner] Twitter scan completed: ${scanned.length} items found`)
          }
          break
        case 'linkedin':
          console.log(`[Auto Scanner] Scanning LinkedIn account`)
          scanned = await scanLinkedInAccount(account.accessToken)
          console.log(`[Auto Scanner] LinkedIn scan completed: ${scanned.length} items found`)
          break
        case 'instagram':
          // Instagram requires Instagram Business Account ID, not 'me'
          if (account.userId && account.userId !== 'me') {
            console.log(`[Auto Scanner] Scanning Instagram account with userId: ${account.userId}`)
            scanned = await scanInstagramAccount(account.accessToken, account.userId)
            console.log(`[Auto Scanner] Instagram scan completed: ${scanned.length} items found`)
          } else {
            console.warn('[Auto Scanner] Instagram account missing userId (Instagram Business Account ID). Skipping scan.')
            console.warn('[Auto Scanner] This usually means:')
            console.warn('1. Instagram account is not a Business/Creator account, OR')
            console.warn('2. Instagram account is not connected to a Facebook Page, OR')
            console.warn('3. The OAuth callback failed to retrieve the Instagram Business Account ID')
            console.warn('[Auto Scanner] Try disconnecting and reconnecting Instagram.')
          }
          break
        default:
          console.log(`[Auto Scanner] Unknown platform: ${account.platform}, skipping`)
          continue
      }

      // Process scanned content
      for (const item of scanned) {
        allContent.push(item)

        // Extract images
        for (const imageUrl of item.images) {
          allImages.push({
            url: imageUrl,
            platform: item.platform,
            sourceId: item.id,
          })
        }

        // Collect style analyses
        if (item.styleAnalysis) {
          allStyleAnalyses.push(item.styleAnalysis)
        }
      }
    } catch (error) {
      console.error(`Error scanning ${account.platform}:`, error)
    }
  }

  return {
    content: allContent,
    images: allImages,
    styleAnalyses: allStyleAnalyses,
  }
}
