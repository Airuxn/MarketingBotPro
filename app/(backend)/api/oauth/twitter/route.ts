import { NextResponse } from 'next/server'
import crypto from 'crypto'

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/oauth/twitter/callback'

export async function GET(request: Request) {
  if (!TWITTER_CLIENT_ID) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
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

  const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'].join(' ')
  
  const twitterRedirectUri = `${REDIRECT_URI.replace('/facebook/callback', '/twitter/callback')}`
  
  const authUrl = `https://twitter.com/i/oauth2/authorize?` +
    `response_type=code` +
    `&client_id=${TWITTER_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(twitterRedirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&state=social_post` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`

  return NextResponse.redirect(authUrl)
}
