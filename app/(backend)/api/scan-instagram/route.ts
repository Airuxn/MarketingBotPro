import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { accessToken, userId } = await request.json()

    if (!accessToken || !userId) {
      return NextResponse.json(
        { error: 'Access token and userId are required' },
        { status: 400 }
      )
    }

    // Instagram Graph API requires Instagram Business Account ID (not Facebook user ID or 'me')
    if (!userId || userId === 'me') {
      return NextResponse.json(
        { error: 'Invalid userId. Instagram requires an Instagram Business Account ID, not "me" or Facebook user ID.' },
        { status: 400 }
      )
    }

    console.log('[Scan Instagram API] Starting scan for userId:', userId)
    console.log('[Scan Instagram API] Using server-side API to avoid CORS issues')

    // Instagram Graph API - get user media (limit to 10 for free-tier optimization)
    const response = await fetch(
      `https://graph.instagram.com/${userId}/media?access_token=${accessToken}&limit=10&fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count`,
      {
        method: 'GET',
      }
    )

    console.log('[Scan Instagram API] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Scan Instagram API] Error Response:', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      const status = response.status
      const errorMessage = errorData.error?.message || errorData.message || `Instagram API error: ${status}`

      if (status === 401) {
        console.error('[Scan Instagram API] 401 Unauthorized - Token is expired or invalid')
        return NextResponse.json(
          {
            error: 'Instagram token expired or invalid. Please disconnect and reconnect Instagram in Settings.',
            status: 401,
            details: errorMessage,
          },
          { status: 401 }
        )
      } else if (status === 403) {
        console.error('[Scan Instagram API] 403 Forbidden - Token does not have required permissions')
        return NextResponse.json(
          {
            error: 'Instagram token does not have required permissions. Please ensure you granted all required scopes during OAuth.',
            status: 403,
            details: errorMessage,
          },
          { status: 403 }
        )
      } else if (status === 429) {
        console.error('[Scan Instagram API] 429 Rate Limit - Too many requests')
        return NextResponse.json(
          {
            error: 'Instagram API rate limit exceeded. Please try again later.',
            status: 429,
            details: errorMessage,
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          error: errorMessage,
          status,
          details: errorData,
        },
        { status }
      )
    }

    const data = await response.json()

    if (data.error) {
      console.error('[Scan Instagram API] Instagram API error:', data.error)
      return NextResponse.json(
        {
          error: data.error.message || 'Instagram API error',
          status: 400,
          details: data.error,
        },
        { status: 400 }
      )
    }

    console.log('[Scan Instagram API] Found', data.data?.length || 0, 'media items')

    // Transform Instagram media to our format
    const media = (data.data || []).map((item: any) => {
      const images: string[] = []
      
      if (item.media_type === 'IMAGE' && item.media_url) {
        images.push(item.media_url)
      } else if (item.media_type === 'VIDEO') {
        // For videos, use thumbnail_url (if available) or media_url
        if (item.thumbnail_url) {
          images.push(item.thumbnail_url)
        } else if (item.media_url) {
          images.push(item.media_url)
        }
      } else if (item.media_type === 'CAROUSEL_ALBUM') {
        // Would need additional API call to get carousel items
        if (item.media_url) {
          images.push(item.media_url)
        }
      }

      return {
        id: item.id,
        caption: item.caption || '',
        images,
        createdAt: item.timestamp,
        engagement: {
          likes: item.like_count,
          comments: item.comments_count,
        },
      }
    })

    return NextResponse.json({ media })
  } catch (error: any) {
    console.error('[Scan Instagram API] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to scan Instagram account',
        status: 500,
        details: error,
      },
      { status: 500 }
    )
  }
}
