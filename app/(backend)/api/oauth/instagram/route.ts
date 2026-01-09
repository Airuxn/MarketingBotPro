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

  // Try direct Instagram OAuth first (if INSTAGRAM_CLIENT_ID is set and different from FACEBOOK_CLIENT_ID)
  // Otherwise use Facebook OAuth (which also works for Instagram Business)
  const useDirectInstagram = INSTAGRAM_CLIENT_ID && INSTAGRAM_CLIENT_ID !== FACEBOOK_CLIENT_ID
  
  if (useDirectInstagram) {
    // Direct Instagram Business Login
    console.log('[Instagram OAuth] Using direct Instagram OAuth')
    const scopes = [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments',
      'instagram_business_content_publish',
      'instagram_business_manage_insights',
    ].join(',')
    
    const authUrl = `https://www.instagram.com/oauth/authorize?` +
      `client_id=${INSTAGRAM_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(instagramRedirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&response_type=code` +
      `&state=instagram_business`
    
    console.log('[Instagram OAuth] Redirecting to Instagram:', authUrl)
    console.log('[Instagram OAuth] ========== END ==========')
    return NextResponse.redirect(authUrl)
  }
  
  // Fallback: Use Facebook OAuth (standard for Instagram Business via Facebook Pages)
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
