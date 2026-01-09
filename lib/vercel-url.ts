/**
 * Helper function to get the correct base URL and redirect URI for OAuth
 * HARDCODED Vercel URL - NO FALLBACKS, NO DETECTION, JUST WORKS
 */
export function getOAuthUrls(request: Request, callbackPath: string = '/api/oauth/facebook/callback') {
  const requestUrl = new URL(request.url)
  
  // Simple check: are we on Vercel?
  const isVercel = requestUrl.host.includes('vercel.app') || requestUrl.host.includes('vercel.com')
  
  // FORCE use of environment variables - they MUST be set in Vercel
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL
  const envRedirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI
  
  // Debug logging - EXTENSIVE
  console.log('[getOAuthUrls] ========== START ==========')
  console.log('[getOAuthUrls] envAppUrl (raw):', envAppUrl)
  console.log('[getOAuthUrls] envAppUrl (type):', typeof envAppUrl)
  console.log('[getOAuthUrls] envAppUrl (length):', envAppUrl?.length)
  console.log('[getOAuthUrls] envRedirectUri (raw):', envRedirectUri)
  console.log('[getOAuthUrls] envRedirectUri (type):', typeof envRedirectUri)
  console.log('[getOAuthUrls] isVercel:', isVercel)
  console.log('[getOAuthUrls] request.url:', request.url)
  console.log('[getOAuthUrls] requestUrl.host:', requestUrl.host)
  
  // CRITICAL: On Vercel, ALWAYS use environment variables if they exist
  // If they don't exist, use the request URL to construct the base URL
  let baseUrl: string
  let redirectUri: string
  
  if (envAppUrl && envAppUrl.trim() !== '') {
    // Environment variable is set - USE IT
    baseUrl = envAppUrl.trim()
    console.log('[getOAuthUrls] Using envAppUrl:', baseUrl)
  } else if (isVercel) {
    // On Vercel but no env var - construct from request
    baseUrl = `https://${requestUrl.host}`
    console.log('[getOAuthUrls] Constructed from request URL:', baseUrl)
  } else {
    // Local development
    baseUrl = 'http://localhost:3000'
    console.log('[getOAuthUrls] Using localhost')
  }
  
  if (envRedirectUri && envRedirectUri.trim() !== '') {
    // Environment variable is set - USE IT
    redirectUri = envRedirectUri.trim()
    console.log('[getOAuthUrls] Using envRedirectUri:', redirectUri)
  } else {
    // Construct from baseUrl
    redirectUri = `${baseUrl}${callbackPath}`
    console.log('[getOAuthUrls] Constructed redirectUri:', redirectUri)
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
