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
    
    // Try to scan Pages first (most reliable for Business accounts)
    // Pages usually have more posts and better permissions
    try {
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token`,
        {
          method: 'GET',
        }
      )

      const pagesData = await pagesResponse.json()

      if (pagesData.error) {
        console.warn('Facebook Pages API error:', pagesData.error)
      } else if (pagesData.data && pagesData.data.length > 0) {
        console.log(`Found ${pagesData.data.length} Facebook pages, scanning posts...`)
        
        // Scan each page
        for (const page of pagesData.data) {
          try {
            const pageToken = page.access_token || accessToken
            
            // Try multiple post endpoints and field combinations
            const endpoints = [
              // Standard posts endpoint
              `https://graph.facebook.com/v18.0/${page.id}/posts?access_token=${pageToken}&fields=id,message,created_time,full_picture,attachments{media{image{src}},type},likes.summary(true),comments.summary(true),shares&limit=50`,
              // Feed endpoint (alternative)
              `https://graph.facebook.com/v18.0/${page.id}/feed?access_token=${pageToken}&fields=id,message,created_time,full_picture,attachments{media{image{src}},type},likes.summary(true),comments.summary(true),shares&limit=50`,
            ]
            
            for (const endpoint of endpoints) {
              try {
                const response = await fetch(endpoint, { method: 'GET' })
                const data = await response.json()

                if (data.error) {
                  console.warn(`Page ${page.name} (${page.id}) API error:`, data.error)
                  continue
                }

                if (data.data && data.data.length > 0) {
                  console.log(`Found ${data.data.length} posts from page ${page.name}`)
                  
                  for (const post of data.data) {
                    const images: string[] = []
                    
                    // Extract full_picture if available (single image posts)
                    if (post.full_picture) {
                      images.push(post.full_picture)
                    }
                    
                    // Extract images from attachments
                    if (post.attachments?.data) {
                      for (const attachment of post.attachments.data) {
                        if (attachment.type === 'photo' || attachment.type === 'album') {
                          if (attachment.media?.image?.src) {
                            images.push(attachment.media.image.src)
                          }
                          // Some posts have subattachments
                          if (attachment.subattachments?.data) {
                            for (const sub of attachment.subattachments.data) {
                              if (sub.media?.image?.src) {
                                images.push(sub.media.image.src)
                              }
                            }
                          }
                        }
                      }
                    }

                    // Only add if post has content or images
                    if (post.message || images.length > 0) {
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
                          likes: post.likes?.summary?.total_count || post.likes?.summary?.can_like ? 0 : undefined,
                          comments: post.comments?.summary?.total_count || post.comments?.summary?.can_comment ? 0 : undefined,
                          shares: post.shares?.count,
                        },
                        styleAnalysis,
                      })
                    }
                  }
                  
                  // If we found posts, break (don't try other endpoints)
                  if (data.data.length > 0) break
                }
              } catch (endpointError: any) {
                console.warn(`Error scanning page ${page.name} with endpoint:`, endpointError.message)
                continue
              }
            }
          } catch (pageError: any) {
            console.warn(`Error scanning page ${page.name}:`, pageError.message)
            continue
          }
        }
      }
    } catch (pagesError: any) {
      console.warn('Facebook Pages scan failed:', pagesError.message)
    }
    
    // If we didn't find anything from pages, try personal posts
    if (allScanned.length === 0) {
      try {
        console.log('Trying personal posts endpoint...')
        const response = await fetch(
          `https://graph.facebook.com/v18.0/me/posts?access_token=${accessToken}&fields=id,message,created_time,full_picture,attachments{media{image{src}},type},likes.summary(true),comments.summary(true),shares&limit=50`,
          {
            method: 'GET',
          }
        )

        const data = await response.json()

        if (data.error) {
          console.warn('Personal posts API error:', data.error)
        } else if (data.data && data.data.length > 0) {
          console.log(`Found ${data.data.length} personal posts`)
          
          for (const post of data.data) {
            const images: string[] = []
            
            if (post.full_picture) {
              images.push(post.full_picture)
            }
            
            if (post.attachments?.data) {
              for (const attachment of post.attachments.data) {
                if (attachment.type === 'photo' || attachment.type === 'album') {
                  if (attachment.media?.image?.src) {
                    images.push(attachment.media.image.src)
                  }
                }
              }
            }

            if (post.message || images.length > 0) {
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
        }
      } catch (personalError: any) {
        console.warn('Personal posts scan failed:', personalError.message)
      }
    }


    return allScanned
  } catch (error: any) {
    console.error('Facebook scan error:', error)
    return []
  }
}

