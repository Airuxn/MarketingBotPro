/**
 * Post Publisher
 * Automatically publishes posts to social media platforms
 */

import { Post } from './store'

interface SocialAccount {
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram'
  accessToken: string
  userId?: string
  connected: boolean
}

/**
 * Post to Twitter/X
 * Uses server-side API to avoid CORS issues (Twitter API doesn't allow browser requests)
 */
async function postToTwitter(
  content: string,
  accessToken: string,
  mediaUrl?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    console.log('[Post Publisher] Publishing to Twitter via server-side API')
    
    // Use server-side API route to proxy Twitter API calls (avoids CORS issues)
    // Twitter API doesn't allow browser requests, so we need to go through our server
    const response = await fetch('/api/publish-twitter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        content,
        mediaUrl,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `HTTP ${response.status}`
      const errorStatus = errorData.status || response.status
      
      console.error(`[Post Publisher] Server API Error (${errorStatus}):`, errorMessage)
      console.error(`[Post Publisher] Error details:`, errorData.details || errorData)
      
      // Common issues:
      if (errorStatus === 403) {
        return { 
          success: false, 
          error: '403 Forbidden - Token may not have tweet.write permission, or app does not have "Read and write" permissions enabled' 
        }
      } else if (errorStatus === 401) {
        return { 
          success: false, 
          error: '401 Unauthorized - Token might be expired or invalid. Please reconnect your Twitter account.' 
        }
      } else if (errorStatus === 429) {
        return { 
          success: false, 
          error: '429 Rate Limit - Too many requests. Free tier allows limited posts per day. Please wait before trying again.' 
        }
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()

    if (!data.success) {
      return { success: false, error: data.error || 'Failed to post to Twitter' }
    }

    console.log('[Post Publisher] Successfully published tweet:', data.postId)
    return { success: true, postId: data.postId || data.tweetId }
  } catch (error: any) {
    console.error('[Post Publisher] Twitter post error:', error)
    return { success: false, error: error.message || 'Failed to post to Twitter' }
  }
}

/**
 * Post to Facebook
 */
async function postToFacebook(
  content: string,
  accessToken: string,
  mediaUrl?: string,
  pageId?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const targetId = pageId || 'me'
    const apiUrl = `https://graph.facebook.com/v18.0/${targetId}/feed`

    const params = new URLSearchParams({
      message: content,
      access_token: accessToken,
    })

    if (mediaUrl) {
      // For images, use photos endpoint
      const photoUrl = `https://graph.facebook.com/v18.0/${targetId}/photos`
      const photoParams = new URLSearchParams({
        url: mediaUrl,
        message: content,
        access_token: accessToken,
      })

      const photoResponse = await fetch(`${photoUrl}?${photoParams}`)
      if (photoResponse.ok) {
        const photoData = await photoResponse.json()
        return { success: true, postId: photoData.id }
      }
    }

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to post to Facebook')
    }

    const data = await response.json()
    return { success: true, postId: data.id }
  } catch (error: any) {
    console.error('Facebook post error:', error)
    return { success: false, error: error.message || 'Failed to post to Facebook' }
  }
}

/**
 * Post to LinkedIn
 */
async function postToLinkedIn(
  content: string,
  accessToken: string,
  mediaUrl?: string,
  userId?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // LinkedIn requires person URN in format: urn:li:person:{personId}
    // The userId from OAuth is the person ID (from userinfo.sub)
    if (!userId) {
      throw new Error('LinkedIn user ID is required to post. Please reconnect your LinkedIn account.')
    }

    const apiUrl = 'https://api.linkedin.com/v2/ugcPosts'

    // Construct the person URN from userId
    const author = `urn:li:person:${userId}`

    const payload: any = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: mediaUrl ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }

    // Add media if provided
    if (mediaUrl) {
      payload.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          media: mediaUrl,
        },
      ]
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      const errorMessage = errorData.message || errorData.error || `LinkedIn API error: ${response.status}`
      
      if (response.status === 401) {
        throw new Error('LinkedIn token expired or invalid. Please reconnect your LinkedIn account.')
      } else if (response.status === 403) {
        throw new Error('LinkedIn token does not have posting permissions. Please ensure you granted w_member_social scope.')
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    return { success: true, postId: data.id }
  } catch (error: any) {
    console.error('LinkedIn post error:', error)
    return { success: false, error: error.message || 'Failed to post to LinkedIn' }
  }
}

/**
 * Post to Instagram
 */
async function postToInstagram(
  content: string,
  mediaUrl: string,
  accessToken: string,
  userId?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Instagram requires a two-step process:
    // 1. Create media container
    // 2. Publish the container
    
    if (!mediaUrl) {
      return { success: false, error: 'Instagram posts require an image' }
    }

    const targetUserId = userId || 'me'
    
    // Step 1: Create media container
    const containerUrl = `https://graph.instagram.com/v18.0/${targetUserId}/media`
    const containerParams = new URLSearchParams({
      image_url: mediaUrl,
      caption: content,
      access_token: accessToken,
    })

    const containerResponse = await fetch(`${containerUrl}?${containerParams}`, {
      method: 'POST',
    })

    if (!containerResponse.ok) {
      const error = await containerResponse.json()
      throw new Error(error.error?.message || 'Failed to create Instagram media container')
    }

    const containerData = await containerResponse.json()
    const creationId = containerData.id

    // Step 2: Publish the container
    const publishUrl = `https://graph.instagram.com/v18.0/${targetUserId}/media_publish`
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    })

    // Wait a bit for Instagram to process the image
    await new Promise(resolve => setTimeout(resolve, 2000))

    const publishResponse = await fetch(`${publishUrl}?${publishParams}`, {
      method: 'POST',
    })

    if (!publishResponse.ok) {
      const error = await publishResponse.json()
      throw new Error(error.error?.message || 'Failed to publish Instagram post')
    }

    const publishData = await publishResponse.json()
    return { success: true, postId: publishData.id }
  } catch (error: any) {
    console.error('Instagram post error:', error)
    return { success: false, error: error.message || 'Failed to post to Instagram' }
  }
}

/**
 * Main function to publish a post to the appropriate platform
 */
export async function publishPost(
  post: Post,
  socialAccounts: SocialAccount[]
): Promise<{ success: boolean; postId?: string; error?: string }> {
  // Find the connected account for this platform
  const account = socialAccounts.find(
    acc => acc.platform === post.platform && acc.connected && acc.accessToken
  )

  if (!account) {
    return {
      success: false,
      error: `No connected account found for ${post.platform}. Please connect your account in Settings.`,
    }
  }

  const mediaUrl = post.media?.file?.startsWith('http') 
    ? post.media.file 
    : undefined // Base64 images would need to be uploaded first

  try {
    switch (post.platform) {
      case 'twitter':
        return await postToTwitter(post.content, account.accessToken, mediaUrl)
      
      case 'facebook':
        return await postToFacebook(post.content, account.accessToken, mediaUrl, account.userId)
      
      case 'linkedin':
        return await postToLinkedIn(post.content, account.accessToken, mediaUrl, account.userId)
      
      case 'instagram':
        if (!post.media?.file) {
          return { success: false, error: 'Instagram posts require an image' }
        }
        return await postToInstagram(post.content, post.media.file, account.accessToken, account.userId)
      
      default:
        return { success: false, error: `Unsupported platform: ${post.platform}` }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to publish post' }
  }
}
