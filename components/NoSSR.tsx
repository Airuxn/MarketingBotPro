'use client'

import { useEffect, useState } from 'react'

export function NoSSR({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return fallback ? <>{fallback}</> : <div style={{ display: 'none' }} aria-hidden="true" />
  }

  return <>{children}</>
}
