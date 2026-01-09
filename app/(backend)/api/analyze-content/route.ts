import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    // In production, use a proper scraping service or API
    // For now, we'll use a CORS proxy or direct fetch
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

    // Extract text content from HTML (simple extraction)
    // In production, use a proper HTML parser like cheerio or puppeteer
    const textContent = extractTextFromHTML(html)

    return NextResponse.json({ content: textContent })
  } catch (error: any) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content from URL' },
      { status: 500 }
    )
  }
}

function extractTextFromHTML(html: string): string {
  // Simple text extraction - remove HTML tags
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Try to extract main content (look for common content containers)
  const contentMatch = html.match(
    /<(article|main|div[^>]*class="[^"]*content[^"]*")[^>]*>([\s\S]*?)<\/\1>/i
  )
  if (contentMatch) {
    text = contentMatch[2]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  return text.substring(0, 5000) // Limit to 5000 characters
}
