import { NextResponse } from 'next/server'

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET
const FACEBOOK_LOGIN_CONFIG_ID = process.env.FACEBOOK_LOGIN_CONFIG_ID

export async function GET(request: Request) {
  // Get base URL - Vercel provides VERCEL_URL automatically
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  const requestUrl = new URL(request.url)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  vercelUrl ||
                  `${requestUrl.protocol}//${requestUrl.host}` ||
                  'https://[your-project].vercel.app'
  
  // Build redirect URI - MUST match Facebook App Settings exactly
  const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 
                     process.env.FACEBOOK_REDIRECT_URI ||
                     `${baseUrl}/api/oauth/facebook/callback`
  
  // Force HTTPS for production
  const finalRedirectUri = redirectUri.replace('http://', 'https://')
  
  // Debug log
  console.log('OAuth redirect URI:', finalRedirectUri)
  console.log('Base URL:', baseUrl)
  console.log('VERCEL_URL:', process.env.VERCEL_URL)
  
  if (!FACEBOOK_CLIENT_ID) {
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('Facebook OAuth not configured. Please set FACEBOOK_CLIENT_ID in environment variables. See docs/OAUTH_SETUP.md for setup instructions.')}`
    )
  }

  // Build OAuth URL - use finalRedirectUri that matches Facebook settings
  const authParams = new URLSearchParams({
    client_id: FACEBOOK_CLIENT_ID,
    redirect_uri: finalRedirectUri,
    response_type: 'code',
    state: 'social_post',
  })

  // Use config_id if provided (Facebook Login for Business)
  // Otherwise use scope (Consumer login)
  if (FACEBOOK_LOGIN_CONFIG_ID) {
    // Business login - use config_id
    authParams.set('config_id', FACEBOOK_LOGIN_CONFIG_ID)
  } else {
    // Consumer login - use scope with page permissions (for scanning Page posts)
    // Note: user_posts requires App Review, so we use page permissions instead
    // Most business posts are on Pages anyway
    const scopes = [
      'public_profile',        // Basic profile (name, ID, picture)
      'pages_show_list',       // List user's pages
      'pages_read_engagement', // Read page posts (may require App Review for production)
      'pages_read_user_content', // Read page content (may require App Review for production)
    ].join(',')
    authParams.set('scope', scopes)
  }

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${authParams.toString()}`
  return NextResponse.redirect(authUrl)
}
