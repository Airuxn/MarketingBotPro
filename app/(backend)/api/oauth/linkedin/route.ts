import { NextResponse } from 'next/server'
import crypto from 'crypto'

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/oauth/linkedin/callback'

export async function GET(request: Request) {
  if (!LINKEDIN_CLIENT_ID) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
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
  
  const linkedinRedirectUri = `${REDIRECT_URI.replace('/facebook/callback', '/linkedin/callback')}`
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code` +
    `&client_id=${LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(linkedinRedirectUri)}` +
    `&state=${state}` +
    `&scope=${encodeURIComponent(scopes)}`

  return NextResponse.redirect(authUrl)
}
