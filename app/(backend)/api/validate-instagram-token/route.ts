import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    // Try Instagram Graph API first
    try {
      const instagramResponse = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken.trim()}`
      )

      if (instagramResponse.ok) {
        const instagramData = await instagramResponse.json()
        if (instagramData.id) {
          return NextResponse.json({
            valid: true,
            userId: instagramData.id,
            username: instagramData.username,
            source: 'instagram_api',
          })
        }
      }

      // If Instagram API fails, try Facebook Graph API
      const facebookMeResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${accessToken.trim()}&fields=id,name`
      )

      if (!facebookMeResponse.ok) {
        const errorData = await facebookMeResponse.json().catch(() => ({}))
        return NextResponse.json(
          {
            valid: false,
            error: errorData.error?.message || 'Invalid access token',
            errorType: errorData.error?.type || 'unknown',
          },
          { status: 400 }
        )
      }

      const facebookData = await facebookMeResponse.json()
      
      // Try to get Instagram Business Account from pages
      let instagramBusinessAccountId: string | undefined
      let instagramUsername: string | undefined

      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken.trim()}&fields=id,name,instagram_business_account{id,username}`
      )

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json()
        const pages = pagesData.data || []

        for (const page of pages) {
          if (page.instagram_business_account?.id) {
            instagramBusinessAccountId = page.instagram_business_account.id
            instagramUsername = page.instagram_business_account.username
            break
          }
        }
      }

      return NextResponse.json({
        valid: true,
        userId: instagramBusinessAccountId || facebookData.id,
        username: instagramUsername,
        facebookId: facebookData.id,
        source: instagramBusinessAccountId ? 'facebook_api_instagram_business' : 'facebook_api',
      })
    } catch (error: any) {
      console.error('Token validation error:', error)
      return NextResponse.json(
        {
          valid: false,
          error: error.message || 'Failed to validate token',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Request parsing error:', error)
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    )
  }
}
