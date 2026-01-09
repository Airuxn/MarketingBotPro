import { NextResponse } from 'next/server'
import { getOAuthUrls } from '@/lib/vercel-url'

// Instagram Business Login uses Instagram's OAuth endpoint with Instagram App ID
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID

export async function GET(request: Request) {
  // Get URLs using helper function - ensures correct URL on Vercel
  const { baseUrl, redirectUri: baseRedirectUri } = getOAuthUrls(request, '/api/oauth/facebook/callback')
  
  // Construct Instagram redirect URI from base redirect URI
  const instagramRedirectUri = baseRedirectUri.replace('/facebook/callback', '/instagram/callback')
  
  // Debug logging
  console.log('[Instagram OAuth] ========== START ==========')
  console.log('[Instagram OAuth] baseRedirectUri:', baseRedirectUri)
  console.log('[Instagram OAuth] instagramRedirectUri:', instagramRedirectUri)
  console.log('[Instagram OAuth] INSTAGRAM_CLIENT_ID:', INSTAGRAM_CLIENT_ID ? 'SET' : 'NOT SET')
  
  if (!INSTAGRAM_CLIENT_ID) {
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('Instagram OAuth not configured. Please set INSTAGRAM_CLIENT_ID in environment variables. See docs/OAUTH_SETUP.md for setup instructions.')}`
    )
  }

  // Instagram Business Login scopes
  const scopes = [
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_business_manage_comments',
    'instagram_business_content_publish',
    'instagram_business_manage_insights',
  ].join(',')
  
  // Instagram Business Login uses Instagram's OAuth endpoint
  const authUrl = `https://www.instagram.com/oauth/authorize?` +
    `client_id=${INSTAGRAM_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(instagramRedirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code` +
    `&state=social_post`

  console.log('[Instagram OAuth] Redirecting to Instagram:', authUrl)
  console.log('[Instagram OAuth] ========== END ==========')
  
  return NextResponse.redirect(authUrl)
}
