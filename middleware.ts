import { NextRequest, NextResponse } from 'next/server'
import { isSameOriginApiRequest } from '@/lib/api-origin'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // OAuth provider callbacks arrive without same-origin headers.
  if (pathname.includes('/api/oauth/') && pathname.endsWith('/callback')) {
    return NextResponse.next()
  }

  if (!isSameOriginApiRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
