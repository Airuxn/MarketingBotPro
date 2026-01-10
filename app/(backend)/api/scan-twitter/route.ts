import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { accessToken, userId } = await request.json()

    if (!accessToken || !userId) {
      return NextResponse.json(
        { error: 'Access token and userId are required' },
        { status: 400 }
      )
    }

    // Validate userId - Twitter User ID should not be 'me' or empty
    if (!userId || userId === 'me' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid userId. Twitter requires a specific User ID, not "me".' },
        { status: 400 }
      )
    }

    console.log(`[Scan Twitter API] Starting scan for userId: ${userId}`)

    // Twitter API v2 - get user tweets
    // Note: Using userId from the connected account (not 'me' endpoint)
    const apiUrl = `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=created_at,text,public_metrics,attachments&expansions=attachments.media_keys&media.fields=url,preview_image_url,type&exclude=replies,retweets`
    
    console.log(`[Scan Twitter API] Calling Twitter API for userId: ${userId}`)
    
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.errors?.[0]?.detail || errorData.title || `HTTP ${response.status}`
      const errorType = errorData.errors?.[0]?.type || 'unknown'
      
      console.error(`[Scan Twitter API] Twitter API Error (${response.status}):`, errorMessage)
      console.error(`[Scan Twitter API] Error type:`, errorType)
      console.error(`[Scan Twitter API] Full error data:`, JSON.stringify(errorData, null, 2))
      
      // Common issues:
      if (response.status === 403) {
        return NextResponse.json(
          {
            error: '403 Forbidden - Token may not have tweet.read permission, or app does not have "Read and write" permissions enabled',
            status: 403,
            details: errorMessage,
          },
          { status: 403 }
        )
      } else if (response.status === 401) {
        return NextResponse.json(
          {
            error: '401 Unauthorized - Token might be expired or invalid',
            status: 401,
            details: errorMessage,
          },
          { status: 401 }
        )
      } else if (response.status === 404) {
        return NextResponse.json(
          {
            error: '404 Not Found - User ID might be incorrect or user does not exist',
            status: 404,
            details: errorMessage,
          },
          { status: 404 }
        )
      } else if (response.status === 429) {
        return NextResponse.json(
          {
            error: '429 Rate Limit - Too many requests. Please wait before scanning again.',
            status: 429,
            details: errorMessage,
          },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        {
          error: `Twitter API error: ${errorMessage}`,
          status: response.status,
          details: errorData,
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.errors && data.errors.length > 0) {
      const errorDetail = data.errors[0].detail || data.errors[0].title || 'Unknown error'
      console.error('[Scan Twitter API] Twitter API returned errors:', JSON.stringify(data.errors, null, 2))
      return NextResponse.json(
        {
          error: `Twitter API error: ${errorDetail}`,
          details: data.errors,
        },
        { status: 400 }
      )
    }

    if (!data.data || data.data.length === 0) {
      console.log('[Scan Twitter API] No tweets found for this user (user might have no tweets, or all are replies/retweets)')
      return NextResponse.json({
        tweets: [],
        media: [],
      })
    }

    console.log(`[Scan Twitter API] Found ${data.data.length} tweets`)

    const tweets = data.data || []
    const mediaMap = new Map<string, string>()

    // Map media (only images, not videos)
    if (data.includes?.media) {
      console.log(`[Scan Twitter API] Found ${data.includes.media.length} media items`)
      for (const media of data.includes.media) {
        // Only include images, skip videos
        if (media.type === 'photo' && (media.url || media.preview_image_url)) {
          mediaMap.set(media.media_key, media.url || media.preview_image_url)
        }
      }
    }

    // Map tweets with media
    const tweetsWithMedia = tweets.map((tweet: any) => {
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

      return {
        id: tweet.id,
        text: tweet.text || '',
        createdAt: tweet.created_at,
        engagement: {
          likes: tweet.public_metrics?.like_count,
          comments: tweet.public_metrics?.reply_count,
          shares: tweet.public_metrics?.retweet_count,
        },
        images,
      }
    })

    console.log(`[Scan Twitter API] Successfully scanned ${tweetsWithMedia.length} tweets with media`)
    return NextResponse.json({
      tweets: tweetsWithMedia,
      media: Array.from(mediaMap.values()),
    })
  } catch (error: any) {
    console.error('[Scan Twitter API] Error scanning Twitter account:', error)
    console.error('[Scan Twitter API] Error message:', error.message)
    return NextResponse.json(
      {
        error: error.message || 'Failed to scan Twitter account',
        details: error,
      },
      { status: 500 }
    )
  }
}
