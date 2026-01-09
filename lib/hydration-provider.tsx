'use client'

import { useEffect, useState } from 'react'
import { useStore } from './store'

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Rehydrate store - but don't wait too long
      const rehydratePromise = useStore.persist.rehydrate()
      
      // Set a timeout to ensure we don't wait forever
      const timeout = setTimeout(() => {
        setIsHydrated(true)
      }, 1000) // Max 1 second wait

      if (rehydratePromise && typeof rehydratePromise.then === 'function') {
        rehydratePromise
          .then(() => {
            clearTimeout(timeout)
            setIsHydrated(true)
          })
          .catch((error) => {
            clearTimeout(timeout)
            console.error('Store rehydration error:', error)
            setIsHydrated(true) // Still render children even if rehydration fails
          })
      } else {
        clearTimeout(timeout)
        setIsHydrated(true)
      }
    } else {
      setIsHydrated(true)
    }
  }, [])

  // Always render children - hydration happens in background
  // The store will update when ready
  return <>{children}</>
}
