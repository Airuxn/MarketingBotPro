import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getOAuthUrls } from '@/lib/vercel-url'

// Instagram Business Login uses Facebook OAuth
// We use Facebook credentials because Instagram Business accounts are accessed through Facebook Pages
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID || FACEBOOK_CLIENT_ID
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET || FACEBOOK_CLIENT_SECRET

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason')
  
  // Get redirect URI using helper function - must match what was sent to Instagram
  const { baseUrl, redirectUri: baseRedirectUri } = getOAuthUrls(request, '/api/oauth/facebook/callback')
  const INSTAGRAM_REDIRECT_URI = baseRedirectUri.replace('/facebook/callback', '/instagram/callback')
  
  // Debug logging
  console.log('[Instagram Callback] ========== START ==========')
  console.log('[Instagram Callback] code:', code ? 'PRESENT' : 'MISSING')
  console.log('[Instagram Callback] error:', error || 'NONE')
  console.log('[Instagram Callback] FACEBOOK_CLIENT_ID:', FACEBOOK_CLIENT_ID ? 'SET' : 'NOT SET')
  console.log('[Instagram Callback] FACEBOOK_CLIENT_SECRET:', FACEBOOK_CLIENT_SECRET ? 'SET' : 'NOT SET')
  console.log('[Instagram Callback] INSTAGRAM_CLIENT_ID:', INSTAGRAM_CLIENT_ID ? 'SET' : 'NOT SET')
  console.log('[Instagram Callback] INSTAGRAM_CLIENT_SECRET:', INSTAGRAM_CLIENT_SECRET ? 'SET' : 'NOT SET')
  console.log('[Instagram Callback] INSTAGRAM_REDIRECT_URI:', INSTAGRAM_REDIRECT_URI)
  console.log('[Instagram Callback] Request URL:', request.url)

  if (error) {
    console.log('[Instagram Callback] Error from Instagram:', errorReason || error)
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent(errorReason || error)}`
    )
  }

  if (!code) {
    console.log('[Instagram Callback] No code received')
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=no_code`
    )
  }

  // For Instagram Business Login, we need Facebook credentials
  const clientId = FACEBOOK_CLIENT_ID || INSTAGRAM_CLIENT_ID
  const clientSecret = FACEBOOK_CLIENT_SECRET || INSTAGRAM_CLIENT_SECRET

  if (!clientId) {
    console.log('[Instagram Callback] No client ID found (FACEBOOK_CLIENT_ID or INSTAGRAM_CLIENT_ID)')
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('Instagram OAuth not configured. Please set FACEBOOK_CLIENT_ID or INSTAGRAM_CLIENT_ID in environment variables.')}`
    )
  }

  if (!clientSecret) {
    console.log('[Instagram Callback] No client secret found (FACEBOOK_CLIENT_SECRET or INSTAGRAM_CLIENT_SECRET)')
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('Instagram OAuth not configured. Please set FACEBOOK_CLIENT_SECRET or INSTAGRAM_CLIENT_SECRET in environment variables.')}`
    )
  }

  try {
    // Exchange code for access token
    // Instagram Business Login uses Facebook Graph API for token exchange
    console.log('[Instagram Callback] Attempting token exchange with Facebook Graph API...')
    console.log('[Instagram Callback] Using client_id:', clientId)
    console.log('[Instagram Callback] Using redirect_uri:', INSTAGRAM_REDIRECT_URI)
    
    let tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${clientId}` +
      `&client_secret=${clientSecret}` +
      `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}` +
      `&code=${code}`,
      { method: 'GET' }
    )
    
    console.log('[Instagram Callback] Facebook Graph API response status:', tokenResponse.status)
    
    // If that fails, try Instagram's own endpoint
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      let errorData: any = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { raw: errorText }
      }
      
      console.log('[Instagram Callback] Facebook Graph API failed:')
      console.log('[Instagram Callback] Status:', tokenResponse.status)
      console.log('[Instagram Callback] Error data:', JSON.stringify(errorData, null, 2))
      console.log('[Instagram Callback] Redirect URI used:', INSTAGRAM_REDIRECT_URI)
      console.log('[Instagram Callback] Client ID used:', INSTAGRAM_CLIENT_ID)
      console.log('[Instagram Callback] Trying Instagram API endpoint...')
      
      tokenResponse = await fetch(
        `https://api.instagram.com/oauth/access_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId!,
            client_secret: clientSecret!,
            grant_type: 'authorization_code',
            redirect_uri: INSTAGRAM_REDIRECT_URI,
            code: code,
          }),
        }
      )
      
      const instagramErrorText = await tokenResponse.text()
      let instagramErrorData: any = {}
      try {
        instagramErrorData = JSON.parse(instagramErrorText)
      } catch {
        instagramErrorData = { raw: instagramErrorText }
      }
      
      console.log('[Instagram Callback] Instagram API response status:', tokenResponse.status)
      console.log('[Instagram Callback] Instagram API error data:', JSON.stringify(instagramErrorData, null, 2))
    }

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      let errorData: any = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { raw: errorText, message: 'Failed to parse error response' }
      }
      
      console.error('[Instagram Callback] Token exchange failed:')
      console.error('[Instagram Callback] Status:', tokenResponse.status)
      console.error('[Instagram Callback] Full error:', JSON.stringify(errorData, null, 2))
      
      const errorMessage = errorData.error?.message || errorData.error?.error_user_msg || errorData.message || errorData.raw || 'Failed to exchange code for token'
      throw new Error(errorMessage)
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

    console.log('[Instagram Callback] ========== SUCCESS ==========')
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_success=instagram`
    )
  } catch (error: any) {
    console.error('[Instagram Callback] ========== ERROR ==========')
    console.error('[Instagram Callback] Error:', error)
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent(error.message || 'oauth_failed')}`
    )
  }
}
