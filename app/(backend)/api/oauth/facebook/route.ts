import { NextResponse } from 'next/server'

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET
const FACEBOOK_LOGIN_CONFIG_ID = process.env.FACEBOOK_LOGIN_CONFIG_ID
// Use NEXT_PUBLIC_OAUTH_REDIRECT_URI for production, fallback to localhost for development
const REDIRECT_URI = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/api/oauth/facebook/callback'

export async function GET(request: Request) {
  // Use NEXT_PUBLIC_APP_URL for production, fallback to localhost for development
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  if (!FACEBOOK_CLIENT_ID) {
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('Facebook OAuth not configured. Please set FACEBOOK_CLIENT_ID in environment variables. See docs/OAUTH_SETUP.md for setup instructions.')}`
    )
  }

  // Build OAuth URL
  const authParams = new URLSearchParams({
    client_id: FACEBOOK_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
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
