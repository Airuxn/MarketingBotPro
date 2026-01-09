import { NextResponse } from 'next/server'

// Instagram Business Login uses Instagram's OAuth endpoint with Instagram App ID
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID
const REDIRECT_URI = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/oauth/instagram/callback'

export async function GET(request: Request) {
  if (!INSTAGRAM_CLIENT_ID) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
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

  // Use the redirect URI directly (should be set to Instagram callback in .env.local)
  // If it's still set to Facebook callback, replace it
  const instagramRedirectUri = REDIRECT_URI.includes('/instagram/callback') 
    ? REDIRECT_URI 
    : REDIRECT_URI.replace('/facebook/callback', '/instagram/callback')
  
  // Instagram Business Login uses Instagram's OAuth endpoint
  const authUrl = `https://www.instagram.com/oauth/authorize?` +
    `client_id=${INSTAGRAM_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(instagramRedirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code` +
    `&state=social_post`

  return NextResponse.redirect(authUrl)
}
