/**
 * Helper function to get the correct base URL and redirect URI for OAuth
 * HARDCODED Vercel URL - NO FALLBACKS, NO DETECTION, JUST WORKS
 */
export function getOAuthUrls(request: Request, callbackPath: string = '/api/oauth/facebook/callback') {
  const requestUrl = new URL(request.url)
  
  // HARDCODED Vercel URL - if we're on vercel.app, use it directly
  const HARDCODED_VERCEL_URL = 'https://marketing-bot-pro.vercel.app'
  
  // Simple check: are we on Vercel?
  const isVercel = requestUrl.host.includes('vercel.app') || requestUrl.host.includes('vercel.com')
  
  // If on Vercel, ALWAYS use hardcoded URL - NO EXCEPTIONS
  if (isVercel) {
    const baseUrl = HARDCODED_VERCEL_URL
    const redirectUri = `${HARDCODED_VERCEL_URL}${callbackPath}`
    
    return {
      baseUrl,
      redirectUri,
      isVercel: true,
      isProduction: true,
      vercelUrl: HARDCODED_VERCEL_URL,
      requestUrl,
    }
  }
  
  // Development fallback (only if NOT on Vercel)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:3000`
  const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || `${baseUrl}${callbackPath}`
  
  return {
    baseUrl,
    redirectUri,
    isVercel: false,
    isProduction: false,
    vercelUrl: null,
    requestUrl,
  }
}
