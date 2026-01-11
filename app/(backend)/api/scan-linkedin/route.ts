import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    console.log('[Scan LinkedIn API] Starting scan')
    console.log('[Scan LinkedIn API] Using server-side API to avoid CORS issues')

    // LinkedIn API - get user posts (UGC Posts only - posts created via API)
    // Note: This endpoint only returns UGC posts, not regular activity posts
    const response = await fetch(
      'https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(me)&count=10',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    )

    console.log('[Scan LinkedIn API] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Scan LinkedIn API] Error Response:', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      const status = response.status
      const errorMessage = errorData.message || errorData.error || `LinkedIn API error: ${status}`

      if (status === 401) {
        console.error('[Scan LinkedIn API] 401 Unauthorized - Token is expired or invalid')
        return NextResponse.json(
          {
            error: 'LinkedIn token expired or invalid. Please disconnect and reconnect LinkedIn in Settings.',
            status: 401,
          },
          { status: 401 }
        )
      } else if (status === 403) {
        console.error('[Scan LinkedIn API] 403 Forbidden - Token does not have required permissions')
        return NextResponse.json(
          {
            error: 'LinkedIn token does not have required permissions. Please ensure you granted all required scopes during OAuth.',
            status: 403,
          },
          { status: 403 }
        )
      } else if (status === 429) {
        console.error('[Scan LinkedIn API] 429 Rate Limit - Too many requests')
        return NextResponse.json(
          {
            error: 'LinkedIn API rate limit exceeded. Please try again later.',
            status: 429,
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
    console.log('[Scan LinkedIn API] Found', data.elements?.length || 0, 'posts')

    // Transform LinkedIn UGC Posts to our format
    const posts = (data.elements || []).map((post: any) => {
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

      return {
        id: post.id,
        content,
        images,
        createdAt: post.created?.time || new Date().toISOString(),
      }
    })

    return NextResponse.json({ posts })
  } catch (error: any) {
    console.error('[Scan LinkedIn API] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to scan LinkedIn account',
        status: 500,
      },
      { status: 500 }
    )
  }
}
