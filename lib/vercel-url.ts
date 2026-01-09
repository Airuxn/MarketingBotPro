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
  const requestUrl = new URL(request.url)
  const host = requestUrl.host
  const protocol = requestUrl.protocol
  
  // SIMPLE CHECK: If host contains vercel.app or vercel.com, we're on Vercel
  const isVercel = host.includes('vercel.app') || host.includes('vercel.com')
  
  // CRITICAL: On Vercel, ALWAYS use request URL - NO EXCEPTIONS, NO FALLBACKS
  // The request URL is ALWAYS correct because it's the actual domain
  let baseUrl: string
  let redirectUri: string
  
  if (isVercel) {
    // VERCEL: Use request URL directly - this is ALWAYS correct
    baseUrl = `${protocol}//${host}`
    redirectUri = `${baseUrl}${callbackPath}`
    
    console.log('[getOAuthUrls] VERCEL DETECTED - Using request URL directly')
    console.log('[getOAuthUrls] request.url:', request.url)
    console.log('[getOAuthUrls] host:', host)
    console.log('[getOAuthUrls] baseUrl:', baseUrl)
    console.log('[getOAuthUrls] redirectUri:', redirectUri)
  } else {
    // LOCAL: Use localhost
    baseUrl = 'http://localhost:3000'
    redirectUri = `${baseUrl}${callbackPath}`
    console.log('[getOAuthUrls] LOCAL - Using localhost')
  }
  
  return {
    baseUrl,
    redirectUri,
    isVercel,
    isProduction: isVercel,
    vercelUrl: isVercel ? baseUrl : null,
    requestUrl,
  }
}
