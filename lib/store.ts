import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useState, useEffect } from 'react'

export interface MediaFile {
  file: File
  preview: string
  type: 'image' | 'video'
  width?: number
  height?: number
  size: number
  validated: boolean
  error?: string
  warnings?: string[]
}

export interface Post {
  id: string
  content: string
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram'
  scheduledFor?: string
  postedAt?: string // When the post was actually published
  status: 'draft' | 'scheduled' | 'posted'
  createdAt: string
  media?: {
    file: string // Base64 or URL
    type: 'image' | 'video'
    width?: number
    height?: number
  }
  engagement?: {
    views: number
    likes: number
    comments: number
    shares: number
    reach: number
    lastUpdated: string
  }
  contentType?: 'text' | 'image' | 'video' | 'carousel'
  hashtags?: string[]
  hasMedia: boolean
}

export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'converted'
  notes?: string
  createdAt: string
}

export interface Contact {
  id: string
  name: string
  email: string
  phone?: string
}

export interface ContactList {
  id: string
  name: string
  contacts: Contact[]
  createdAt: string
  updatedAt: string
}

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  content: string
  recipients: string[]
  status: 'draft' | 'scheduled' | 'sent'
  scheduledFor?: string
  createdAt: string
}

export interface Store {
  posts: Post[]
  leads: Lead[]
  contactLists: ContactList[]
  emailCampaigns: EmailCampaign[]
  stats: {
    postsCreated: number
    emailsSent: number
    leadsCaptured: number
    engagementRate: number
  }
  settings: {
    geminiApiKey?: string
    businessName?: string
    businessType?: string
    targetAudience?: string
    brandImages?: Array<{
      id: string
      url: string
      sourceUrl: string
      platform: string
      extractedAt: string
      tags?: string[]
      description?: string
    }> // Store brand images from previous posts
    adAccounts?: Array<{
      platform: string
      accountId: string
      name: string
      accessToken?: string
      refreshToken?: string
      connected: boolean
      connectedAt?: string
    }> // Connected ad platform accounts
    socialAccounts?: Array<{
      platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram'
      accessToken: string
      userId?: string
      connected: boolean
      connectedAt?: string
    }> // Connected social media accounts for auto-scanning
    contentPreferences?: {
      acceptedContent?: Array<{
        content: string
        contentType: 'post' | 'email' | 'ad'
        platform: string
        acceptedAt: string
        prompt: string
      }>
      edits?: Array<{
        originalContent: string
        editedContent: string
        contentType: 'post' | 'email' | 'ad'
        platform: string
        editedAt: string
        prompt: string
      }>
      learnedStyle?: {
        tone?: string[]
        length?: 'short' | 'medium' | 'long'
        hashtagUsage?: 'none' | 'minimal' | 'moderate' | 'heavy'
        emojiUsage?: 'none' | 'minimal' | 'moderate'
        ctaStyle?: string[]
        structure?: string[]
      }
      scannedPosts?: Array<{
        id: string
        platform: string
        content: string
        images?: string[] // Images from the post
        createdAt: string
        styleAnalysis: {
          tone: string[]
          structure: string[]
          commonPhrases: string[]
          hashtagStyle: string[]
          callToAction: string[]
          length: { min: number; max: number; average: number }
          emojiUsage: boolean
          formatting: string[]
        }
        engagement?: {
          likes?: number
          comments?: number
          shares?: number
        }
      }> // Scanned posts with style analysis for learning
    }
  }
  addPost: (post: Post) => void
  updatePost: (id: string, post: Partial<Post>) => void
  deletePost: (id: string) => void
  addLead: (lead: Lead) => void
  updateLead: (id: string, lead: Partial<Lead>) => void
  deleteLead: (id: string) => void
  addContactList: (list: ContactList) => void
  updateContactList: (id: string, list: Partial<ContactList>) => void
  deleteContactList: (id: string) => void
  addContactToList: (listId: string, contact: Contact) => void
  deleteContactFromList: (listId: string, contactId: string) => void
  updateContactInList: (listId: string, contactId: string, contact: Partial<Contact>) => void
  addEmailCampaign: (campaign: EmailCampaign) => void
  updateEmailCampaign: (id: string, campaign: Partial<EmailCampaign>) => void
  deleteEmailCampaign: (id: string) => void
  updateStats: (stats: Partial<Store['stats']>) => void
  updateSettings: (settings: Partial<Store['settings']>) => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      posts: [],
      leads: [],
      contactLists: [],
      emailCampaigns: [],
      stats: {
        postsCreated: 0,
        emailsSent: 0,
        leadsCaptured: 0,
        engagementRate: 0,
      },
      settings: {},
      addPost: (post) =>
        set((state) => {
          const updatedPosts = [...state.posts, post]
          // Limit to last 50 posts (optimized for free-tier: ~2KB each = ~100KB total)
          // Free-tier: Limited posting capabilities, fewer posts created
          let trimmedPosts = updatedPosts
          if (updatedPosts.length > 50) {
            const sorted = [...updatedPosts].sort((a, b) => {
              if (a.status === 'draft' && b.status !== 'draft') return 1
              if (a.status !== 'draft' && b.status === 'draft') return -1
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            })
            trimmedPosts = sorted.slice(0, 50)
          }
          return {
            posts: trimmedPosts,
            stats: {
              ...state.stats,
              postsCreated: state.stats.postsCreated + 1,
            },
          }
        }),
      updatePost: (id, post) =>
        set((state) => ({
          posts: state.posts.map((p) => (p.id === id ? { ...p, ...post } : p)),
        })),
      deletePost: (id) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
        })),
      addLead: (lead) =>
        set((state) => {
          const updatedLeads = [...state.leads, lead]
          // Limit to last 50 leads (optimized for free-tier: ~0.5KB each = ~25KB total)
          const trimmedLeads = updatedLeads.length > 50 ? updatedLeads.slice(-50) : updatedLeads
          return {
            leads: trimmedLeads,
            stats: {
              ...state.stats,
              leadsCaptured: state.stats.leadsCaptured + 1,
            },
          }
        }),
      updateLead: (id, lead) =>
        set((state) => ({
          leads: state.leads.map((l) => (l.id === id ? { ...l, ...lead } : l)),
        })),
      deleteLead: (id) =>
        set((state) => ({
          leads: state.leads.filter((l) => l.id !== id),
        })),
      addContactList: (list) =>
        set((state) => {
          const updatedLists = [...state.contactLists, list]
          // Limit to 100 contact lists (can contain many leads, ~5KB each = ~500KB max)
          // Limit to 20 contact lists (optimized: ~5KB each = ~100KB total, can contain many contacts)
          const trimmedLists = updatedLists.length > 20 ? updatedLists.slice(-20) : updatedLists
          return {
            contactLists: trimmedLists,
          }
        }),
      updateContactList: (id, list) =>
        set((state) => ({
          contactLists: state.contactLists.map((l) =>
            l.id === id ? { ...l, ...list, updatedAt: new Date().toISOString() } : l
          ),
        })),
      deleteContactList: (id) =>
        set((state) => ({
          contactLists: state.contactLists.filter((l) => l.id !== id),
        })),
      addContactToList: (listId, contact) =>
        set((state) => ({
          contactLists: state.contactLists.map((list) =>
            list.id === listId
              ? { ...list, contacts: [...list.contacts, contact], updatedAt: new Date().toISOString() }
              : list
          ),
        })),
      deleteContactFromList: (listId, contactId) =>
        set((state) => ({
          contactLists: state.contactLists.map((list) =>
            list.id === listId
              ? { ...list, contacts: list.contacts.filter((c) => c.id !== contactId), updatedAt: new Date().toISOString() }
              : list
          ),
        })),
      updateContactInList: (listId, contactId, contact) =>
        set((state) => ({
          contactLists: state.contactLists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  contacts: list.contacts.map((c) =>
                    c.id === contactId ? { ...c, ...contact } : c
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : list
          ),
        })),
      addEmailCampaign: (campaign) =>
        set((state) => {
          const updatedCampaigns = [...state.emailCampaigns, campaign]
          // Limit to last 30 email campaigns (optimized: ~3KB each = ~90KB total)
          const trimmedCampaigns = updatedCampaigns.length > 30 ? updatedCampaigns.slice(-30) : updatedCampaigns
          return {
            emailCampaigns: trimmedCampaigns,
            stats: {
              ...state.stats,
              emailsSent: state.stats.emailsSent + campaign.recipients.length,
            },
          }
        }),
      updateEmailCampaign: (id, campaign) =>
        set((state) => ({
          emailCampaigns: state.emailCampaigns.map((c) =>
            c.id === id ? { ...c, ...campaign } : c
          ),
        })),
      deleteEmailCampaign: (id) =>
        set((state) => ({
          emailCampaigns: state.emailCampaigns.filter((c) => c.id !== id),
        })),
      updateStats: (stats) =>
        set((state) => ({
          stats: { ...state.stats, ...stats },
        })),
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
    }),
    {
      name: 'marketing-bot-storage',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          // Return a no-op storage for SSR
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }
        const storage = localStorage
        // Create automatic backup on every save (but debounced)
        let backupTimeout: NodeJS.Timeout | null = null
        // Track last toast time to prevent spam
        let lastToastTime = 0
        const TOAST_DEBOUNCE_MS = 60000 // Only show toast once per minute max
        // Track if we're in hydration phase (first load) - check if data exists but hasn't been modified yet
        let isInitialLoad = true
        let pageLoadTime = typeof window !== 'undefined' ? Date.now() : 0
        // Set initial load flag to false after hydration window (first 5 seconds after page load)
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            isInitialLoad = false
          }, 5000) // Don't show toasts in first 5 seconds (hydration + initial load period)
        }
        
        const originalSetItem = storage.setItem.bind(storage)
        storage.setItem = function(key: string, value: string) {
          // Skip cleanup/toast for test keys (used by testLocalStorageLimit)
          const isTestKey = key.startsWith('__localStorage_limit_test__')
          
          try {
            originalSetItem(key, value)
            // Debounce backup creation (only backup every 30 seconds max)
            if (key === 'marketing-bot-storage' && backupTimeout === null) {
              backupTimeout = setTimeout(() => {
                backupTimeout = null
                if (typeof window !== 'undefined') {
                  import('./backup').then(({ createAutomaticBackup }) => {
                    try {
                      createAutomaticBackup()
                    } catch (e) {
                      // Silently fail - backup is optional
                    }
                  }).catch(() => {})
                }
              }, 30000) // 30 second debounce
            }
          } catch (error: any) {
            // If this is a test key, just throw the error without cleanup/toast
            // This allows testLocalStorageLimit() to handle the error itself
            if (isTestKey) {
              throw error
            }
            
            // Handle QuotaExceededError by cleaning up old data
            // Only show toast if not initial load and not spamming
            const now = Date.now()
            const timeSincePageLoad = now - pageLoadTime
            // Don't show toast if it's within first 5 seconds of page load (hydration period)
            // or if we've shown a toast in the last minute
            const shouldShowToast = !isInitialLoad && timeSincePageLoad > 5000 && (now - lastToastTime) > TOAST_DEBOUNCE_MS
            
            if (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014) {
              // Always attempt cleanup, but only show toast if not during initial load
              if (isInitialLoad || timeSincePageLoad < 5000) {
                console.warn('[Store] Storage quota exceeded during initial load - cleaning up quietly (no toast)')
              } else {
                console.warn('[Store] Storage quota exceeded, attempting cleanup...')
              }
              
              try {
                // Get current state and clean it up
                const currentData = storage.getItem('marketing-bot-storage')
                if (currentData) {
                  const parsed = JSON.parse(currentData)
                  const state = parsed.state
                  
                  // Clean up old data
                  if (state?.settings?.contentPreferences) {
                    const prefs = state.settings.contentPreferences
                    
                    // Reduce scanned posts to last 35 (optimized for free-tier: ~1KB each text only = ~35KB total)
                    // Free-tier Twitter: 100 posts/month shared, 30-day cache per customer = ~5 tweets/month per customer (20 customers max)
                    // Keep images only for newest 14 posts (~150KB each = ~2.1MB max for images)
                    if (prefs.scannedPosts && prefs.scannedPosts.length > 35) {
                      const sorted = [...prefs.scannedPosts]
                        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      const kept = sorted.slice(0, 35)
                      // Remove images from older posts to save space (keep images for newest 14 only)
                      const cleaned = kept.map((post: any, idx: number) => 
                        idx < 14 ? post : { ...post, images: undefined }
                      )
                      prefs.scannedPosts = cleaned
                    }
                    
                    // Ensure limits are enforced (optimized for free-tier and 5MB localStorage per customer)
                    // Accepted content: 30 items (~2KB each = ~60KB total)
                    if (prefs.acceptedContent && prefs.acceptedContent.length > 30) {
                      prefs.acceptedContent = prefs.acceptedContent.slice(-30)
                    }
                    // Edits: 35 items (~3KB each = ~105KB total) - enough for weighted voting
                    if (prefs.edits && prefs.edits.length > 35) {
                      prefs.edits = prefs.edits.slice(-35)
                    }
                  }
                  
                  // Limit brand images to last 20 (optimized for free-tier: ~150KB each = ~3MB max, fits within 5MB localStorage)
                  // Free-tier APIs: Twitter (1 req/15min), limited scanning means fewer images
                  if (state?.settings?.brandImages && state.settings.brandImages.length > 20) {
                    state.settings.brandImages = state.settings.brandImages.slice(-20)
                  }
                  
                  // Limit posts to last 50 (optimized for free-tier: ~2KB each = ~100KB total)
                  // Free-tier: Limited posting capabilities, fewer posts created
                  if (state?.posts && state.posts.length > 50) {
                    // Keep posted/scheduled posts, remove oldest drafts first
                    const sorted = [...state.posts].sort((a, b) => {
                      if (a.status === 'draft' && b.status !== 'draft') return 1
                      if (a.status !== 'draft' && b.status === 'draft') return -1
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    })
                    state.posts = sorted.slice(0, 50)
                  }
                  
                  // Limit leads to last 50 (optimized for free-tier: ~0.5KB each = ~25KB total)
                  // Free-tier: Limited lead capture capabilities
                  if (state?.leads && state.leads.length > 50) {
                    state.leads = state.leads.slice(-50)
                  }
                  
                  // Limit contact lists to 20 (optimized for free-tier: ~5KB each = ~100KB total)
                  // Contact lists can contain many contacts, reducing limit to save storage
                  if (state?.contactLists && state.contactLists.length > 20) {
                    state.contactLists = state.contactLists.slice(-20)
                  }
                  
                  // Limit email campaigns to 30 (optimized for free-tier: ~3KB each = ~90KB total)
                  // Free-tier: Limited email sending capabilities
                  if (state?.emailCampaigns && state.emailCampaigns.length > 30) {
                    state.emailCampaigns = state.emailCampaigns.slice(-30)
                  }
                  
                  // Try saving again with cleaned data
                  const cleanedData = JSON.stringify({ ...parsed, state })
                  try {
                    originalSetItem(key, cleanedData)
                    console.log('[Store] Cleanup successful, storage reduced')
                    
                    // Show user-friendly notification only if not initial load and not spamming
                    // shouldShowToast already checks: !isInitialLoad && timeSincePageLoad > 5000 && debounce
                    if (shouldShowToast && typeof window !== 'undefined') {
                      lastToastTime = now
                      import('react-hot-toast').then(({ default: toast }) => {
                        toast.error('Storage was full. Cleaned up old data to make room for new content.', { duration: 6000 })
                      }).catch(() => {})
                    } else {
                      // Log quietly during initial load or if toast was recently shown - no toast
                      console.log('[Store] Cleanup completed silently (initial load or recent toast)')
                    }
                  } catch (retryError: any) {
                    // If it still fails after cleanup, the new data itself might be too large
                    console.warn('[Store] Storage still full after cleanup - new data might be too large')
                    // Don't throw - let it fall through to final cleanup
                    throw retryError
                  }
                }
              } catch (cleanupError) {
                console.error('[Store] Cleanup failed:', cleanupError)
                // Last resort: clear all data except essential settings
                try {
                  const currentData = storage.getItem('marketing-bot-storage')
                  if (currentData) {
                    const parsed = JSON.parse(currentData)
                    const essentialSettings = {
                      geminiApiKey: parsed.state?.settings?.geminiApiKey,
                      businessName: parsed.state?.settings?.businessName,
                      businessType: parsed.state?.settings?.businessType,
                      targetAudience: parsed.state?.settings?.targetAudience,
                      socialAccounts: parsed.state?.settings?.socialAccounts,
                      adAccounts: parsed.state?.settings?.adAccounts,
                      contentPreferences: {
                        learnedStyle: parsed.state?.settings?.contentPreferences?.learnedStyle,
                      },
                    }
                    const minimalData = JSON.stringify({
                      ...parsed,
                      state: {
                        ...parsed.state,
                        settings: essentialSettings,
                        posts: [],
                        leads: [],
                        contactLists: [],
                        emailCampaigns: [],
                      },
                    })
                    originalSetItem(key, minimalData)
                    // Show user-friendly notification only if not initial load and not spamming
                    // shouldShowToast already checks: !isInitialLoad && timeSincePageLoad > 5000 && debounce
                    if (shouldShowToast && typeof window !== 'undefined') {
                      lastToastTime = now
                      import('react-hot-toast').then(({ default: toast }) => {
                        toast.error('Storage was full. Cleared old data to free up space.', { duration: 7000 })
                      }).catch(() => {})
                    } else {
                      // Log quietly during initial load or if toast was recently shown - no toast
                      console.log('[Store] Final cleanup completed silently (initial load or recent toast)')
                    }
                  }
                } catch (finalError) {
                  console.error('[Store] Final cleanup attempt failed:', finalError)
                  throw error // Re-throw original error if all cleanup fails
                }
              }
            } else {
              throw error // Re-throw if it's not a quota error
            }
          }
        }
        return storage
      }),
      skipHydration: true,
    }
  )
)

