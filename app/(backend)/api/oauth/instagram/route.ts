import { NextResponse } from 'next/server'
import { getOAuthUrls } from '@/lib/vercel-url'

// Instagram Business Login uses Facebook OAuth with Facebook App ID
// Instagram Business accounts are accessed through Facebook Pages
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID

export async function GET(request: Request) {
  // Get URLs using helper function - ensures correct URL on Vercel
  const { baseUrl, redirectUri: baseRedirectUri } = getOAuthUrls(request, '/api/oauth/facebook/callback')
  
  // Construct Instagram redirect URI from base redirect URI
  const instagramRedirectUri = baseRedirectUri.replace('/facebook/callback', '/instagram/callback')
  
  // Debug logging
  console.log('[Instagram OAuth] ========== START ==========')
  console.log('[Instagram OAuth] baseRedirectUri:', baseRedirectUri)
  console.log('[Instagram OAuth] instagramRedirectUri:', instagramRedirectUri)
  console.log('[Instagram OAuth] FACEBOOK_CLIENT_ID:', FACEBOOK_CLIENT_ID ? 'SET' : 'NOT SET')
  console.log('[Instagram OAuth] INSTAGRAM_CLIENT_ID:', INSTAGRAM_CLIENT_ID ? 'SET' : 'NOT SET')
  
  // For Instagram Business Login, we need Facebook Client ID
  const clientId = FACEBOOK_CLIENT_ID || INSTAGRAM_CLIENT_ID
  
  if (!clientId) {
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('Instagram OAuth not configured. Please set FACEBOOK_CLIENT_ID or INSTAGRAM_CLIENT_ID in environment variables. See docs/OAUTH_SETUP.md for setup instructions.')}`
    )
  }

  // Instagram Business Login requires Facebook OAuth with Instagram scopes
  // These scopes are Facebook permissions that grant access to Instagram Business accounts
  const scopes = [
    'pages_show_list',                    // List Facebook Pages
    'pages_read_engagement',              // Read Page posts
    'instagram_basic',                    // Instagram Basic Display (if available)
    'instagram_manage_comments',          // Manage Instagram comments
    'instagram_manage_insights',          // Instagram insights
    'instagram_content_publish',          // Publish to Instagram
  ].join(',')
  
  // Instagram Business Login uses Facebook OAuth endpoint
  // The user will authorize Facebook, then we can access their Instagram Business account via their Facebook Pages
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(instagramRedirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code` +
    `&state=instagram_business`

  console.log('[Instagram OAuth] Redirecting to Facebook (for Instagram Business):', authUrl)
  console.log('[Instagram OAuth] ========== END ==========')
  
  return NextResponse.redirect(authUrl)
}
