import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getOAuthUrls } from '@/lib/vercel-url'

// Instagram Business Login uses Facebook OAuth
// We use Facebook credentials because Instagram Business accounts are accessed through Facebook Pages
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID || FACEBOOK_CLIENT_ID
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET || FACEBOOK_CLIENT_SECRET

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason')
  
  // Get redirect URI - use same helper as OAuth route (which uses '/api/oauth/instagram/callback')
  const { baseUrl, redirectUri: INSTAGRAM_REDIRECT_URI } = getOAuthUrls(request, '/api/oauth/instagram/callback')
  
  // Debug logging
  console.log('[Instagram Callback] ========== START ==========')
  console.log('[Instagram Callback] code:', code ? 'PRESENT' : 'MISSING')
  console.log('[Instagram Callback] error:', error || 'NONE')
  console.log('[Instagram Callback] FACEBOOK_CLIENT_ID:', FACEBOOK_CLIENT_ID ? 'SET' : 'NOT SET')
  console.log('[Instagram Callback] FACEBOOK_CLIENT_SECRET:', FACEBOOK_CLIENT_SECRET ? 'SET' : 'NOT SET')
  console.log('[Instagram Callback] INSTAGRAM_CLIENT_ID:', INSTAGRAM_CLIENT_ID ? 'SET' : 'NOT SET')
  console.log('[Instagram Callback] INSTAGRAM_CLIENT_SECRET:', INSTAGRAM_CLIENT_SECRET ? 'SET' : 'NOT SET')
  console.log('[Instagram Callback] INSTAGRAM_REDIRECT_URI:', INSTAGRAM_REDIRECT_URI)
  console.log('[Instagram Callback] Request URL:', request.url)

  if (error) {
    console.log('[Instagram Callback] Error from Instagram:', errorReason || error)
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent(errorReason || error)}`
    )
  }

  if (!code) {
    console.log('[Instagram Callback] No code received')
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=no_code`
    )
  }

  // For Instagram Business Login, we need Facebook credentials
  const clientId = FACEBOOK_CLIENT_ID || INSTAGRAM_CLIENT_ID
  const clientSecret = FACEBOOK_CLIENT_SECRET || INSTAGRAM_CLIENT_SECRET

  if (!clientId) {
    console.log('[Instagram Callback] No client ID found (FACEBOOK_CLIENT_ID or INSTAGRAM_CLIENT_ID)')
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('Instagram OAuth not configured. Please set FACEBOOK_CLIENT_ID or INSTAGRAM_CLIENT_ID in environment variables.')}`
    )
  }

  if (!clientSecret) {
    console.log('[Instagram Callback] No client secret found (FACEBOOK_CLIENT_SECRET or INSTAGRAM_CLIENT_SECRET)')
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent('Instagram OAuth not configured. Please set FACEBOOK_CLIENT_SECRET or INSTAGRAM_CLIENT_SECRET in environment variables.')}`
    )
  }

  try {
    // Exchange code for access token
    // Try Instagram API first (if using direct Instagram OAuth), then Facebook Graph API
    console.log('[Instagram Callback] ========== TOKEN EXCHANGE START ==========')
    console.log('[Instagram Callback] Code received:', code ? 'YES' : 'NO')
    console.log('[Instagram Callback] Using client_id:', clientId)
    console.log('[Instagram Callback] Using redirect_uri:', INSTAGRAM_REDIRECT_URI)
    
    // Try Instagram API first (for direct Instagram OAuth)
    const instagramTokenUrl = `https://api.instagram.com/oauth/access_token`
    const instagramBody = new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      grant_type: 'authorization_code',
      redirect_uri: INSTAGRAM_REDIRECT_URI,
      code: code,
    })
    
    console.log('[Instagram Callback] Trying Instagram API endpoint first...')
    let tokenResponse = await fetch(instagramTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: instagramBody,
    })
    
    const instagramResponseText = await tokenResponse.text()
    let instagramErrorData: any = {}
    try {
      instagramErrorData = JSON.parse(instagramResponseText)
    } catch {
      instagramErrorData = { raw: instagramResponseText }
    }
    
    console.log('[Instagram Callback] Instagram API response status:', tokenResponse.status)
    console.log('[Instagram Callback] Instagram API response:', JSON.stringify(instagramErrorData, null, 2))
    
    // If Instagram API fails, try Facebook Graph API (for Facebook OAuth)
    let usedFacebookAPI = false
    let finalTokenResponse = tokenResponse
    let finalResponseText: string | undefined = instagramResponseText
    
    if (!tokenResponse.ok) {
      console.log('[Instagram Callback] Instagram API failed, trying Facebook Graph API...')
      
      const tokenExchangeUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${clientId}` +
        `&client_secret=${clientSecret}` +
        `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}` +
        `&code=${code}`
      
      console.log('[Instagram Callback] Token exchange URL (without secret):', tokenExchangeUrl.replace(/client_secret=[^&]+/, 'client_secret=***'))
      console.log('[Instagram Callback] Calling Facebook Graph API...')
      finalTokenResponse = await fetch(tokenExchangeUrl, { method: 'GET' })
      usedFacebookAPI = true
    
      finalResponseText = await finalTokenResponse.text()
      
      console.log('[Instagram Callback] Facebook Graph API response status:', finalTokenResponse.status)
      console.log('[Instagram Callback] Facebook Graph API response body:', finalResponseText)
    } else {
      // Instagram API succeeded
      finalResponseText = instagramResponseText
    }

    if (!finalTokenResponse.ok) {
      // Get error text from the appropriate response
      let errorText: string
      try {
        if (finalResponseText) {
          errorText = finalResponseText
        } else {
          errorText = await finalTokenResponse.text()
        }
      } catch {
        errorText = 'Failed to read error response'
      }
      
      let errorData: any = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { raw: errorText, message: 'Failed to parse error response' }
      }
      
      console.error('[Instagram Callback] ========== TOKEN EXCHANGE FAILED ==========')
      console.error('[Instagram Callback] Final status:', finalTokenResponse.status)
      console.error('[Instagram Callback] Final response text:', errorText)
      console.error('[Instagram Callback] Final response parsed:', JSON.stringify(errorData, null, 2))
      console.error('[Instagram Callback] Redirect URI used:', INSTAGRAM_REDIRECT_URI)
      console.error('[Instagram Callback] Client ID used:', clientId)
      console.error('[Instagram Callback] Used Facebook API:', usedFacebookAPI)
      console.error('[Instagram Callback] ============================================')
      
      // Extract detailed error message - show user exactly what Facebook says
      let errorMessage = errorData.error?.message || 
                        errorData.error?.error_user_msg || 
                        errorData.message || 
                        errorData.raw || 
                        `Failed to exchange code for token (status: ${finalTokenResponse.status})`
      
      // Add error code and subcode if available
      if (errorData.error) {
        if (errorData.error.code) {
          errorMessage += ` [Code: ${errorData.error.code}]`
        }
        if (errorData.error.error_subcode) {
          errorMessage += ` [Subcode: ${errorData.error.error_subcode}]`
        }
        if (errorData.error.type) {
          errorMessage += ` [Type: ${errorData.error.type}]`
        }
      }
      
      // Common error messages with solutions
      if (errorMessage.includes('redirect_uri') || errorMessage.includes('Redirect URI')) {
        errorMessage += ` - Make sure ${INSTAGRAM_REDIRECT_URI} is in Facebook App Settings → Valid OAuth Redirect URIs`
      }
      if (errorMessage.includes('code') && (errorMessage.includes('invalid') || errorMessage.includes('expired'))) {
        errorMessage += ' - Try the OAuth flow again (codes are single-use and expire quickly)'
      }
      
      // Log the full error for debugging
      console.error('[Instagram Callback] Full error object:', JSON.stringify(errorData, null, 2))
      console.error('[Instagram Callback] Redirect URI that should be in Facebook settings:', INSTAGRAM_REDIRECT_URI)
      
      throw new Error(errorMessage)
    }

    // Parse successful response - use the correct response text
    let tokenData: any
    try {
      if (finalTokenResponse.ok && finalTokenResponse.status === 200 && finalResponseText) {
        // Parse the response text (either Facebook or Instagram API)
        tokenData = JSON.parse(finalResponseText)
        console.log('[Instagram Callback] Parsed token response successfully')
        console.log('[Instagram Callback] Used Facebook API:', usedFacebookAPI)
        console.log('[Instagram Callback] Response has access_token:', !!tokenData.access_token)
      } else {
        // Fallback: try to read from response stream
        console.log('[Instagram Callback] Falling back to reading from response stream')
        tokenData = await finalTokenResponse.json()
        console.log('[Instagram Callback] Parsed token response from stream')
      }
    } catch (parseError: any) {
      console.error('[Instagram Callback] Failed to parse token response:', parseError)
      console.error('[Instagram Callback] Response status:', finalTokenResponse.status)
      console.error('[Instagram Callback] Used Facebook API:', usedFacebookAPI)
      console.error('[Instagram Callback] Response text:', finalResponseText || instagramResponseText || 'N/A')
      throw new Error(`Failed to parse token response: ${parseError.message}`)
    }
    const accessToken = tokenData.access_token
    // Instagram Business Login token response might include user_id directly
    let userId: string | undefined = tokenData.user_id
    
    // Log token info for debugging
    console.log('[Instagram Callback] Token received:', accessToken ? 'YES' : 'NO')
    console.log('[Instagram Callback] Token type:', tokenData.token_type || 'unknown')
    console.log('[Instagram Callback] Token expires in:', tokenData.expires_in || 'unknown', 'seconds')
    console.log('[Instagram Callback] Full token response:', JSON.stringify({ ...tokenData, access_token: '***' }, null, 2))

    if (!accessToken) {
      throw new Error('No access token received')
    }

    // If userId not in token response, try to get it from Facebook Graph API
    // Note: Instagram Graph API /me requires a message to be sent first, so we use Facebook API instead
    if (!userId) {
      try {
        console.log('[Instagram Callback] Attempting to get Instagram Business Account ID from Facebook Pages...')
        
        // Use Facebook Graph API /me/accounts to get pages with Instagram connected
        const pagesResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,instagram_business_account`
        )
        
        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json()
          const pages = pagesData.data || []
          
          console.log(`[Instagram Callback] Found ${pages.length} Facebook pages`)
          
          // Try all pages to find one with Instagram connected
          for (const page of pages) {
            if (page.instagram_business_account?.id) {
              userId = page.instagram_business_account.id
              console.log(`[Instagram Callback] Found Instagram Business Account ID: ${userId} for page: ${page.name || page.id}`)
              break
            }
          }
          
          // If not found in initial response, try fetching each page individually
          if (!userId && pages.length > 0) {
            console.log('[Instagram Callback] Instagram Business Account ID not in initial response, trying individual page requests...')
            for (const page of pages) {
              try {
                const igAccountResponse = await fetch(
                  `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
                )
                if (igAccountResponse.ok) {
                  const igData = await igAccountResponse.json()
                  if (igData.instagram_business_account?.id) {
                    userId = igData.instagram_business_account.id
                    console.log(`[Instagram Callback] Found Instagram Business Account ID: ${userId} for page: ${page.id}`)
                    break
                  }
                }
              } catch (err) {
                console.error(`[Instagram Callback] Error checking page ${page.id}:`, err)
                continue
              }
            }
          }
        } else {
          const errorData = await pagesResponse.json().catch(() => ({}))
          console.warn('[Instagram Callback] Could not fetch Facebook pages:', errorData)
        }
        
        if (!userId) {
          console.warn('[Instagram Callback] No Instagram Business Account ID found. This is OK - the account will be connected but some features may require the ID.')
          console.warn('[Instagram Callback] To get the ID later:')
          console.warn('[Instagram Callback] 1. Make sure your Instagram account is a Business or Creator account')
          console.warn('[Instagram Callback] 2. Make sure your Instagram account is connected to a Facebook Page')
          console.warn('[Instagram Callback] 3. The ID will be retrieved automatically when needed')
        }
      } catch (error: any) {
        console.warn('[Instagram Callback] Error retrieving Instagram Business Account ID (non-fatal):', error?.message || error)
        // Don't throw - OAuth succeeded, we just don't have the userId yet
      }
    } else {
      console.log(`[Instagram Callback] Got Instagram Business Account ID from token response: ${userId}`)
    }

    // Store token temporarily
    const cookieStore = await cookies()
    cookieStore.set('oauth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
    })
    
    if (userId) {
      cookieStore.set('oauth_user_id', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60,
      })
    }
    
    cookieStore.set('oauth_platform', 'instagram', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
    })

    console.log('[Instagram Callback] ========== SUCCESS ==========')
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_success=instagram`
    )
  } catch (error: any) {
    console.error('[Instagram Callback] ========== ERROR ==========')
    console.error('[Instagram Callback] Error type:', typeof error)
    console.error('[Instagram Callback] Error message:', error?.message)
    console.error('[Instagram Callback] Error stack:', error?.stack)
    console.error('[Instagram Callback] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    
    // Include detailed error message in redirect
    const errorMessage = error?.message || 'oauth_failed'
    const errorDetails = error?.message?.includes('Code:') || error?.message?.includes('Subcode:') 
      ? errorMessage 
      : `${errorMessage} - Check Vercel logs for details`
    
    console.error('[Instagram Callback] Redirecting with error:', errorDetails)
    return NextResponse.redirect(
      `${baseUrl}/settings?oauth_error=${encodeURIComponent(errorDetails)}`
    )
  }
}
