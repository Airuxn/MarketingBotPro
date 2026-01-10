import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    // Validate Twitter token by calling the /users/me endpoint
    try {
      const meResponse = await fetch('https://api.twitter.com/2/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken.trim()}`,
        },
      })

      if (!meResponse.ok) {
        const errorData = await meResponse.json().catch(() => ({}))
        const errorMessage = errorData.detail || errorData.title || 'Invalid access token'
        const errorCode = errorData.status || meResponse.status

        return NextResponse.json(
          {
            valid: false,
            error: errorMessage,
            errorType: errorData.type || 'invalid_token',
            errorCode,
          },
          { status: 400 }
        )
      }

      const userData = await meResponse.json()

      if (userData.data && userData.data.id) {
        return NextResponse.json({
          valid: true,
          userId: userData.data.id,
          username: userData.data.username,
          name: userData.data.name,
          source: 'twitter_api',
        })
      } else {
        return NextResponse.json(
          {
            valid: false,
            error: 'Token is valid but could not retrieve user information',
            errorType: 'no_user_data',
          },
          { status: 400 }
        )
      }
    } catch (fetchError: any) {
      console.error('Twitter API error:', fetchError)
      return NextResponse.json(
        {
          valid: false,
          error: fetchError.message || 'Failed to validate token with Twitter API',
          errorType: 'api_error',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      {
        valid: false,
        error: error.message || 'Invalid request',
        errorType: 'request_error',
      },
      { status: 400 }
    )
  }
}
