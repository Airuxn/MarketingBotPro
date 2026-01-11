import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getOAuthUrls } from '@/lib/vercel-url'

// This route uses cookies, so it must be dynamic
export const dynamic = 'force-dynamic'

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET

export async function GET(request: Request) {
  // Get URLs using helper function - NEVER uses localhost on Vercel
  const { baseUrl, redirectUri: finalRedirectUri } = getOAuthUrls(request, '/api/oauth/linkedin/callback')

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const state = searchParams.get('state')

  console.log('[LinkedIn OAuth Callback] ========== START ==========')
  console.log('[LinkedIn OAuth Callback] Request URL:', request.url)
  console.log('[LinkedIn Callback] Code:', code ? 'present' : 'missing')
  console.log('[LinkedIn Callback] Error:', error || 'none')
  console.log('[LinkedIn Callback] Error Description:', error_description || 'none')
  console.log('[LinkedIn Callback] State:', state || 'none')
  console.log('[LinkedIn Callback] Final Redirect URI:', finalRedirectUri)
  console.log('[LinkedIn OAuth Callback] ========== END ==========')

  if (error) {
    const errorMessage = error_description || error
    console.error('[LinkedIn OAuth Callback] Error from LinkedIn:', errorMessage)
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent(errorMessage)}`
    )
  }

  if (!code) {
    console.error('[LinkedIn OAuth Callback] No authorization code received')
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('No authorization code received from LinkedIn')}`
    )
  }

  try {
    const cookieStore = await cookies()
    const storedState = cookieStore.get('linkedin_oauth_state')?.value
    
    if (!storedState || storedState !== state) {
      throw new Error('Invalid state parameter')
    }

    cookieStore.delete('linkedin_oauth_state')

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: finalRedirectUri,
        client_id: LINKEDIN_CLIENT_ID!,
        client_secret: LINKEDIN_CLIENT_SECRET!,
      }),
    })

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
    const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    let userId: string | undefined
    if (userResponse.ok) {
      const userData = await userResponse.json()
      userId = userData.sub
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
    
    cookieStore.set('oauth_platform', 'linkedin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
    })

    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_success=linkedin`
    )
  } catch (error: any) {
    console.error('LinkedIn OAuth error:', error)
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent(error.message || 'oauth_failed')}`
    )
  }
}
