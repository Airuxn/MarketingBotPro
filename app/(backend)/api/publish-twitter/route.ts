import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { accessToken, content, mediaUrl } = await request.json()

    if (!accessToken || !content) {
      return NextResponse.json(
        { error: 'Access token and content are required' },
        { status: 400 }
      )
    }

    console.log('[Publish Twitter API] Publishing tweet:', {
      contentLength: content.length,
      hasMedia: !!mediaUrl,
    })

    // Twitter API v2 endpoint for creating tweets
    const apiUrl = 'https://api.twitter.com/2/tweets'
    
    const payload: any = {
      text: content,
    }

    // Note: Media upload requires separate endpoint (media/upload)
    // For now, we'll post text-only tweets
    // Full media upload implementation would require additional steps:
    // 1. Upload media to media/upload endpoint
    // 2. Get media_id from response
    // 3. Include media_ids in tweet payload
    if (mediaUrl) {
      console.log('[Publish Twitter API] Media URL provided, but media upload not yet implemented for server-side')
      // TODO: Implement media upload for Twitter
      // For now, we'll post text-only
    }

    console.log('[Publish Twitter API] Calling Twitter API to create tweet')
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.errors?.[0]?.detail || errorData.title || `HTTP ${response.status}`
      const errorType = errorData.errors?.[0]?.type || 'unknown'
      
      console.error(`[Publish Twitter API] Twitter API Error (${response.status}):`, errorMessage)
      console.error(`[Publish Twitter API] Error type:`, errorType)
      console.error(`[Publish Twitter API] Full error data:`, JSON.stringify(errorData, null, 2))
      
      // Common issues:
      if (response.status === 403) {
        return NextResponse.json(
          {
            error: '403 Forbidden - Token may not have tweet.write permission, or app does not have "Read and write" permissions enabled',
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
      } else if (response.status === 429) {
        return NextResponse.json(
          {
            error: '429 Rate Limit - Too many requests. Free tier allows limited posts per day.',
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
      console.error('[Publish Twitter API] Twitter API returned errors:', JSON.stringify(data.errors, null, 2))
      return NextResponse.json(
        {
          error: `Twitter API error: ${errorDetail}`,
          details: data.errors,
        },
        { status: 400 }
      )
    }

    if (!data.data || !data.data.id) {
      console.error('[Publish Twitter API] No tweet ID in response:', JSON.stringify(data, null, 2))
      return NextResponse.json(
        {
          error: 'Twitter API did not return a tweet ID',
          details: data,
        },
        { status: 500 }
      )
    }

    console.log(`[Publish Twitter API] Successfully published tweet: ${data.data.id}`)
    return NextResponse.json({
      success: true,
      postId: data.data.id,
      tweetId: data.data.id,
    })
  } catch (error: any) {
    console.error('[Publish Twitter API] Error publishing tweet:', error)
    console.error('[Publish Twitter API] Error message:', error.message)
    return NextResponse.json(
      {
        error: error.message || 'Failed to publish tweet',
        details: error,
      },
      { status: 500 }
    )
  }
}
