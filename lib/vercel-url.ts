/**
 * Helper function to get the correct base URL and redirect URI for OAuth
 * NEVER uses localhost on Vercel - always uses Vercel URL or environment variables
 */
export function getOAuthUrls(request: Request, callbackPath: string = '/api/oauth/facebook/callback') {
  // Get base URL - Vercel provides VERCEL_URL automatically
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  const requestUrl = new URL(request.url)
  
  // Check multiple ways to detect Vercel - be VERY explicit
  const isVercel = !!(
    process.env.VERCEL || 
    process.env.VERCEL_URL || 
    requestUrl.host.includes('vercel.app') ||
    requestUrl.host.includes('vercel.com')
  )
  const isProduction = process.env.NODE_ENV === 'production' || isVercel
  
  // Determine base URL dynamically - NEVER use localhost if we're on Vercel
  // Priority: 1. NEXT_PUBLIC_APP_URL (user configured), 2. VERCEL_URL (auto), 3. request URL
  let baseUrl: string
  if (isVercel) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || vercelUrl || `${requestUrl.protocol}//${requestUrl.host}`
    // ABSOLUTELY NO localhost on Vercel - force HTTPS
    if (baseUrl.includes('localhost')) {
      baseUrl = vercelUrl || `https://${requestUrl.host}`
    }
    // Ensure HTTPS
    if (!baseUrl.startsWith('https://')) {
      baseUrl = baseUrl.replace(/^http:\/\//, 'https://')
    }
  } else if (isProduction) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${requestUrl.protocol}//${requestUrl.host}`
  } else {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${requestUrl.protocol}//${requestUrl.host}` || 'http://localhost:3000'
  }
  
  // Build redirect URI - MUST match OAuth provider settings exactly
  // Priority: 1. NEXT_PUBLIC_OAUTH_REDIRECT_URI, 2. FACEBOOK_REDIRECT_URI (for Facebook), 3. auto from baseUrl
  let redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 
                   process.env.FACEBOOK_REDIRECT_URI ||
                   `${baseUrl}${callbackPath}`
  
  // ABSOLUTELY NO localhost in redirect URI on Vercel
  if (isVercel && redirectUri.includes('localhost')) {
    redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 
                 process.env.FACEBOOK_REDIRECT_URI ||
                 (vercelUrl ? `${vercelUrl}${callbackPath}` : `${baseUrl}${callbackPath}`)
  }
  
  // Force HTTPS for production (Vercel always uses HTTPS)
  const finalRedirectUri = isProduction 
    ? redirectUri.replace(/^http:\/\//, 'https://')
    : redirectUri
  
  return {
    baseUrl,
    redirectUri: finalRedirectUri,
    isVercel,
    isProduction,
    vercelUrl,
    requestUrl,
  }
}
