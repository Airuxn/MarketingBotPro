import { NextResponse } from 'next/server'
import { getOAuthUrls } from '@/lib/vercel-url'
import { createOAuthState, oauthStateCookieOptions } from '@/lib/api-security'

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET
const FACEBOOK_LOGIN_CONFIG_ID = process.env.FACEBOOK_LOGIN_CONFIG_ID

export async function GET(request: Request) {
  // Get URLs using helper function - NEVER uses localhost on Vercel
  const { baseUrl, redirectUri: finalRedirectUri, isVercel, isProduction, vercelUrl, requestUrl } = getOAuthUrls(request, '/api/oauth/facebook/callback')
  
  // Debug log - EXTENSIVE logging
  console.log('[OAuth] ========== OAUTH START ==========')
  console.log('[OAuth] VERCEL env:', process.env.VERCEL)
  console.log('[OAuth] VERCEL_URL env:', process.env.VERCEL_URL)
  console.log('[OAuth] NODE_ENV:', process.env.NODE_ENV)
  console.log('[OAuth] Request URL:', request.url)
  console.log('[OAuth] Request Host:', requestUrl.host)
  console.log('[OAuth] isVercel:', isVercel)
  console.log('[OAuth] isProduction:', isProduction)
  console.log('[OAuth] Base URL:', baseUrl)
  console.log('[OAuth] Final Redirect URI (to Facebook):', finalRedirectUri)
  console.log('[OAuth] NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'NOT SET')
  console.log('[OAuth] NEXT_PUBLIC_OAUTH_REDIRECT_URI:', process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'NOT SET')
  console.log('[OAuth] =================================')
  
  if (!FACEBOOK_CLIENT_ID) {
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('Facebook OAuth not configured. Please set FACEBOOK_CLIENT_ID in environment variables. See docs/OAUTH_SETUP.md for setup instructions.')}`
    )
  }

  const state = createOAuthState()
  const cookieStore = await import('next/headers').then(m => m.cookies())
  cookieStore.set('facebook_oauth_state', state, oauthStateCookieOptions())

  // Build OAuth URL - use finalRedirectUri that matches Facebook settings
  const authParams = new URLSearchParams({
    client_id: FACEBOOK_CLIENT_ID,
    redirect_uri: finalRedirectUri,
    response_type: 'code',
    state,
  })

  // Use config_id if provided (Facebook Login for Business)
  // Otherwise use scope (Consumer login)
  if (FACEBOOK_LOGIN_CONFIG_ID) {
    // Business login - use config_id
    authParams.set('config_id', FACEBOOK_LOGIN_CONFIG_ID)
  } else {
    // Consumer login - use scope with all necessary permissions
    // Request permissions for both reading posts and creating posts
    const scopes = [
      'public_profile',           // Basic profile (name, ID, picture)
      'user_posts',               // Read user's personal posts (requires App Review for production)
      'pages_show_list',          // List user's pages
      'pages_read_engagement',    // Read page posts and engagement metrics
      'pages_read_user_content',  // Read page content (posts, comments, etc.)
      'pages_manage_posts',       // Create and manage posts on pages (requires App Review)
      'pages_manage_metadata',    // Manage page metadata (may be needed for posting)
    ].join(',')
    authParams.set('scope', scopes)
  }

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${authParams.toString()}`
  return NextResponse.redirect(authUrl)
}
