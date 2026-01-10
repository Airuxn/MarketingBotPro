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
  console.log('[Instagram OAuth] baseUrl:', baseUrl)
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

  // Instagram Business accounts must use Facebook Graph API OAuth
  // Instagram Basic Display API doesn't work with Facebook App IDs
  console.log('[Instagram OAuth] Using Facebook Graph API for Instagram Business')
  
  // Facebook Graph API OAuth for Instagram Business
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
  ].join(',')
  
  // Use Facebook OAuth endpoint, not Instagram Basic Display
  let authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(instagramRedirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code` +
    `&state=instagram`

  // If using Facebook Login Config ID (Consumer app), add config_id parameter
  if (FACEBOOK_LOGIN_CONFIG_ID) {
    authUrl += `&config_id=${FACEBOOK_LOGIN_CONFIG_ID}`
    console.log('[Instagram OAuth] Using Facebook Login Config ID:', FACEBOOK_LOGIN_CONFIG_ID)
  }

  console.log('[Instagram OAuth] Redirecting to Facebook Graph API:', authUrl)
  console.log('[Instagram OAuth] ========== END ==========')
  
  return NextResponse.redirect(authUrl)
}
