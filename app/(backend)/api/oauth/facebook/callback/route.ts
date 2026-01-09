import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET
// Use FACEBOOK_REDIRECT_URI if set, otherwise use default
const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/api/oauth/facebook/callback'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason')

  // Facebook always redirects to localhost (not ngrok)
  const baseUrl = 'http://localhost:3000'
  
  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent(errorReason || error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=no_code`
    )
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${FACEBOOK_CLIENT_ID}` +
      `&client_secret=${FACEBOOK_CLIENT_SECRET}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&code=${code}`,
      { method: 'GET' }
    )

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      throw new Error(errorData.error?.message || 'Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('No access token received')
    }

    // Get user info to determine userId
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}&fields=id,name`
    )
    
    let userId: string | undefined
    if (userResponse.ok) {
      const userData = await userResponse.json()
      userId = userData.id
    }

    // Store token temporarily in httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set('oauth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60, // 1 minute - just to pass to frontend
    })
    
    if (userId) {
      cookieStore.set('oauth_user_id', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60,
      })
    }
    
    cookieStore.set('oauth_platform', 'facebook', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
    })

    // Redirect to settings page - frontend will retrieve token
    // Facebook always uses localhost (not ngrok)
    const baseUrl = 'http://localhost:3000'
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_success=facebook`
    )
  } catch (error: any) {
    console.error('Facebook OAuth error:', error)
    const baseUrl = 'http://localhost:3000'
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent(error.message || 'oauth_failed')}`
    )
  }
}
