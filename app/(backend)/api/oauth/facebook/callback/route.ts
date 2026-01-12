import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getOAuthUrls } from '@/lib/vercel-url'

// This route uses cookies, so it must be dynamic
export const dynamic = 'force-dynamic'

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason')
  const state = searchParams.get('state')

  // Get URLs using helper function - NEVER uses localhost on Vercel
  const { baseUrl, redirectUri: finalRedirectUri, isVercel, isProduction, vercelUrl, requestUrl } = getOAuthUrls(request, '/api/oauth/facebook/callback')
  
  // Debug log - EXTENSIVE logging
  console.log('[OAuth Callback] ========== OAUTH CALLBACK ==========')
  console.log('[OAuth Callback] VERCEL env:', process.env.VERCEL)
  console.log('[OAuth Callback] VERCEL_URL env:', process.env.VERCEL_URL)
  console.log('[OAuth Callback] NODE_ENV:', process.env.NODE_ENV)
  console.log('[OAuth Callback] Request URL:', request.url)
  console.log('[OAuth Callback] Request Host:', requestUrl.host)
  console.log('[OAuth Callback] isVercel:', isVercel)
  console.log('[OAuth Callback] isProduction:', isProduction)
  console.log('[OAuth Callback] Base URL:', baseUrl)
  console.log('[OAuth Callback] Final Redirect URI (to Facebook API):', finalRedirectUri)
  console.log('[OAuth Callback] NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'NOT SET')
  console.log('[OAuth Callback] NEXT_PUBLIC_OAUTH_REDIRECT_URI:', process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'NOT SET')
  console.log('[OAuth Callback] =====================================')
  
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
    const cookieStore = await cookies()
    const storedState = cookieStore.get('facebook_oauth_state')?.value

    if (!storedState || storedState !== state) {
      throw new Error('Invalid state parameter')
    }

    cookieStore.delete('facebook_oauth_state')

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${FACEBOOK_CLIENT_ID}` +
      `&client_secret=${FACEBOOK_CLIENT_SECRET}` +
      `&redirect_uri=${encodeURIComponent(finalRedirectUri)}` +
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
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_success=facebook`
    )
  } catch (error: any) {
    console.error('Facebook OAuth error:', error)
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent(error.message || 'oauth_failed')}`
    )
  }
}
