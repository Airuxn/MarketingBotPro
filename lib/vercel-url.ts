/**
 * Helper function to get the correct base URL and redirect URI for OAuth
 * 
 * CRITICAL FIX: On Vercel, ALWAYS use request URL, NEVER use NEXT_PUBLIC_* variables
 * 
 * Why? NEXT_PUBLIC_* variables are embedded at BUILD TIME. If the build was done
 * with old environment variables, they will contain old values even after you update
 * them in Vercel dashboard. The request URL is always correct because it's the
 * actual domain where the request comes from.
 */
export function getOAuthUrls(request: Request, callbackPath: string = '/api/oauth/facebook/callback') {
  // CRITICAL: Always use request URL - it's always correct
  const requestUrl = new URL(request.url)
  const host = requestUrl.host
  const protocol = requestUrl.protocol
  
  // Check if we're on Vercel
  const isVercel = host.includes('vercel.app') || host.includes('vercel.com') || !!process.env.VERCEL
  
  // ALWAYS use request URL - no exceptions, no fallbacks, no environment variables
  const baseUrl = `${protocol}//${host}`
  const redirectUri = `${baseUrl}${callbackPath}`
  
  // EXTENSIVE logging to debug
  console.log('[getOAuthUrls] ========== START ==========')
  console.log('[getOAuthUrls] request.url:', request.url)
  console.log('[getOAuthUrls] host:', host)
  console.log('[getOAuthUrls] protocol:', protocol)
  console.log('[getOAuthUrls] isVercel:', isVercel)
  console.log('[getOAuthUrls] VERCEL env:', process.env.VERCEL)
  console.log('[getOAuthUrls] baseUrl (from request):', baseUrl)
  console.log('[getOAuthUrls] redirectUri (from request):', redirectUri)
  console.log('[getOAuthUrls] ========== END ==========')
  
  return {
    baseUrl,
    redirectUri,
    isVercel,
    isProduction: isVercel,
    vercelUrl: isVercel ? baseUrl : null,
    requestUrl,
  }
}
// Force new build - Fr 09 Jan 2026 15:21:05 CET
