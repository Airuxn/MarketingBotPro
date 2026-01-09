/**
 * Helper function to get the correct base URL and redirect URI for OAuth
 * CRITICAL: This MUST use environment variables, not build-time values
 */
export function getOAuthUrls(request: Request, callbackPath: string = '/api/oauth/facebook/callback') {
  const requestUrl = new URL(request.url)
  
  // Simple check: are we on Vercel?
  const isVercel = requestUrl.host.includes('vercel.app') || requestUrl.host.includes('vercel.com')
  
  // CRITICAL: Read environment variables at RUNTIME, not build-time
  // NEXT_PUBLIC_* variables are embedded at build time, but we need runtime values
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL
  const envRedirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI
  
  // EXTENSIVE debug logging
  console.log('[getOAuthUrls] ========== START ==========')
  console.log('[getOAuthUrls] envAppUrl:', envAppUrl || 'NOT SET')
  console.log('[getOAuthUrls] envAppUrl type:', typeof envAppUrl)
  console.log('[getOAuthUrls] envAppUrl length:', envAppUrl?.length)
  console.log('[getOAuthUrls] envRedirectUri:', envRedirectUri || 'NOT SET')
  console.log('[getOAuthUrls] envRedirectUri type:', typeof envRedirectUri)
  console.log('[getOAuthUrls] isVercel:', isVercel)
  console.log('[getOAuthUrls] request.url:', request.url)
  console.log('[getOAuthUrls] requestUrl.host:', requestUrl.host)
  
  // FORCE use of environment variables - they MUST be set correctly
  let baseUrl: string
  let redirectUri: string
  
  if (envAppUrl && envAppUrl.trim() !== '' && !envAppUrl.includes('[your-project]')) {
    // Environment variable is set and correct - USE IT
    baseUrl = envAppUrl.trim()
    console.log('[getOAuthUrls] ✅ Using envAppUrl:', baseUrl)
  } else if (isVercel) {
    // On Vercel - use the request host (this is the actual domain)
    baseUrl = `https://${requestUrl.host}`
    console.log('[getOAuthUrls] ⚠️ Constructed from request URL:', baseUrl)
    if (envAppUrl) {
      console.log('[getOAuthUrls] ⚠️ WARNING: envAppUrl exists but contains old URL:', envAppUrl)
    }
  } else {
    // Local development
    baseUrl = 'http://localhost:3000'
    console.log('[getOAuthUrls] Using localhost')
  }
  
  if (envRedirectUri && envRedirectUri.trim() !== '' && !envRedirectUri.includes('[your-project]')) {
    // Environment variable is set and correct - USE IT
    redirectUri = envRedirectUri.trim()
    console.log('[getOAuthUrls] ✅ Using envRedirectUri:', redirectUri)
  } else {
    // Construct from baseUrl
    redirectUri = `${baseUrl}${callbackPath}`
    console.log('[getOAuthUrls] ⚠️ Constructed redirectUri:', redirectUri)
    if (envRedirectUri) {
      console.log('[getOAuthUrls] ⚠️ WARNING: envRedirectUri exists but contains old URL:', envRedirectUri)
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
