import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// This route uses cookies, so it must be dynamic
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('oauth_token')?.value
    const userId = cookieStore.get('oauth_user_id')?.value
    const platform = cookieStore.get('oauth_platform')?.value

    console.log('[OAuth Token] Retrieving OAuth token from cookies:', {
      hasToken: !!token,
      hasUserId: !!userId,
      userId: userId || 'NOT SET',
      platform: platform || 'NOT SET',
    })

    if (!token || !platform) {
      console.error('[OAuth Token] Missing required data:', {
        hasToken: !!token,
        hasPlatform: !!platform,
      })
      return NextResponse.json(
        { error: 'No OAuth token found' },
        { status: 404 }
      )
    }

    // Clear cookies after reading
    cookieStore.delete('oauth_token')
    cookieStore.delete('oauth_user_id')
    cookieStore.delete('oauth_platform')

    const response = {
      accessToken: token,
      userId: userId || undefined,
      platform,
    }

    console.log('[OAuth Token] Returning token data:', {
      platform: response.platform,
      hasAccessToken: !!response.accessToken,
      hasUserId: !!response.userId,
      userId: response.userId || 'NOT SET - THIS WILL CAUSE SCANNING TO FAIL!',
    })

    if (platform === 'twitter' && !response.userId) {
      console.error('[OAuth Token] WARNING: Twitter token missing userId!')
      console.error('[OAuth Token] The Twitter account will be saved without userId, causing scanning to fail.')
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[OAuth Token] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve OAuth token' },
      { status: 500 }
    )
  }
}
