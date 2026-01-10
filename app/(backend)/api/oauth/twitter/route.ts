import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getOAuthUrls } from '@/lib/vercel-url'

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET

export async function GET(request: Request) {
  const { baseUrl, redirectUri: finalRedirectUri } = getOAuthUrls(request, '/api/oauth/twitter/callback')

  if (!TWITTER_CLIENT_ID) {
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('Twitter OAuth not configured. Please set TWITTER_CLIENT_ID in environment variables. See docs/OAUTH_SETUP.md for setup instructions.')}`
    )
  }

  // Generate code verifier and challenge for PKCE
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  // Store code_verifier in cookie for later use in callback
  const cookieStore = await import('next/headers').then(m => m.cookies())
  cookieStore.set('twitter_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  })

  // Request scopes for reading and creating posts
  const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'].join(' ')
  
  const authUrl = `https://twitter.com/i/oauth2/authorize?` +
    `response_type=code` +
    `&client_id=${TWITTER_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(finalRedirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&state=social_post` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`

  return NextResponse.redirect(authUrl)
}
