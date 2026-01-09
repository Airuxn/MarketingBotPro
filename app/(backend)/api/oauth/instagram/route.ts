import { NextResponse } from 'next/server'
import { getOAuthUrls } from '@/lib/vercel-url'

// Instagram Business Login uses Facebook OAuth with Facebook App ID
// Instagram Business accounts are accessed through Facebook Pages
// This requires "Instagram API with Facebook login" setup in Facebook Developers
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
const FACEBOOK_LOGIN_CONFIG_ID = process.env.FACEBOOK_LOGIN_CONFIG_ID
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID

export async function GET(request: Request) {
  // Get redirect URI using same helper as Facebook - ensures consistency
  const { baseUrl, redirectUri: instagramRedirectUri } = getOAuthUrls(request, '/api/oauth/instagram/callback')
  
  // Debug logging
  console.log('[Instagram OAuth] ========== START ==========')
  console.log('[Instagram OAuth] baseRedirectUri:', baseRedirectUri)
  console.log('[Instagram OAuth] instagramRedirectUri:', instagramRedirectUri)
  console.log('[Instagram OAuth] FACEBOOK_CLIENT_ID:', FACEBOOK_CLIENT_ID ? 'SET' : 'NOT SET')
  console.log('[Instagram OAuth] FACEBOOK_LOGIN_CONFIG_ID:', FACEBOOK_LOGIN_CONFIG_ID ? 'SET' : 'NOT SET')
  console.log('[Instagram OAuth] INSTAGRAM_CLIENT_ID:', INSTAGRAM_CLIENT_ID ? 'SET' : 'NOT SET')
  
  // For Instagram Business Login, we need Facebook Client ID
  const clientId = FACEBOOK_CLIENT_ID || INSTAGRAM_CLIENT_ID
  
  if (!clientId) {
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('Instagram OAuth not configured. Please set FACEBOOK_CLIENT_ID or INSTAGRAM_CLIENT_ID in environment variables. See docs/OAUTH_SETUP.md for setup instructions.')}`
    )
  }

  // Use Instagram Basic Display API for regular Instagram accounts
  // This works for ANY Instagram account (personal, business, creator - doesn't matter)
  // Users don't need a professional account or Facebook Page
  console.log('[Instagram OAuth] Using Instagram Basic Display API (works for all account types)')
  
  // Instagram Basic Display API uses direct Instagram OAuth
  // This works for regular accounts without requiring Business/Creator accounts
  const scopes = [
    'user_profile',           // Basic profile info
    'user_media',             // Access to user's media
  ].join(',')
  
  const authUrl = `https://api.instagram.com/oauth/authorize?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(instagramRedirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code` +
    `&state=instagram`

  console.log('[Instagram OAuth] Redirecting to Facebook (for Instagram Business):', authUrl)
  console.log('[Instagram OAuth] ========== END ==========')
  
  return NextResponse.redirect(authUrl)
}
