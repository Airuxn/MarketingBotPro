import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    // Use CORS proxy to fetch content
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarketingBot/1.0)',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch content')
    }

    const data = await response.json()
    const html = data.contents

    // Extract image URLs from HTML
    const images = extractImageUrls(html, url)

    return NextResponse.json({ images })
  } catch (error: any) {
    console.error('Error extracting images:', error)
    return NextResponse.json(
      { error: 'Failed to extract images from URL' },
      { status: 500 }
    )
  }
}

function extractImageUrls(html: string, baseUrl: string): string[] {
  const images: string[] = []
  
  // Extract img tags
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    let imageUrl = match[1]
    
    // Handle relative URLs
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl
    } else if (imageUrl.startsWith('/')) {
      try {
        const base = new URL(baseUrl)
        imageUrl = base.origin + imageUrl
      } catch {
        continue
      }
    } else if (!imageUrl.startsWith('http')) {
      try {
        const base = new URL(baseUrl)
        imageUrl = new URL(imageUrl, base.origin).href
      } catch {
        continue
      }
    }

    // Filter out small images, icons, avatars
    if (
      !imageUrl.includes('avatar') &&
      !imageUrl.includes('icon') &&
      !imageUrl.includes('logo') &&
      !imageUrl.includes('emoji') &&
      imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)
    ) {
      images.push(imageUrl)
    }
  }

  // Extract from meta tags (Open Graph, Twitter Cards)
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
  if (ogImageMatch) {
    images.push(ogImageMatch[1])
  }

  const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
  if (twitterImageMatch) {
    images.push(twitterImageMatch[1])
  }

  // Remove duplicates and return
  return [...new Set(images)].slice(0, 10) // Limit to 10 images
}