// Simple hook to check if store is hydrated
export function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(false)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Store is hydrated when we're on client
      setHydrated(true)
    }
  }, [])
  
  return hydrated
}

// Detect browser and get localStorage quota information
function detectBrowserAndQuota() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { browser: 'Unknown', localStorageLimitMB: 5, method: 'estimated' }
  }

  const ua = navigator.userAgent.toLowerCase()
  let browser = 'Unknown'
  let localStorageLimitMB = 5 // localStorage limit per origin (conservative estimate)
  let method = 'estimated'

  // Detect browser - localStorage limits are typically 5-10MB per origin
  // But total storage quota (IndexedDB + Cache API) can be much higher (GB+)
  // Check for Brave first (Brave uses Chrome User Agent but has navigator.brave)
  if (typeof (navigator as any).brave !== 'undefined' && (navigator as any).brave.isBrave) {
    browser = 'Brave'
    localStorageLimitMB = 10 // Brave localStorage: ~10MB per origin (same as Chrome)
  } else if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('brave')) {
    browser = 'Chrome'
    localStorageLimitMB = 10 // Chrome localStorage: ~10MB per origin
  } else if (ua.includes('brave')) {
    browser = 'Brave'
    localStorageLimitMB = 10 // Brave localStorage: ~10MB per origin
  } else if (ua.includes('firefox')) {
    browser = 'Firefox'
    localStorageLimitMB = 10 // Firefox localStorage: ~10MB per origin
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari'
    localStorageLimitMB = 5 // Safari localStorage: ~5MB per origin
  } else if (ua.includes('edg')) {
    browser = 'Edge'
    localStorageLimitMB = 10 // Edge localStorage: ~10MB per origin
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera'
    localStorageLimitMB = 10 // Opera localStorage: ~10MB per origin
  } else if (ua.includes('samsung')) {
    browser = 'Samsung Internet'
    localStorageLimitMB = 5 // Samsung Internet localStorage: ~5MB per origin
  }

  return { browser, localStorageLimitMB, method }
}

