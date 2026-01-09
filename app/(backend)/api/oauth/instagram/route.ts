import { NextResponse } from 'next/server'
import { getOAuthUrls } from '@/lib/vercel-url'

// Instagram Business Login uses Facebook OAuth with Facebook App ID
// Instagram Business accounts are accessed through Facebook Pages
// This requires "Instagram API with Facebook login" setup in Facebook Developers
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
const FACEBOOK_LOGIN_CONFIG_ID = process.env.FACEBOOK_LOGIN_CONFIG_ID
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID

export async function GET(request: Request) {
  // Get redirect URI - MUST use the exact same logic as the callback route
  // Use the request URL to construct the redirect URI (same as callback does)
  const requestUrl = new URL(request.url)
  const host = requestUrl.host
  const protocol = requestUrl.protocol
  const baseUrl = `${protocol}//${host}`
  const instagramRedirectUri = `${baseUrl}/api/oauth/instagram/callback`
  
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

  // Build OAuth URL
  const authParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: instagramRedirectUri,
    response_type: 'code',
    state: 'instagram_business',
  })

  // Use config_id if provided (Facebook Login for Business with Instagram permissions)
  // Otherwise use scope (Consumer login with Instagram permissions)
  if (FACEBOOK_LOGIN_CONFIG_ID) {
    // Business login - use config_id (recommended for Instagram Business)
    console.log('[Instagram OAuth] Using Facebook Login for Business (config_id)')
    authParams.set('config_id', FACEBOOK_LOGIN_CONFIG_ID)
  } else {
    // Consumer login - use scope with Instagram Business permissions
    console.log('[Instagram OAuth] Using Facebook Login with Instagram scopes')
    const scopes = [
      'pages_show_list',                    // List Facebook Pages (required for Instagram Business)
      'pages_read_engagement',              // Read Page posts
      'instagram_basic',                    // Instagram Basic Display
      'instagram_manage_comments',          // Manage Instagram comments
      'instagram_manage_insights',          // Instagram insights
      'instagram_content_publish',          // Publish to Instagram
    ].join(',')
    authParams.set('scope', scopes)
  }
  
  // Instagram Business Login uses Facebook OAuth endpoint
  // The user will authorize Facebook, then we can access their Instagram Business account via their Facebook Pages
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${authParams.toString()}`

  console.log('[Instagram OAuth] Redirecting to Facebook (for Instagram Business):', authUrl)
  console.log('[Instagram OAuth] ========== END ==========')
  
  return NextResponse.redirect(authUrl)
}
