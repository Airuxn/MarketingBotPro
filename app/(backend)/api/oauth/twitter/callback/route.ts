import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { getOAuthUrls } from '@/lib/vercel-url'

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET

export async function GET(request: Request) {
  const { baseUrl, redirectUri: finalRedirectUri } = getOAuthUrls(request, '/api/oauth/twitter/callback')
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=no_code`
    )
  }

  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('Twitter OAuth not configured. Please set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET in environment variables.')}`
    )
  }

  try {
    const cookieStore = await cookies()
    const codeVerifier = cookieStore.get('twitter_code_verifier')?.value
    
    if (!codeVerifier) {
      throw new Error('Code verifier not found')
    }

    // Exchange code for access token
    const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')
    
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: finalRedirectUri,
        code_verifier: codeVerifier,
      }),
    })

    cookieStore.delete('twitter_code_verifier')

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      throw new Error(errorData.error_description || errorData.error || 'Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const tokenType = tokenData.token_type || 'bearer'
    const scope = tokenData.scope || 'unknown'

    console.log('[Twitter OAuth Callback] Token exchange successful:', {
      hasAccessToken: !!accessToken,
      tokenType: tokenType,
      scope: scope,
      expiresIn: tokenData.expires_in || 'unknown',
    })

    if (!accessToken) {
      throw new Error('No access token received')
    }

    // Verify token type is correct (should be 'bearer' for User Context)
    if (tokenType.toLowerCase() !== 'bearer') {
      console.warn(`[Twitter OAuth Callback] Unexpected token type: ${tokenType}, expected 'bearer'`)
    }

    // Verify scopes include tweet.write
    if (scope && !scope.includes('tweet.write')) {
      console.error('[Twitter OAuth Callback] WARNING: Token does not have tweet.write scope!')
      console.error('[Twitter OAuth Callback] Token scopes:', scope)
      console.error('[Twitter OAuth Callback] This will cause posting to fail. Please disconnect and reconnect Twitter.')
    } else {
      console.log('[Twitter OAuth Callback] Token has tweet.write scope:', scope)
    }

    // Get user info
    console.log('[Twitter OAuth Callback] Fetching user info from Twitter API...')
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=id,username', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    let userId: string | undefined
    let username: string | undefined
    
    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}))
      console.error('[Twitter OAuth Callback] Failed to get user info:', userResponse.status, errorData)
      console.error('[Twitter OAuth Callback] Error details:', errorData.errors || errorData)
    } else {
      const userData = await userResponse.json()
      console.log('[Twitter OAuth Callback] User data received:', JSON.stringify({ ...userData, data: userData.data ? { id: userData.data.id, username: userData.data.username } : null }, null, 2))
      
      userId = userData.data?.id
      username = userData.data?.username
      
      if (!userId) {
        console.error('[Twitter OAuth Callback] WARNING: User ID not found in response!')
        console.error('[Twitter OAuth Callback] Full response:', JSON.stringify(userData, null, 2))
      } else {
        console.log(`[Twitter OAuth Callback] Successfully retrieved userId: ${userId}, username: ${username || 'N/A'}`)
      }
    }

    // Store token temporarily
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
    
    cookieStore.set('oauth_platform', 'twitter', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
    })

    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_success=twitter`
    )
  } catch (error: any) {
    console.error('Twitter OAuth error:', error)
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent(error.message || 'oauth_failed')}`
    )
  }
}