// Test localStorage limit by trying to write progressively larger data
// Returns the approximate limit in bytes, or null if test fails
async function testLocalStorageLimit(): Promise<number | null> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null
  }

  const testKey = '__localStorage_limit_test__'
  let lastWorkingSize = 0
  
  try {
    // Clean up any previous test
    try {
      localStorage.removeItem(testKey)
    } catch (e) {
      // Ignore cleanup errors
    }

    // Binary search approach: start with estimated limit and narrow down
    // Most browsers have 5-10MB for localStorage per origin
    // We'll test in smaller increments to find the exact limit more accurately
    const maxTestSize = 15 * 1024 * 1024 // Don't test beyond 15MB
    let low = 5 * 1024 * 1024  // Start at 5MB (conservative minimum)
    let high = maxTestSize
    let bestGuess = 10 * 1024 * 1024 // Default to 10MB

    // Progressive test: try sizes from small to large to find the actual limit
    // Most browsers have 5-10MB for localStorage, so we test progressively
    let testSizes = [5 * 1024 * 1024, 7 * 1024 * 1024, 9 * 1024 * 1024, 10 * 1024 * 1024, 11 * 1024 * 1024, 12 * 1024 * 1024]
    
    for (let i = 0; i < testSizes.length; i++) {
      const size = testSizes[i]
      try {
        const testStr = 'x'.repeat(size - 3000) // Leave buffer for encoding overhead
        localStorage.setItem(testKey, testStr)
        localStorage.removeItem(testKey)
        lastWorkingSize = size
        
        // If this is the last size and it worked, return it (we found the upper bound)
        if (i === testSizes.length - 1) {
          return Math.max(lastWorkingSize - 500 * 1024, 5 * 1024 * 1024)
        }
      } catch (error: any) {
        if (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014) {
          // Found the limit - return previous working size (this is the actual limit)
          if (lastWorkingSize > 0) {
            // Return the last working size (don't subtract buffer - this IS the limit)
            return lastWorkingSize
          }
          // If first size (5MB) fails, localStorage is very limited or full
          // Try smaller sizes
          if (size === testSizes[0]) {
            for (let smallerSize = 4 * 1024 * 1024; smallerSize >= 2 * 1024 * 1024; smallerSize -= 500 * 1024) {
              try {
                const testStr = 'x'.repeat(smallerSize - 3000)
                localStorage.setItem(testKey, testStr)
                localStorage.removeItem(testKey)
                return smallerSize // Return actual working size
              } catch (e: any) {
                if (e.name !== 'QuotaExceededError' && e.code !== 22 && e.code !== 1014) {
                  break
                }
                continue
              }
            }
          }
          break
        } else {
          // Other error (not quota exceeded) - this might be a real error
          // Don't break, continue to next size
          console.warn('[Storage Test] Non-quota error testing size:', size, error)
          continue
        }
      }
    }
    
    // If we got here and found a working size, return it
    if (lastWorkingSize > 0) {
      return lastWorkingSize
    }

    // If we got here, return best guess based on what we found
    return lastWorkingSize > 0 ? Math.max(lastWorkingSize - 500 * 1024, 5 * 1024 * 1024) : null
  } catch (error) {
    console.error('Error testing localStorage limit:', error)
    return null
  } finally {
    // Clean up test key
    try {
      localStorage.removeItem(testKey)
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Get actual quota asynchronously (if StorageManager API is available)
export async function getStorageQuota(): Promise<{ 
  totalQuota: number; 
  totalQuotaMB: number;
  localStorageLimitMB: number;
  appUsage: number; 
  appUsageMB: number; 
  available: number; 
  availableMB: number; 
  browser?: string;
  method?: string;
} | null> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null
  }

  const detected = detectBrowserAndQuota()
  let totalQuota = 0
  let totalUsage = 0
  let method = 'estimated'
  let appUsage = 0
  let localStorageLimitMB = detected.localStorageLimitMB
  let localStorageLimitMethod = 'estimated'

  try {
    // Use StorageManager API if available (modern browsers)
    // NOTE: This gives TOTAL storage quota (localStorage + IndexedDB + Cache API)
    // This can be 2GB+ but localStorage itself is limited to ~5-10MB per origin
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      if (estimate.quota !== undefined && estimate.usage !== undefined) {
        totalQuota = estimate.quota
        totalUsage = estimate.usage // Total usage across all storage APIs
        method = 'detected'
      }
    }
  } catch (error) {
    console.error('Error getting storage quota:', error)
    // Fallback to estimated
  }

  // Try to test actual localStorage limit (this should always be attempted)
  let testAttempted = false
  let testedLimit: number | null = null
  try {
    testedLimit = await testLocalStorageLimit()
    testAttempted = true
    if (testedLimit !== null && testedLimit > 0) {
      localStorageLimitMB = testedLimit / (1024 * 1024)
      localStorageLimitMethod = 'tested'
    } else {
      // Test was attempted but returned null (possibly failed or blocked)
      console.warn('[Storage] localStorage limit test returned null - may be blocked by browser')
    }
  } catch (error) {
    testAttempted = true
    console.error('[Storage] Error testing localStorage limit:', error)
    // Keep estimated value, but note that test was attempted
    localStorageLimitMethod = 'test_failed'
  }

  // Calculate usage from our app's localStorage (this is what matters for us)
  try {
    const data = localStorage.getItem('marketing-bot-storage')
    if (data) {
      appUsage = new Blob([data]).size
    }
  } catch (error) {
    // Ignore errors calculating usage
  }

  // Available space is limited by localStorage limit, not total quota
  // Since we use localStorage, the practical limit is the localStorage limit
  const localStorageLimit = localStorageLimitMB * 1024 * 1024
  const available = Math.max(0, localStorageLimit - appUsage)

  // Determine method string - prioritize tested, then show what was actually done
  let methodString: string
  if (localStorageLimitMethod === 'tested') {
    // Test succeeded - show actual tested limit
    methodString = `tested (${localStorageLimitMB.toFixed(1)} MB actual limit)`
  } else if (testAttempted && testedLimit === null && localStorageLimitMethod !== 'test_failed') {
    // Test was attempted but returned null (blocked or not supported by browser)
    // Show that test was attempted but blocked, and what we're using instead
    if (method === 'detected') {
      methodString = `test blocked by browser - using ${detected.browser} estimate (${localStorageLimitMB} MB)`
    } else {
      methodString = `test blocked by browser - using ${detected.browser} estimate (${localStorageLimitMB} MB)`
    }
  } else if (localStorageLimitMethod === 'test_failed') {
    // Test was attempted but threw an error
    methodString = `test attempted but failed - using ${detected.browser} estimate (${localStorageLimitMB} MB)`
  } else if (method === 'detected' && !testAttempted) {
    // StorageManager API available but test was not attempted (shouldn't happen, but handle it)
    methodString = `StorageManager API available (${localStorageLimitMB} MB localStorage limit estimated)`
  } else {
    // Fallback to estimated
    methodString = `estimated (${localStorageLimitMB} MB typical for ${detected.browser})`
  }

  return {
    totalQuota, // Total storage quota (can be 2GB+, but not all usable for localStorage)
    totalQuotaMB: totalQuota / (1024 * 1024),
    localStorageLimitMB, // Actual or tested localStorage limit
    appUsage, // Our app's localStorage usage
    appUsageMB: appUsage / (1024 * 1024),
    available, // Available in localStorage (limited by localStorage limit)
    availableMB: available / (1024 * 1024),
    browser: detected.browser,
    method: methodString,
  }
}

