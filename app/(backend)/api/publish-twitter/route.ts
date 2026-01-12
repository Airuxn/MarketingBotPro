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
      hasAccessToken: !!accessToken,
    })

    // First, verify the token is valid and can access user info (confirms it's User Context, not Application-Only)
    console.log('[Publish Twitter API] Verifying token is User Context (not Application-Only)...')
    const verifyResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!verifyResponse.ok) {
      const verifyError = await verifyResponse.json().catch(() => ({}))
      console.error('[Publish Twitter API] Token verification failed:', verifyResponse.status, verifyError)
      return NextResponse.json(
        {
          error: `Token verification failed: ${verifyError.errors?.[0]?.detail || verifyError.title || 'Token is invalid or not User Context'}`,
          status: verifyResponse.status,
          details: verifyError,
        },
        { status: verifyResponse.status }
      )
    }

    const verifyData = await verifyResponse.json()
    console.log('[Publish Twitter API] Token is valid User Context token:', {
      userId: verifyData.data?.id,
      username: verifyData.data?.username,
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

    console.log('[Publish Twitter API] Calling Twitter API to create tweet with User Context token')
    
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
      const errorMessage = errorData.errors?.[0]?.detail || errorData.errors?.[0]?.message || errorData.title || `HTTP ${response.status}`
      const errorType = errorData.errors?.[0]?.type || 'unknown'
      const errorCode = errorData.errors?.[0]?.code || null
      
      console.error(`[Publish Twitter API] Twitter API Error (${response.status}):`, errorMessage)
      console.error(`[Publish Twitter API] Error type:`, errorType)
      console.error(`[Publish Twitter API] Error code:`, errorCode)
      console.error(`[Publish Twitter API] Full error data:`, JSON.stringify(errorData, null, 2))
      
      // Common issues:
      if (response.status === 403) {
        // Check if it's the Application-Only error (this means token is wrong type)
        const isApplicationOnlyError = errorMessage.toLowerCase().includes('application-only') ||
                                       errorMessage.toLowerCase().includes('oauth 2.0 application-only')
        
        if (isApplicationOnlyError) {
          return NextResponse.json(
            {
              error: '403 Forbidden - Token is Application-Only (not User Context). This means the token was not obtained through the OAuth popup flow. Please disconnect and reconnect Twitter using the "Social" button (OAuth popup), not the "Token" button (manual token). OAuth popup flow is required for posting tweets.',
              status: 403,
              details: errorMessage,
              errorType,
              errorCode,
              solution: 'In Settings, disconnect Twitter, then click "Social" → "Connect" to use OAuth popup flow. Do NOT use the "Token" button for posting (only for reading). OAuth popup is required to get User Context token with write permission.',
            },
            { status: 403 }
          )
        }
        
        // Check if it's a permissions issue or tier restriction
        const isPermissionsIssue = errorMessage.toLowerCase().includes('permission') || 
                                   errorMessage.toLowerCase().includes('scope') ||
                                   errorMessage.toLowerCase().includes('forbidden') ||
                                   errorType === 'forbidden'
        
        if (isPermissionsIssue) {
          return NextResponse.json(
            {
              error: '403 Forbidden - Token does not have tweet.write permission. This is NOT a free tier limitation (free tier allows posting). Please ensure: 1) Your Twitter app has "Read and write" permissions enabled (not just "Read") in Twitter Developer Portal → App Settings, 2) Disconnect and reconnect Twitter using OAuth popup ("Social" button) in Settings to get a new token with write permission',
              status: 403,
              details: errorMessage,
              errorType,
              errorCode,
              solution: 'Go to Twitter Developer Portal → Your App → App Settings → User authentication settings → Enable "Read and write" permissions (not "Read" only), then disconnect and reconnect Twitter using OAuth popup ("Social" button) in Settings',
            },
            { status: 403 }
          )
        } else {
          // Other 403 reasons (might be tier-related for some endpoints, but not for posting)
          return NextResponse.json(
            {
              error: `403 Forbidden - ${errorMessage}. Free tier DOES support posting tweets (up to 50 per day). This might be a permissions issue - please check your app settings and ensure you're using OAuth popup flow, not manual token.`,
              status: 403,
              details: errorMessage,
              errorType,
              errorCode,
            },
            { status: 403 }
          )
        }
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
