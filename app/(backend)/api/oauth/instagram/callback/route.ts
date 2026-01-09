import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Instagram Business Login uses Instagram App ID/Secret for authorization
// Token exchange may still use Facebook Graph API
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET
// Use redirect URI directly (should be set to Instagram callback in .env.local)
const INSTAGRAM_REDIRECT_URI = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/oauth/instagram/callback'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason')

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?oauth_error=${encodeURIComponent(errorReason || error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?oauth_error=no_code`
    )
  }

  try {
    // Exchange code for access token
    // Instagram Business Login token exchange typically uses Facebook Graph API
    // Try Facebook Graph API first (standard for Instagram Business Login)
    let tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${INSTAGRAM_CLIENT_ID}` +
      `&client_secret=${INSTAGRAM_CLIENT_SECRET}` +
      `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}` +
      `&code=${code}`,
      { method: 'GET' }
    )
    
    // If that fails, try Instagram's own endpoint
    if (!tokenResponse.ok) {
      tokenResponse = await fetch(
        `https://api.instagram.com/oauth/access_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: INSTAGRAM_CLIENT_ID!,
            client_secret: INSTAGRAM_CLIENT_SECRET!,
            grant_type: 'authorization_code',
            redirect_uri: INSTAGRAM_REDIRECT_URI,
            code: code,
          }),
        }
      )
    }

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      throw new Error(errorData.error?.message || 'Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    // Instagram Business Login token response might include user_id directly
    let userId: string | undefined = tokenData.user_id

    if (!accessToken) {
      throw new Error('No access token received')
    }

    // If userId not in token response, try to get it from Instagram Graph API
    if (!userId) {
      try {
        // Try Instagram Graph API /me endpoint first
        const meResponse = await fetch(
          `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
        )
        
        if (meResponse.ok) {
          const meData = await meResponse.json()
          userId = meData.id
          console.log(`Got Instagram Business Account ID from /me endpoint: ${userId}`)
        } else {
          // Fallback: try Facebook Graph API /me/accounts (if token works with Facebook API)
          const pagesResponse = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,instagram_business_account`
          )
          
          if (pagesResponse.ok) {
            const pagesData = await pagesResponse.json()
            const pages = pagesData.data || []
            
            console.log(`Found ${pages.length} Facebook pages`)
            
            // Try all pages to find one with Instagram connected
            for (const page of pages) {
              if (page.instagram_business_account?.id) {
                userId = page.instagram_business_account.id
                console.log(`Found Instagram Business Account ID: ${userId} for page: ${page.name || page.id}`)
                break
              }
            }
            
            // If not found in initial response, try fetching each page individually
            if (!userId && pages.length > 0) {
              console.log('Instagram Business Account ID not in initial response, trying individual page requests...')
              for (const page of pages) {
                try {
                  const igAccountResponse = await fetch(
                    `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
                  )
                  if (igAccountResponse.ok) {
                    const igData = await igAccountResponse.json()
                    if (igData.instagram_business_account?.id) {
                      userId = igData.instagram_business_account.id
                      console.log(`Found Instagram Business Account ID: ${userId} for page: ${page.id}`)
                      break
                    }
                  }
                } catch (err) {
                  console.error(`Error checking page ${page.id}:`, err)
                  continue
                }
              }
            }
          }
        }
        
        if (!userId) {
          console.warn('No Instagram Business Account ID found. Make sure:')
          console.warn('1. Your Instagram account is a Business or Creator account')
          console.warn('2. Your Instagram account is connected to a Facebook Page')
          console.warn('3. The access token has the required permissions')
        }
      } catch (error) {
        console.error('Error retrieving Instagram Business Account ID:', error)
      }
    } else {
      console.log(`Got Instagram Business Account ID from token response: ${userId}`)
    }

    // Store token temporarily
    const cookieStore = await cookies()
    cookieStore.set('oauth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
    })
    
    if (userId) {
      cookieStore.set('oauth_user_id', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60,
      })
    }
    
    cookieStore.set('oauth_platform', 'instagram', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
    })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?oauth_success=instagram`
    )
  } catch (error: any) {
    console.error('Instagram OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?oauth_error=${encodeURIComponent(error.message || 'oauth_failed')}`
    )
  }
}
