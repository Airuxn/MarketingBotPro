import { NextResponse } from 'next/server'

/**
 * Debug endpoint to test Instagram OAuth configuration
 * Visit: https://marketing-bot-pro.vercel.app/api/debug-instagram-oauth
 */
export async function GET() {
  const config = {
    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID ? 'SET' : 'NOT SET',
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET ? 'SET' : 'NOT SET',
    FACEBOOK_LOGIN_CONFIG_ID: process.env.FACEBOOK_LOGIN_CONFIG_ID || 'NOT SET',
    INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID ? 'SET' : 'NOT SET',
    INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    NEXT_PUBLIC_OAUTH_REDIRECT_URI: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'NOT SET',
    VERCEL: process.env.VERCEL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  }

  // Calculate expected redirect URI
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const baseRedirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || `${baseUrl}/api/oauth/facebook/callback`
  const instagramRedirectUri = baseRedirectUri.replace('/facebook/callback', '/instagram/callback')

  return NextResponse.json({
    message: 'Instagram OAuth Debug Info',
    config,
    expectedUrls: {
      baseUrl,
      baseRedirectUri,
      instagramRedirectUri,
      facebookOAuthUrl: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_CLIENT_ID || 'YOUR_CLIENT_ID'}&redirect_uri=${encodeURIComponent(instagramRedirectUri)}&response_type=code&state=instagram_business`,
    },
    instructions: {
      step1: 'Make sure FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET are set',
      step2: `Add this redirect URI to Facebook App Settings: ${instagramRedirectUri}`,
      step3: 'Use "Instagram API with Facebook login" in Facebook Developers',
      step4: 'Make sure your Instagram account is a Business/Creator account connected to a Facebook Page',
    },
    timestamp: new Date().toISOString(),
  }, { status: 200 })
}
