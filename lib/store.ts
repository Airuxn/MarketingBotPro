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
      rejectedContent?: Array<{
        content: string
        contentType: 'post' | 'email' | 'ad'
        platform: string
        rejectedAt: string
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
        set((state) => ({
          posts: [...state.posts, post],
          stats: {
            ...state.stats,
            postsCreated: state.stats.postsCreated + 1,
          },
        })),
      updatePost: (id, post) =>
        set((state) => ({
          posts: state.posts.map((p) => (p.id === id ? { ...p, ...post } : p)),
        })),
      deletePost: (id) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
        })),
      addLead: (lead) =>
        set((state) => ({
          leads: [...state.leads, lead],
          stats: {
            ...state.stats,
            leadsCaptured: state.stats.leadsCaptured + 1,
          },
        })),
      updateLead: (id, lead) =>
        set((state) => ({
          leads: state.leads.map((l) => (l.id === id ? { ...l, ...lead } : l)),
        })),
      deleteLead: (id) =>
        set((state) => ({
          leads: state.leads.filter((l) => l.id !== id),
        })),
      addContactList: (list) =>
        set((state) => ({
          contactLists: [...state.contactLists, list],
        })),
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
        set((state) => ({
          emailCampaigns: [...state.emailCampaigns, campaign],
          stats: {
            ...state.stats,
            emailsSent: state.stats.emailsSent + campaign.recipients.length,
          },
        })),
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
        const originalSetItem = storage.setItem.bind(storage)
        storage.setItem = function(key: string, value: string) {
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
