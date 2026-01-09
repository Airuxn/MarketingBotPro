/**
 * Helper function to get the correct base URL and redirect URI for OAuth
 * HARDCODED Vercel URL - NO FALLBACKS, NO DETECTION, JUST WORKS
 */
export function getOAuthUrls(request: Request, callbackPath: string = '/api/oauth/facebook/callback') {
  const requestUrl = new URL(request.url)
  
  // Simple check: are we on Vercel?
  const isVercel = requestUrl.host.includes('vercel.app') || requestUrl.host.includes('vercel.com')
  
  // ALWAYS prioritize environment variables first (they are set correctly in Vercel)
  // Force use of environment variables - they are set correctly in Vercel
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL
  const envRedirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI
  
  // Debug logging
  console.log('[getOAuthUrls] envAppUrl:', envAppUrl || 'NOT SET')
  console.log('[getOAuthUrls] envRedirectUri:', envRedirectUri || 'NOT SET')
  console.log('[getOAuthUrls] isVercel:', isVercel)
  
  // Use environment variables if set, otherwise fallback
  const baseUrl = envAppUrl || (isVercel ? `https://marketing-bot-pro.vercel.app` : `http://localhost:3000`)
  const redirectUri = envRedirectUri || `${baseUrl}${callbackPath}`
  
  console.log('[getOAuthUrls] Final baseUrl:', baseUrl)
  console.log('[getOAuthUrls] Final redirectUri:', redirectUri)
  
  return {
    baseUrl,
    redirectUri,
    isVercel,
    isProduction: isVercel,
    vercelUrl: isVercel ? baseUrl : null,
    requestUrl,
  }
}
