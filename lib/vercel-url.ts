/**
 * Helper function to get the correct base URL and redirect URI for OAuth
 * HARDCODED Vercel URL - NO FALLBACKS, NO DETECTION, JUST WORKS
 */
export function getOAuthUrls(request: Request, callbackPath: string = '/api/oauth/facebook/callback') {
  const requestUrl = new URL(request.url)
  
  // Simple check: are we on Vercel?
  const isVercel = requestUrl.host.includes('vercel.app') || requestUrl.host.includes('vercel.com')
  
  // ALWAYS prioritize environment variables first (they are set correctly in Vercel)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (isVercel ? `https://marketing-bot-pro.vercel.app` : `http://localhost:3000`)
  const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || `${baseUrl}${callbackPath}`
  
  return {
    baseUrl,
    redirectUri,
    isVercel,
    isProduction: isVercel,
    vercelUrl: isVercel ? baseUrl : null,
    requestUrl,
  }
}