// Utility function to get storage usage information
export function getStorageUsage() {
  if (typeof window === 'undefined') {
    return null
  }
  
  try {
    const data = localStorage.getItem('marketing-bot-storage')
    const detected = detectBrowserAndQuota()
    
    if (!data) {
      return {
        totalSize: 0,
        totalSizeMB: 0,
        breakdown: {},
        items: {
          posts: 0,
          leads: 0,
          contactLists: 0,
          emailCampaigns: 0,
          brandImages: 0,
          scannedPosts: 0,
          acceptedContent: 0,
          edits: 0,
        },
        browser: detected.browser,
        localStorageLimitMB: detected.localStorageLimitMB,
        method: detected.method,
      }
    }
    
    const sizeInBytes = new Blob([data]).size
    const sizeInMB = sizeInBytes / (1024 * 1024)
    
    const parsed = JSON.parse(data)
    const state = parsed.state || {}
    
    // Calculate size per category
    const breakdown: Record<string, number> = {}
    
    if (state.posts) {
      breakdown.posts = new Blob([JSON.stringify(state.posts)]).size
    }
    if (state.leads) {
      breakdown.leads = new Blob([JSON.stringify(state.leads)]).size
    }
    if (state.contactLists) {
      breakdown.contactLists = new Blob([JSON.stringify(state.contactLists)]).size
    }
    if (state.emailCampaigns) {
      breakdown.emailCampaigns = new Blob([JSON.stringify(state.emailCampaigns)]).size
    }
    if (state.settings) {
      const settingsStr = JSON.stringify(state.settings)
      breakdown.settings = new Blob([settingsStr]).size
      
      // Break down settings further
      if (state.settings.brandImages) {
        breakdown.brandImages = new Blob([JSON.stringify(state.settings.brandImages)]).size
      }
      if (state.settings.contentPreferences) {
        const prefs = state.settings.contentPreferences
        if (prefs.scannedPosts) {
          breakdown.scannedPosts = new Blob([JSON.stringify(prefs.scannedPosts)]).size
        }
        if (prefs.acceptedContent) {
          breakdown.acceptedContent = new Blob([JSON.stringify(prefs.acceptedContent)]).size
        }
        if (prefs.edits) {
          breakdown.edits = new Blob([JSON.stringify(prefs.edits)]).size
        }
      }
    }
    
    return {
      totalSize: sizeInBytes,
      totalSizeMB: sizeInMB,
      breakdown,
      items: {
        posts: state.posts?.length || 0,
        leads: state.leads?.length || 0,
        contactLists: state.contactLists?.length || 0,
        emailCampaigns: state.emailCampaigns?.length || 0,
        brandImages: state.settings?.brandImages?.length || 0,
        scannedPosts: state.settings?.contentPreferences?.scannedPosts?.length || 0,
        acceptedContent: state.settings?.contentPreferences?.acceptedContent?.length || 0,
        edits: state.settings?.contentPreferences?.edits?.length || 0,
      },
      browser: detected.browser,
      localStorageLimitMB: detected.localStorageLimitMB,
      method: detected.method,
    }
  } catch (error) {
    console.error('Error calculating storage usage:', error)
    return null
  }
}
