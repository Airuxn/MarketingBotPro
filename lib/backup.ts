import { useStore } from './store'
import type { Store } from './store'

/**
 * Export all app data to a JSON file
 */
export function exportData(): void {
  const state = useStore.getState()
  
  const exportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      posts: state.posts,
      leads: state.leads,
      contactLists: state.contactLists,
      emailCampaigns: state.emailCampaigns,
      stats: state.stats,
      settings: state.settings,
    },
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `marketing-bot-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Import data from a JSON file
 */
export function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const imported = JSON.parse(text)
        
        // Validate structure
        if (!imported.data || !imported.version) {
          throw new Error('Invalid backup file format')
        }

        const store = useStore.getState()

        // Replace all data (not merge) to avoid duplicates
        // Clear existing data first
        store.posts.forEach(post => store.deletePost(post.id))
        store.leads.forEach(lead => store.deleteLead(lead.id))
        store.contactLists.forEach(list => store.deleteContactList(list.id))
        store.emailCampaigns.forEach(campaign => store.deleteEmailCampaign(campaign.id))

        // Import posts
        if (imported.data.posts && Array.isArray(imported.data.posts)) {
          imported.data.posts.forEach((post: any) => {
            store.addPost(post)
          })
        }

        // Import leads
        if (imported.data.leads && Array.isArray(imported.data.leads)) {
          imported.data.leads.forEach((lead: any) => {
            store.addLead(lead)
          })
        }

        // Import contact lists
        if (imported.data.contactLists && Array.isArray(imported.data.contactLists)) {
          imported.data.contactLists.forEach((list: any) => {
            store.addContactList(list)
          })
        }

        // Import email campaigns
        if (imported.data.emailCampaigns && Array.isArray(imported.data.emailCampaigns)) {
          imported.data.emailCampaigns.forEach((campaign: any) => {
            store.addEmailCampaign(campaign)
          })
        }

        // Import stats
        if (imported.data.stats) {
          store.updateStats(imported.data.stats)
        }

        // Import settings (merge with existing to preserve API keys if user wants)
        if (imported.data.settings) {
          store.updateSettings(imported.data.settings)
        }

        resolve()
      } catch (error: any) {
        reject(new Error(`Failed to import data: ${error.message}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Create automatic backup in localStorage (keeps last 5 backups)
 */
export function createAutomaticBackup(): void {
  try {
    const state = useStore.getState()
    const backup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        posts: state.posts,
        leads: state.leads,
        emailCampaigns: state.emailCampaigns,
        stats: state.stats,
        settings: state.settings,
      },
    }

    // Get existing backups
    const backupsKey = 'marketing-bot-auto-backups'
    const existing = localStorage.getItem(backupsKey)
    let backups: Array<{ timestamp: string; data: any }> = existing ? JSON.parse(existing) : []

    // Add new backup
    backups.unshift(backup)

    // Keep only last 5 backups
    backups = backups.slice(0, 5)

    // Save backups
    localStorage.setItem(backupsKey, JSON.stringify(backups))
  } catch (error) {
    console.error('Failed to create automatic backup:', error)
  }
}

/**
 * Get list of automatic backups
 */
export function getAutomaticBackups(): Array<{ timestamp: string; date: string }> {
  try {
    const backupsKey = 'marketing-bot-auto-backups'
    const existing = localStorage.getItem(backupsKey)
    if (!existing) return []

    const backups = JSON.parse(existing)
    return backups.map((backup: { timestamp: string }) => ({
      timestamp: backup.timestamp,
      date: new Date(backup.timestamp).toLocaleString(),
    }))
  } catch (error) {
    return []
  }
}

/**
 * Restore from automatic backup
 */
export function restoreFromAutomaticBackup(timestamp: string): void {
  try {
    const backupsKey = 'marketing-bot-auto-backups'
    const existing = localStorage.getItem(backupsKey)
    if (!existing) throw new Error('No backups found')

    const backups = JSON.parse(existing)
    const backup = backups.find((b: { timestamp: string }) => b.timestamp === timestamp)
    
    if (!backup) throw new Error('Backup not found')

    const { updateSettings, addPost, addLead, addContactList, addEmailCampaign, updateStats } = useStore.getState()

    // Restore posts
    if (backup.data.posts && Array.isArray(backup.data.posts)) {
      backup.data.posts.forEach((post: any) => {
        addPost(post)
      })
    }

    // Restore leads
    if (backup.data.leads && Array.isArray(backup.data.leads)) {
      backup.data.leads.forEach((lead: any) => {
        addLead(lead)
      })
    }

    // Restore contact lists
    if (backup.data.contactLists && Array.isArray(backup.data.contactLists)) {
      backup.data.contactLists.forEach((list: any) => {
        addContactList(list)
      })
    }

    // Restore email campaigns
    if (backup.data.emailCampaigns && Array.isArray(backup.data.emailCampaigns)) {
      backup.data.emailCampaigns.forEach((campaign: any) => {
        addEmailCampaign(campaign)
      })
    }

    // Restore stats
    if (backup.data.stats) {
      updateStats(backup.data.stats)
    }

    // Restore settings
    if (backup.data.settings) {
      updateSettings(backup.data.settings)
    }
  } catch (error: any) {
    throw new Error(`Failed to restore backup: ${error.message}`)
  }
}
