import { NextRequest } from 'next/server'

function getAllowedHosts(request: NextRequest): Set<string> {
  const hosts = new Set<string>()

  const requestHost = request.nextUrl.host.toLowerCase()
  if (requestHost) hosts.add(requestHost)

  for (const value of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ]) {
    if (!value) continue
    try {
      hosts.add(new URL(value).host.toLowerCase())
    } catch {
      // ignore invalid env values
    }
  }

  hosts.add('localhost:3000')
  hosts.add('127.0.0.1:3000')

  return hosts
}

function hostFromHeader(value: string | null): string | null {
  if (!value) return null
  try {
    return new URL(value).host.toLowerCase()
  } catch {
    return null
  }
}

/** Allow browser-originated API calls; block direct third-party abuse in production. */
export function isSameOriginApiRequest(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  const allowedHosts = getAllowedHosts(request)
  const originHost = hostFromHeader(request.headers.get('origin'))
  const refererHost = hostFromHeader(request.headers.get('referer'))

  if (originHost && allowedHosts.has(originHost)) return true
  if (refererHost && allowedHosts.has(refererHost)) return true

  return false
}
