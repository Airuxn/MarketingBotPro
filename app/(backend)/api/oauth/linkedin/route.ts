import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getOAuthUrls } from '@/lib/vercel-url'

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET

export async function GET(request: Request) {
  // Get URLs using helper function - NEVER uses localhost on Vercel
  const { baseUrl, redirectUri: finalRedirectUri } = getOAuthUrls(request, '/api/oauth/linkedin/callback')

  console.log('[LinkedIn OAuth] ========== START ==========')
  console.log('[LinkedIn OAuth] Request URL:', request.url)
  console.log('[LinkedIn OAuth] Final Redirect URI:', finalRedirectUri)
  console.log('[LinkedIn OAuth] Client ID:', LINKEDIN_CLIENT_ID ? 'set' : 'NOT SET')
  console.log('[LinkedIn OAuth] ========== END ==========')

  if (!LINKEDIN_CLIENT_ID) {
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('LinkedIn OAuth not configured. Please set LINKEDIN_CLIENT_ID in environment variables. See docs/OAUTH_SETUP.md for setup instructions.')}`
    )
  }

  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString('base64url')
  
  const cookieStore = await import('next/headers').then(m => m.cookies())
  cookieStore.set('linkedin_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
  })

  const scopes = ['openid', 'profile', 'email', 'w_member_social'].join(' ')
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code` +
    `&client_id=${LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(finalRedirectUri)}` +
    `&state=${state}` +
    `&scope=${encodeURIComponent(scopes)}`

  console.log('[LinkedIn OAuth] Redirecting to LinkedIn with redirect_uri:', finalRedirectUri)

  return NextResponse.redirect(authUrl)
}
