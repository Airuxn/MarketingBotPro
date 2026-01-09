import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('oauth_token')?.value
    const userId = cookieStore.get('oauth_user_id')?.value
    const platform = cookieStore.get('oauth_platform')?.value

    if (!token || !platform) {
      return NextResponse.json(
        { error: 'No OAuth token found' },
        { status: 404 }
      )
    }

    // Clear cookies after reading
    cookieStore.delete('oauth_token')
    cookieStore.delete('oauth_user_id')
    cookieStore.delete('oauth_platform')

    return NextResponse.json({
      accessToken: token,
      userId: userId || undefined,
      platform,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve OAuth token' },
      { status: 500 }
    )
  }
}
