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
  
  // Check if we're on Vercel
  const isVercel = !!(
    process.env.VERCEL || 
    requestUrl.host.includes('vercel.app') || 
    requestUrl.host.includes('vercel.com')
  )
  
  // Debug logging
  console.log('[getOAuthUrls] ========== START ==========')
  console.log('[getOAuthUrls] request.url:', request.url)
  console.log('[getOAuthUrls] requestUrl.host:', requestUrl.host)
  console.log('[getOAuthUrls] requestUrl.protocol:', requestUrl.protocol)
  console.log('[getOAuthUrls] isVercel:', isVercel)
  console.log('[getOAuthUrls] VERCEL env:', process.env.VERCEL)
  console.log('[getOAuthUrls] NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'NOT SET')
  console.log('[getOAuthUrls] NEXT_PUBLIC_OAUTH_REDIRECT_URI:', process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'NOT SET')
  
  let baseUrl: string
  let redirectUri: string
  
  if (isVercel) {
    // ON VERCEL: ALWAYS use request URL - it's always correct, no exceptions
    // This completely avoids build cache issues with NEXT_PUBLIC_* variables
    baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
    redirectUri = `${baseUrl}${callbackPath}`
    
    console.log('[getOAuthUrls] ✅ VERCEL: Using request URL (always correct)')
    console.log('[getOAuthUrls] ✅ baseUrl from request:', baseUrl)
    console.log('[getOAuthUrls] ✅ redirectUri from request:', redirectUri)
    
    // Log warning if env vars don't match (for debugging)
    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL
    const envRedirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI
    if (envAppUrl && envAppUrl !== baseUrl) {
      console.log('[getOAuthUrls] ⚠️ NOTE: envAppUrl differs from request URL (this is OK, we use request URL):', envAppUrl)
    }
    if (envRedirectUri && envRedirectUri !== redirectUri) {
      console.log('[getOAuthUrls] ⚠️ NOTE: envRedirectUri differs from request URL (this is OK, we use request URL):', envRedirectUri)
    }
  } else {
    // LOCAL DEVELOPMENT: Use environment variables or localhost fallback
    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL
    const envRedirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI
    
    if (envAppUrl && envAppUrl.trim() !== '') {
      baseUrl = envAppUrl.trim()
      console.log('[getOAuthUrls] ✅ LOCAL: Using envAppUrl:', baseUrl)
    } else {
      baseUrl = 'http://localhost:3000'
      console.log('[getOAuthUrls] ✅ LOCAL: Using localhost fallback')
    }
    
    if (envRedirectUri && envRedirectUri.trim() !== '') {
      redirectUri = envRedirectUri.trim()
      console.log('[getOAuthUrls] ✅ LOCAL: Using envRedirectUri:', redirectUri)
    } else {
      redirectUri = `${baseUrl}${callbackPath}`
      console.log('[getOAuthUrls] ✅ LOCAL: Constructed redirectUri:', redirectUri)
    }
  }
  
  console.log('[getOAuthUrls] Final baseUrl:', baseUrl)
  console.log('[getOAuthUrls] Final redirectUri:', redirectUri)
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