export async function scanTwitterAccount(accessToken: string, userId: string): Promise<ScannedContent[]> {
  try {
    // Twitter API v2 - get user tweets (get more to ensure we have enough images)
    const response = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=created_at,public_metrics,attachments&expansions=attachments.media_keys&media.fields=url,preview_image_url,type`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const data = await response.json()

    if (data.errors) {
      throw new Error(data.errors[0].detail)
    }

    const scanned: ScannedContent[] = []
    const mediaMap = new Map()

    // Map media (only images, not videos)
    if (data.includes?.media) {
      for (const media of data.includes.media) {
        // Only include images, skip videos
        if (media.type === 'photo' && (media.url || media.preview_image_url)) {
          mediaMap.set(media.media_key, media.url || media.preview_image_url)
        }
      }
    }

    for (const tweet of data.data || []) {
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

    return scanned
  } catch (error: any) {
    console.error('Twitter scan error:', error)
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
      console.error('Current userId:', userId)
      return []
    }

    console.log(`Scanning Instagram account with ID: ${userId}`)

    // Try Instagram Graph API first (requires Long-Lived Token or valid Business Account token)
    try {
      const response = await fetch(
        `https://graph.instagram.com/${userId}/media?access_token=${accessToken}&limit=100&fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count`,
        {
          method: 'GET',
        }
      )

      const data = await response.json()

      if (data.error) {
        console.warn('Instagram Graph API error:', data.error)
        // Try Facebook Graph API as fallback
        throw new Error(`Instagram API error: ${data.error.message || 'Unknown error'}`)
      }

      if (!data.data || data.data.length === 0) {
        console.warn('Instagram Graph API returned no media')
        return []
      }

      console.log(`Found ${data.data.length} Instagram media items`)
      const scanned: ScannedContent[] = []

      for (const media of data.data) {
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
          // For carousels, try to get children
          try {
            const childrenResponse = await fetch(
              `https://graph.instagram.com/${media.id}/children?access_token=${accessToken}&fields=id,media_type,media_url,thumbnail_url`,
              { method: 'GET' }
            )
            const childrenData = await childrenResponse.json()
            
            if (childrenData.data) {
              for (const child of childrenData.data) {
                if (child.media_type === 'IMAGE' && child.media_url) {
                  images.push(child.media_url)
                } else if (child.media_type === 'VIDEO' && child.thumbnail_url) {
                  images.push(child.thumbnail_url)
                }
              }
            }
            
            // Fallback to main media_url if no children found
            if (images.length === 0 && media.media_url) {
              images.push(media.media_url)
            }
          } catch (carouselError) {
            // If carousel children fetch fails, use main media_url
            if (media.media_url) {
              images.push(media.media_url)
            }
          }
        }

        // Only add if has content or images
        if (media.caption || images.length > 0) {
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
      }

      return scanned
    } catch (instagramError: any) {
      console.warn('Instagram Graph API failed, trying Facebook Graph API...', instagramError.message)
      
      // Fallback: Try Facebook Graph API (works with Page-token)
      // Get Instagram Business Account from Facebook Pages
      try {
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,instagram_business_account{id,username}`,
          { method: 'GET' }
        )
        
        const pagesData = await pagesResponse.json()
        
        if (pagesData.data) {
          for (const page of pagesData.data) {
            if (page.instagram_business_account?.id === userId) {
              // Found matching Instagram account, try Facebook API endpoint
              console.log(`Found matching Instagram account via Facebook Page: ${page.name}`)
              
              // Try to get media via Facebook Graph API
              const fbMediaResponse = await fetch(
                `https://graph.facebook.com/v18.0/${userId}/media?access_token=${accessToken}&fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count&limit=100`,
                { method: 'GET' }
              )
              
              const fbMediaData = await fbMediaResponse.json()
              
              if (fbMediaData.error) {
                console.warn('Facebook Graph API Instagram media error:', fbMediaData.error)
                return []
              }
              
              if (fbMediaData.data && fbMediaData.data.length > 0) {
                console.log(`Found ${fbMediaData.data.length} Instagram media via Facebook API`)
                const scanned: ScannedContent[] = []
                
                for (const media of fbMediaData.data) {
                  const images: string[] = []
                  
                  if (media.media_type === 'IMAGE' && media.media_url) {
                    images.push(media.media_url)
                  } else if (media.media_type === 'VIDEO' && media.thumbnail_url) {
                    images.push(media.thumbnail_url)
                  } else if (media.media_type === 'CAROUSEL_ALBUM' && media.media_url) {
                    images.push(media.media_url)
                  }
                  
                  if (media.caption || images.length > 0) {
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
                }
                
                return scanned
              }
            }
          }
        }
      } catch (facebookError: any) {
        console.warn('Facebook Graph API fallback failed:', facebookError.message)
      }
      
      return []
    }
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
    if (!account.connected || !account.accessToken) continue

    try {
      let scanned: ScannedContent[] = []

      switch (account.platform) {
        case 'facebook':
          scanned = await scanFacebookAccount(account.accessToken, account.userId || 'me')
          break
        case 'twitter':
          scanned = await scanTwitterAccount(account.accessToken, account.userId || 'me')
          break
        case 'linkedin':
          scanned = await scanLinkedInAccount(account.accessToken)
          break
        case 'instagram':
          // Instagram requires Instagram Business Account ID, not 'me'
          if (account.userId && account.userId !== 'me') {
            console.log(`Scanning Instagram account with userId: ${account.userId}`)
            scanned = await scanInstagramAccount(account.accessToken, account.userId)
            console.log(`Instagram scan completed: ${scanned.length} items found`)
          } else {
            console.warn('Instagram account missing userId (Instagram Business Account ID). Skipping scan.')
            console.warn('This usually means:')
            console.warn('1. Instagram account is not a Business/Creator account, OR')
            console.warn('2. Instagram account is not connected to a Facebook Page, OR')
            console.warn('3. The OAuth callback failed to retrieve the Instagram Business Account ID')
            console.warn('Try disconnecting and reconnecting Instagram.')
          }
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

  return {
    content: allContent,
    images: allImages,
    styleAnalyses: allStyleAnalyses,
  }
}
