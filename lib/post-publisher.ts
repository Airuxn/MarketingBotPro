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
 */
async function postToTwitter(
  content: string,
  accessToken: string,
  mediaUrl?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Twitter API v2 endpoint
    const apiUrl = 'https://api.twitter.com/2/tweets'
    
    const payload: any = {
      text: content,
    }

    // If media is provided, upload it first
    if (mediaUrl) {
      // Note: Media upload requires separate endpoint
      // For now, we'll post text-only or with media URL if supported
      // Full media upload implementation would require additional steps
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to post to Twitter')
    }

    const data = await response.json()
    return { success: true, postId: data.data?.id }
  } catch (error: any) {
    console.error('Twitter post error:', error)
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
  mediaUrl?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // LinkedIn requires URN format for posts
    // This is a simplified version - full implementation would require
    // getting user URN and proper API structure
    const apiUrl = 'https://api.linkedin.com/v2/ugcPosts'

    const payload = {
      author: `urn:li:person:${accessToken}`, // This would need actual person URN
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
      const error = await response.json()
      throw new Error(error.message || 'Failed to post to LinkedIn')
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
        return await postToLinkedIn(post.content, account.accessToken, mediaUrl)
      
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
