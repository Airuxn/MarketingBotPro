import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering - this route uses searchParams which are dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    let url: URL
    try {
      url = new URL(imageUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      )
    }

    // Only allow specific domains for security
    const allowedDomains = [
      'graph.instagram.com',
      'scontent.cdninstagram.com',
      'instagram.com',
      'fbcdn.net',
      'facebook.com',
      'pbs.twimg.com',
      'cdn.syndication.twimg.com',
      'media.licdn.com',
    ]

    const isAllowed = allowedDomains.some(domain => url.hostname.includes(domain))
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Domain not allowed for image proxying' },
        { status: 403 }
      )
    }

    console.log('[Proxy Image] Fetching image from:', url.hostname)

    // Fetch the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!imageResponse.ok) {
      console.error('[Proxy Image] Failed to fetch image:', imageResponse.status)
      return NextResponse.json(
        { error: `Failed to fetch image: ${imageResponse.status}` },
        { status: imageResponse.status }
      )
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Return the image with proper CORS headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    })
  } catch (error: any) {
    console.error('[Proxy Image] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to proxy image',
        status: 500,
      },
      { status: 500 }
    )
  }
}
