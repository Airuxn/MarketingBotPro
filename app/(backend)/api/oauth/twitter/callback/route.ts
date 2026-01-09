import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/oauth/facebook/callback'
const TWITTER_REDIRECT_URI = REDIRECT_URI.replace('/facebook/callback', '/twitter/callback')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?oauth_error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?oauth_error=no_code`
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
        client_id: TWITTER_CLIENT_ID!,
        redirect_uri: TWITTER_REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    })

    cookieStore.delete('twitter_code_verifier')

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      throw new Error(errorData.error_description || 'Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('No access token received')
    }

    // Get user info
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    let userId: string | undefined
    if (userResponse.ok) {
      const userData = await userResponse.json()
      userId = userData.data?.id
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
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?oauth_success=twitter`
    )
  } catch (error: any) {
    console.error('Twitter OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?oauth_error=${encodeURIComponent(error.message || 'oauth_failed')}`
    )
  }
}
