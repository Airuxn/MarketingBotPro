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
        `https://graph.facebook.com/v18.0/me/posts?access_token=${accessToken}&fields=id,message,created_time,attachments{media{image{src}}},likes.summary(true),comments.summary(true),shares&limit=10`,
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
              `https://graph.facebook.com/v18.0/${page.id}/posts?access_token=${pageToken}&fields=id,message,created_time,attachments{media{image{src}}},likes.summary(true),comments.summary(true),shares&limit=10`,
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
            
            if (data.data && data.data.length > 0) {
              const pageImages = data.data.reduce((sum: number, post: any) => {
                const postImages: string[] = []
                if (post.attachments?.data) {
                  for (const attachment of post.attachments.data) {
                    if (attachment.media?.type === 'photo' && attachment.media?.image?.src) {
                      postImages.push(attachment.media.image.src)
                    }
                  }
                }
                return sum + postImages.length
              }, 0)
              console.log(`[Facebook Scan] Page ${page.name} (${page.id}): ${data.data.length} posts, ${pageImages} images`)
            }
          } catch (pageError) {
            console.error(`[Facebook Scan] Error scanning page:`, pageError)
            continue
          }
        }
      }
    } catch (pagesError) {
      // Pages scan failed
      console.error('[Facebook Scan] Pages scan failed:', pagesError)
    }

    const totalImages = allScanned.reduce((sum, post) => sum + post.images.length, 0)
    console.log(`[Facebook Scan] Total: ${allScanned.length} posts, ${totalImages} images`)
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
      console.error('[Twitter Scan] Invalid userId. Twitter requires a specific User ID, not "me".')
      console.error('[Twitter Scan] Current userId:', userId)
      console.error('[Twitter Scan] Please ensure the Twitter account was connected properly via OAuth and userId was retrieved.')
      return []
    }

    console.log(`[Twitter Scan] Starting scan for userId: ${userId}`)
    console.log(`[Twitter Scan] Using server-side API to avoid CORS issues`)

    // Use server-side API route to proxy Twitter API calls (avoids CORS issues)
    // Twitter API doesn't allow browser requests, so we need to go through our server
    const response = await fetch('/api/scan-twitter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        userId,
      }),
    })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `HTTP ${response.status}`
        const errorStatus = errorData.status || response.status
        
        console.error(`[Twitter Scan] Server API Error (${errorStatus}):`, errorMessage)
        console.error(`[Twitter Scan] Error details:`, errorData.details || errorData)
        
        // Common issues:
        if (errorStatus === 403) {
          console.error('[Twitter Scan] 403 Forbidden - This usually means:')
          console.error('1. The token does not have tweet.read permission')
          console.error('2. The app does not have "Read and write" permissions enabled')
          console.error('3. The userId might be incorrect or not accessible with this token')
          throw new Error(`Twitter API error: ${errorMessage}`)
        } else if (errorStatus === 401) {
          console.error('[Twitter Scan] 401 Unauthorized - Token is expired or invalid')
          console.error('[Twitter Scan] Solution: Disconnect Twitter in Settings → Social Accounts, then reconnect using the OAuth popup to get a new token.')
          throw new Error(`Twitter token expired or invalid. Please disconnect and reconnect Twitter in Settings using the OAuth popup to refresh your token.`)
        } else if (errorStatus === 404) {
          console.error('[Twitter Scan] 404 Not Found - User ID might be incorrect or user does not exist')
          throw new Error(`Twitter API error: ${errorMessage}`)
        } else if (errorStatus === 429) {
          const waitMinutes = errorData.rateLimit?.waitMinutes || 15
          console.error(`[Twitter Scan] 429 Rate Limit - Too many requests. Free tier allows 1 request per 15 minutes, and 100 posts per MONTH total.`)
          console.error(`[Twitter Scan] Wait ${waitMinutes} minute(s) before scanning again.`)
          console.error('[Twitter Scan] Free tier limit: 100 posts per month total. Each scan fetches 10 tweets. Consider upgrading to Basic tier ($200/month) for more requests.')
          // Throw a special error that includes rate limit info, but can be caught and handled gracefully
          const rateLimitError: any = new Error(`Twitter rate limit: Please wait ${waitMinutes} minute(s) before scanning again. Free tier allows 1 request per 15 minutes.`)
          rateLimitError.isRateLimit = true
          rateLimitError.waitMinutes = waitMinutes
          throw rateLimitError
        }
        
        throw new Error(`Twitter API error: ${errorMessage}`)
      }

    const data = await response.json()

    if (!data.tweets || data.tweets.length === 0) {
      console.log('[Twitter Scan] No tweets found for this user (user might have no tweets, or all are replies/retweets)')
      return []
    }

    console.log(`[Twitter Scan] Found ${data.tweets.length} tweets from server API`)

    const scanned: ScannedContent[] = []

    for (const tweet of data.tweets) {
      // Analyze content style
      let styleAnalysis: StyleAnalysis | undefined
      if (tweet.text && tweet.text.trim().length > 0) {
        styleAnalysis = analyzeContent(tweet.text)
      }

      scanned.push({
        id: tweet.id,
        platform: 'twitter',
        content: tweet.text || '',
        images: tweet.images || [],
        createdAt: tweet.createdAt,
        engagement: tweet.engagement,
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
    console.log('[LinkedIn Scan] Starting LinkedIn scan')
    console.log('[LinkedIn Scan] Using server-side API to avoid CORS issues')

    // Use server-side API route to proxy LinkedIn API calls (avoids CORS issues)
    // LinkedIn API doesn't allow direct browser requests, so we need to go through our server
    const response = await fetch('/api/scan-linkedin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `HTTP ${response.status}`
      const errorStatus = errorData.status || response.status
      
      console.error(`[LinkedIn Scan] Server API Error (${errorStatus}):`, errorMessage)
      console.error(`[LinkedIn Scan] Error details:`, errorData.details || errorData)
      
      // Common issues:
      if (errorStatus === 401) {
        console.error('[LinkedIn Scan] 401 Unauthorized - Token is expired or invalid')
        console.error('[LinkedIn Scan] Solution: Disconnect LinkedIn in Settings → Social Accounts, then reconnect using the OAuth popup to get a new token.')
        throw new Error(`LinkedIn token expired or invalid. Please disconnect and reconnect LinkedIn in Settings using the OAuth popup to refresh your token.`)
      } else if (errorStatus === 403) {
        console.error('[LinkedIn Scan] 403 Forbidden - Token does not have required permissions')
        console.error('[LinkedIn Scan] Solution: Ensure you granted all required scopes (openid, profile, email, w_member_social) during OAuth.')
        throw new Error(`LinkedIn token does not have required permissions. Please disconnect and reconnect LinkedIn to grant all required scopes.`)
      } else if (errorStatus === 429) {
        console.error('[LinkedIn Scan] 429 Rate Limit - Too many requests')
        // LinkedIn has very generous rate limits (100K calls/day), but we should still handle this gracefully
        const rateLimitError: any = new Error(`LinkedIn API rate limit exceeded. Please try again later.`)
        rateLimitError.isRateLimit = true
        throw rateLimitError
      }
      
      throw new Error(`LinkedIn API error: ${errorMessage}`)
    }

    const data = await response.json()

    if (!data.posts || data.posts.length === 0) {
      console.log('[LinkedIn Scan] No posts found. Note: UGC Posts API only returns posts created via LinkedIn API, not regular activity posts created via the LinkedIn website/app.')
      return []
    }

    console.log(`[LinkedIn Scan] Found ${data.posts.length} posts from server API`)

    const scanned: ScannedContent[] = []

    for (const post of data.posts) {
      // Analyze content style
      let styleAnalysis: StyleAnalysis | undefined
      if (post.content && post.content.trim().length > 0) {
        styleAnalysis = analyzeContent(post.content)
      }

      scanned.push({
        id: post.id,
        platform: 'linkedin',
        content: post.content,
        images: post.images || [],
        createdAt: post.createdAt,
        styleAnalysis,
      })
    }

    console.log(`[LinkedIn Scan] Successfully scanned ${scanned.length} posts`)
    if (scanned.length === 0) {
      console.warn('[LinkedIn Scan] No posts found. Note: UGC Posts API only returns posts created via LinkedIn API, not regular activity posts created via the LinkedIn website/app.')
    }

    return scanned
  } catch (error: any) {
    console.error('[LinkedIn Scan] Error scanning LinkedIn account:', error)
    console.error('[LinkedIn Scan] Error message:', error.message)
    
    // Handle rate limit errors gracefully (don't fail entire scan)
    if (error.isRateLimit) {
      console.warn('[LinkedIn Scan] Rate limit reached. Skipping LinkedIn scan, continuing with other platforms.')
      return []
    }
    
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

    // Instagram Graph API - get user media (limit to 10 for free-tier optimization)
    const response = await fetch(
      `https://graph.instagram.com/${userId}/media?access_token=${accessToken}&limit=10&fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count`,
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
            try {
              scanned = await scanTwitterAccount(account.accessToken, account.userId)
              console.log(`[Auto Scanner] Twitter scan completed: ${scanned.length} items found`)
            } catch (error: any) {
              // Handle Twitter rate limit errors gracefully (don't fail entire scan)
              if (error.isRateLimit || error.message?.includes('429') || error.message?.includes('Rate Limit') || error.message?.includes('rate limit')) {
                const waitMinutes = error.waitMinutes || 15
                console.warn(`[Auto Scanner] Twitter rate limit reached (free tier: 1 request per 15 minutes). Wait ${waitMinutes} minute(s). Skipping Twitter scan, continuing with other platforms.`)
                // Return empty array so other platforms can still scan
                scanned = []
              } else {
                // Re-throw other errors
                throw error
              }
            }
          }
          break
        case 'linkedin':
          console.log(`[Auto Scanner] Scanning LinkedIn account`)
          scanned = await scanLinkedInAccount(account.accessToken)
          console.log(`[Auto Scanner] LinkedIn scan completed: ${scanned.length} items found`)
          if (scanned.length === 0) {
            console.warn('[Auto Scanner] LinkedIn returned 0 posts. Note: UGC Posts API only returns posts created via LinkedIn API, not regular activity posts.')
          }
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
      let platformImages = 0
      for (const item of scanned) {
        allContent.push(item)

        // Extract images
        for (const imageUrl of item.images) {
          allImages.push({
            url: imageUrl,
            platform: item.platform,
            sourceId: item.id,
          })
          platformImages++
        }

        // Collect style analyses
        if (item.styleAnalysis) {
          allStyleAnalyses.push(item.styleAnalysis)
        }
      }
      
      if (platformImages > 0) {
        console.log(`[Auto Scanner] ${account.platform} found ${platformImages} images from ${scanned.length} posts`)
      } else if (scanned.length > 0) {
        console.log(`[Auto Scanner] ${account.platform} found ${scanned.length} posts but no images`)
      }
    } catch (error) {
      console.error(`[Auto Scanner] Error scanning ${account.platform}:`, error)
      console.error(`[Auto Scanner] Error details:`, error instanceof Error ? error.message : String(error))
    }
  }

  // Log summary
  const imagesByPlatform = allImages.reduce((acc, img) => {
    acc[img.platform] = (acc[img.platform] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log('[Auto Scanner] Scan summary:', {
    totalContent: allContent.length,
    totalImages: allImages.length,
    imagesByPlatform,
    totalStyleAnalyses: allStyleAnalyses.length,
    platformsScanned: Object.keys(imagesByPlatform)
  })

  return {
    content: allContent,
    images: allImages,
    styleAnalyses: allStyleAnalyses,
  }
}
