'use client'

import { useState, useRef } from 'react'
import { Mail, Plus, Send, Trash2, Users, Upload, Search, Edit2, X, Save, List } from 'lucide-react'
import { useStore, ContactList, Contact } from '@/lib/store'
import { generateContent } from '@/lib/ai'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useLanguage } from '@/lib/language-context'

export default function EmailPage() {
  const { 
    emailCampaigns, 
    leads, 
    contactLists,
    settings, 
    addEmailCampaign, 
    updateEmailCampaign, 
    deleteEmailCampaign, 
    addLead,
    addContactList,
    updateContactList,
    deleteContactList,
    addContactToList,
    deleteContactFromList,
    updateContactInList
  } = useStore()
  const { language } = useLanguage()
  const [showCreate, setShowCreate] = useState(false)
  const [campaignName, setCampaignName] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [emailTone, setEmailTone] = useState<'personal' | 'neutral' | 'professional' | 'marketing'>('professional')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showListManager, setShowListManager] = useState(false)
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [listSearchTerm, setListSearchTerm] = useState('')
  const [contactSearchTerm, setContactSearchTerm] = useState('')
  const [newContactName, setNewContactName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')
  const [newListName, setNewListName] = useState('')

  const handleGenerateContent = async () => {
    if (!campaignName.trim()) {
      toast.error('Please enter a subject first')
      return
    }

    if (!settings.geminiApiKey) {
      toast.error('Please add your Google Gemini API key in Settings')
      return
    }

    setIsGenerating(true)
    try {
      const toneDescription = {
        personal: 'personal and friendly, like writing to friends and family',
        neutral: 'neutral and balanced, suitable for general communication',
        professional: 'professional and business-like, suitable for work and business contexts',
        marketing: 'marketing-focused, promotional, designed to convert and drive action'
      }
      
      const prompt = `Create an email based on this topic/idea: "${campaignName}"

CRITICAL: Analyze the topic "${campaignName}" to understand the context and purpose:
- If the topic suggests a personal message (e.g., "can't attend wedding", "apology", "personal update"), create appropriate personal email content
- If the topic suggests marketing (e.g., "Product Launch", "Welcome Series", "Newsletter"), create marketing email content
- Use the topic as the PRIMARY context to determine what type of email to create

Business Context: ${settings.businessName ? `Business: ${settings.businessName}` : ''}${settings.businessType ? `\nBusiness Type: ${settings.businessType}` : ''}${settings.targetAudience ? `\nTarget Audience: ${settings.targetAudience}` : ''}

Tone: ${toneDescription[emailTone]}

IMPORTANT FORMATTING:
- Start with "Subject:" or "Onderwerp:" (in the language of the email) followed by a well-written, professional subject line
- The subject line should be polished and well-crafted, not just the raw topic "${campaignName}"
- After the subject line, add a blank line, then write the email body
- The subject line should be concise, clear, and appropriate for the context

Create both a subject line and email body that:
- Matches the context suggested by the topic "${campaignName}"
- Uses the ${emailTone} tone appropriately
- Is appropriate for the purpose indicated by the topic
- If it's a marketing email, include a call-to-action
- If it's a personal email, write naturally and appropriately for the situation
- The subject line should be well-written and professional, not just repeating "${campaignName}"

Generate the email content based on what "${campaignName}" suggests the email should be about.`
      const generated = await generateContent(prompt, 'email', settings.geminiApiKey, undefined, language, emailTone)
      
      // Try to extract subject and body
      let subjectLine = campaignName
      let emailBody = generated
      
      // Look for subject indicators in various languages
      const subjectPatterns = [
        /^(subject|onderwerp|sujet)[\s:]+(.+)$/i,
        /^subject[\s:]+(.+)$/i,
        /^onderwerp[\s:]+(.+)$/i,
        /^sujet[\s:]+(.+)$/i,
      ]
      
      const lines = generated.split('\n')
      
      // Find the subject line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        for (const pattern of subjectPatterns) {
          const match = line.match(pattern)
          if (match) {
            // match[2] is the text after "Subject:" or "Onderwerp:" (the actual subject)
            // match[1] would be "subject" or "onderwerp" itself
            subjectLine = match[2] ? match[2].trim() : match[1] ? match[1].trim() : match[0].replace(/^(subject|onderwerp|sujet)[\s:]+/i, '').trim()
            // Remove the subject line from the body
            lines.splice(i, 1)
            emailBody = lines.join('\n').trim()
            break
          }
        }
        if (subjectLine !== campaignName) break
      }
      
      // Clean up the body - remove any remaining "Onderwerp:" or "Subject:" lines
      emailBody = emailBody
        .split('\n')
        .filter(line => !/^(subject|onderwerp|sujet)[\s:]+/i.test(line.trim()))
        .join('\n')
        .trim()
      
      // If we still have the original generated content and it contains subject indicators, try to extract better
      if (emailBody === generated && /^(subject|onderwerp|sujet)[\s:]+/i.test(generated)) {
        const match = generated.match(/^(subject|onderwerp|sujet)[\s:]+(.+?)(?:\n\n|\n|$)/i)
        if (match) {
          subjectLine = match[2].trim()
          emailBody = generated.replace(/^(subject|onderwerp|sujet)[\s:]+.+?(\n\n|\n|$)/i, '').trim()
        }
      }
      
      setSubject(subjectLine)
      setContent(emailBody)
      toast.success('Email content generated!')
    } catch (error: any) {
      // Handle quota/rate limit errors more gracefully
      const errorMessage = error.message || 'Failed to generate content'
      const isQuotaError = errorMessage.toLowerCase().includes('quota') || 
                          errorMessage.toLowerCase().includes('rate limit') ||
                          errorMessage.toLowerCase().includes('exceeded') ||
                          errorMessage.toLowerCase().includes('429')
      
      if (isQuotaError) {
        toast.error(
          'API quota exceeded. Please check your Google Gemini API quota or wait a few minutes before trying again.',
          {
            duration: 10000, // Show longer for quota errors
            style: {
              maxWidth: '500px',
            },
          }
        )
      } else {
        toast.error(errorMessage, {
          duration: 8000,
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateCampaign = () => {
    if (!campaignName || !subject || !content) {
      toast.error('Please fill in all fields')
      return
    }

    if (selectedLeads.length === 0) {
      toast.error('Please select at least one recipient')
      return
    }

    const newCampaign = {
      id: Date.now().toString(),
      name: campaignName,
      subject,
      content,
      recipients: selectedLeads,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
    }

    addEmailCampaign(newCampaign)
    toast.success('Campaign created!')
    
    // Reset form
    setShowCreate(false)
    setCampaignName('')
    setSubject('')
    setContent('')
    setSelectedLeads([])
    setSelectedListId(null)
    setEmailTone('professional')
  }

  const handleSend = (id: string) => {
    const campaign = emailCampaigns.find((c) => c.id === id)
    if (campaign) {
      // In a real app, this would send emails via an API (Resend, SendGrid, etc.)
      toast.success(`Email sent to ${campaign.recipients.length} recipients!`)
      updateEmailCampaign(id, { status: 'sent' })
    }
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const isCSV = fileExtension === 'csv'
    const isTXT = fileExtension === 'txt'

    if (!isCSV && !isTXT) {
      toast.error('Please upload a CSV or TXT file')
      return
    }

    try {
      const text = await file.text()
      const emails: string[] = []
      const newLeads: Array<{ name: string; email: string }> = []

      if (isCSV) {
        // Parse CSV - support formats: name,email or email,name or just email
        const lines = text.split('\n').filter(line => line.trim())
        const header = lines[0]?.toLowerCase().trim()
        
        // Check if header exists and determine column order
        const hasHeader = header?.includes('email') || header?.includes('name')
        const startIndex = hasHeader ? 1 : 0
        
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
          
          if (parts.length >= 2) {
            // Try to find email (contains @)
            const emailPart = parts.find(p => p.includes('@'))
            const namePart = parts.find(p => !p.includes('@') && p.length > 0)
            
            if (emailPart) {
              const email = emailPart.toLowerCase()
              if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                emails.push(email)
                if (namePart) {
                  newLeads.push({ name: namePart, email })
                }
              }
            }
          } else if (parts.length === 1 && parts[0].includes('@')) {
            // Just an email
            const email = parts[0].toLowerCase()
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              emails.push(email)
            }
          }
        }
      } else if (isTXT) {
        // Parse TXT - one email per line
        const lines = text.split('\n').map(line => line.trim()).filter(line => line)
        for (const line of lines) {
          // Support formats: email or name <email> or "name" <email>
          const emailMatch = line.match(/<?([^\s<>]+@[^\s<>]+\.[^\s<>]+)>?/)
          if (emailMatch) {
            const email = emailMatch[1].toLowerCase()
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              emails.push(email)
              
              // Try to extract name
              const nameMatch = line.match(/^(.+?)\s*<?[^\s<>]+@[^\s<>]+\.[^\s<>]+>?$/)
              if (nameMatch && nameMatch[1].trim() && !nameMatch[1].includes('@')) {
                const name = nameMatch[1].replace(/^["']|["']$/g, '').trim()
                if (name) {
                  newLeads.push({ name, email })
                }
              }
            }
          }
        }
      }

      if (emails.length === 0) {
        toast.error('No valid email addresses found in the file')
        return
      }

      // Create contacts from imported data
      const contacts: Contact[] = emails.map((email, idx) => {
        const lead = newLeads.find(l => l.email.toLowerCase() === email.toLowerCase())
        return {
          id: Date.now().toString() + idx + Math.random(),
          name: lead?.name || email.split('@')[0],
          email: email,
          phone: undefined,
        }
      })

      // Add new leads to the store if they don't exist
      const existingEmails = new Set(leads.map(l => l.email.toLowerCase()))
      for (const lead of newLeads) {
        if (!existingEmails.has(lead.email.toLowerCase())) {
          addLead({
            id: Date.now().toString() + Math.random(),
            name: lead.name,
            email: lead.email,
            source: 'Imported',
            status: 'new',
            createdAt: new Date().toISOString(),
          })
        }
      }

      // Prompt user to create a contact list or add to selected
      const listName = prompt(`Imported ${emails.length} contact${emails.length > 1 ? 's' : ''}. Enter a name for this contact list (or cancel to add to current selection):`)
      
      if (listName && listName.trim()) {
        // Create new contact list
        const newList: ContactList = {
          id: Date.now().toString(),
          name: listName.trim(),
          contacts: contacts,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        addContactList(newList)
        setSelectedListId(newList.id)
        setSelectedLeads(contacts.map(c => c.email))
        toast.success(`Created contact list "${listName.trim()}" with ${contacts.length} contact${contacts.length > 1 ? 's' : ''}`)
      } else {
        // Add all emails to selected recipients (avoid duplicates)
        const uniqueEmails = [...new Set([...selectedLeads, ...emails])]
        setSelectedLeads(uniqueEmails)
        toast.success(`Imported ${emails.length} email${emails.length > 1 ? 's' : ''} from ${file.name}`)
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      toast.error(`Failed to import file: ${error.message}`)
    }
  }

  const selectedList = selectedListId ? contactLists.find(l => l.id === selectedListId) : null
  const filteredContacts = selectedList 
    ? selectedList.contacts.filter(c => 
        contactSearchTerm === '' || 
        c.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(contactSearchTerm.toLowerCase())
      )
    : []

  const filteredLists = contactLists.filter(list =>
    listSearchTerm === '' ||
    list.name.toLowerCase().includes(listSearchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen relative">
      {/* Page Header */}
      <div className="glass-strong border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg blur-lg opacity-60"></div>
                <div className="relative w-7 h-7 lg:w-10 lg:h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-glow">
                  <Mail className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg lg:text-2xl font-bold text-gradient">Email Campaigns</h1>
                <p className="text-xs lg:text-sm text-slate-300 hidden sm:block">Automate your email marketing</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md text-xs lg:text-sm"
            >
              <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden sm:inline">New Campaign</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Create Campaign Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreate(false)
            }
          }}>
            <div className="glass-strong rounded-xl p-4 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-glow-lg relative">
              <button
                onClick={() => setShowCreate(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-base font-bold text-white mb-3 pr-8">Create Email</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="E.g., Welcome Series, Product Launch"
                    className="w-full px-4 py-2 glass rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1.5">
                    Email Tone
                  </label>
                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    {[
                      { value: 'personal', label: 'Personal', desc: 'Friends & Family' },
                      { value: 'neutral', label: 'Neutral', desc: 'General' },
                      { value: 'professional', label: 'Professional', desc: 'Business' },
                      { value: 'marketing', label: 'Marketing', desc: 'Promotional' },
                    ].map((tone) => (
                      <button
                        key={tone.value}
                        type="button"
                        onClick={() => setEmailTone(tone.value as 'personal' | 'neutral' | 'professional' | 'marketing')}
                        className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                          emailTone === tone.value
                            ? 'bg-blue-600 text-white'
                            : 'glass text-slate-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="font-semibold">{tone.label}</div>
                        <div className="text-xs opacity-75 mt-0.5">{tone.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1">
                      Email Content
                    </label>
                    <p className="text-xs text-slate-400">AI will generate subject and body</p>
                  </div>
                  <button
                    onClick={handleGenerateContent}
                    disabled={isGenerating}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-xs"
                  >
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1.5">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject line"
                    className="w-full px-3 py-1.5 glass rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-400 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1.5">
                    Email Body
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Email content..."
                    rows={6}
                    className="w-full px-3 py-1.5 glass rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-400 resize-none text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-200">
                    Select Recipients ({selectedLeads.length} selected)
                  </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowListManager(true)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs glass hover:bg-slate-700/50 rounded transition-colors"
                      >
                        <List className="w-3 h-3" />
                        <span>Manage Lists</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-1 px-2 py-1 text-xs glass hover:bg-slate-700/50 rounded transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Import CSV/TXT</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileImport}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Contact List Selector */}
                  {contactLists.length > 0 && (
                    <div className="mb-2">
                      <select
                        value={selectedListId || ''}
                        onChange={(e) => {
                          const listId = e.target.value
                          setSelectedListId(listId || null)
                          if (listId) {
                            const list = contactLists.find(l => l.id === listId)
                            if (list) {
                              setSelectedLeads(list.contacts.map(c => c.email))
                            }
                          } else {
                            setSelectedLeads([])
                          }
                        }}
                        className="w-full px-3 py-1.5 glass rounded-lg focus:ring-2 focus:ring-purple-500 text-white text-sm"
                      >
                        <option value="">Select a contact list...</option>
                        {contactLists.map((list) => (
                          <option key={list.id} value={list.id}>
                            {list.name} ({list.contacts.length} contacts)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Selected List Contacts */}
                  {selectedList && (
                    <div className="mb-2 glass border border-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-slate-200">{selectedList.name}</span>
                          {editingListId === selectedList.id ? (
                            <div className="flex items-center space-x-1 flex-1">
                              <input
                                type="text"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                className="flex-1 px-2 py-1 glass rounded text-white text-xs"
                                placeholder="List name"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  if (newListName.trim()) {
                                    updateContactList(selectedList.id, { name: newListName.trim() })
                                    setEditingListId(null)
                                    setNewListName('')
                                  }
                                }}
                                className="p-1 text-green-400 hover:text-green-300"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingListId(null)
                                  setNewListName('')
                                }}
                                className="p-1 text-red-400 hover:text-red-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingListId(selectedList.id)
                                setNewListName(selectedList.name)
                              }}
                              className="p-1 text-slate-400 hover:text-slate-300"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input
                            type="text"
                            value={contactSearchTerm}
                            onChange={(e) => setContactSearchTerm(e.target.value)}
                            placeholder="Search contacts..."
                            className="w-full pl-7 pr-3 py-1 glass rounded text-white text-xs placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {filteredContacts.map((contact) => (
                          <div key={contact.id} className="flex items-center justify-between p-1.5 hover:bg-slate-700/50 rounded">
                            <label className="flex items-center space-x-2 flex-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedLeads.includes(contact.email)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedLeads([...selectedLeads, contact.email])
                                  } else {
                                    setSelectedLeads(selectedLeads.filter((e) => e !== contact.email))
                                  }
                                }}
                                className="w-3 h-3 text-blue-600 rounded"
                              />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-white">{contact.name}</p>
                                <p className="text-xs text-slate-400">{contact.email}</p>
                              </div>
                            </label>
                            <button
                              onClick={() => {
                                deleteContactFromList(selectedList.id, contact.id)
                                setSelectedLeads(selectedLeads.filter(e => e !== contact.email))
                                toast.success('Contact removed from list')
                              }}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {filteredContacts.length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-2">No contacts found</p>
                        )}
                      </div>
                      {/* Add new contact to list */}
                      <div className="mt-2 pt-2 border-t border-slate-700/50">
                        <div className="flex items-center space-x-1">
                          <input
                            type="text"
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                            placeholder="Name"
                            className="flex-1 px-2 py-1 glass rounded text-white text-xs placeholder:text-slate-400"
                          />
                          <input
                            type="email"
                            value={newContactEmail}
                            onChange={(e) => setNewContactEmail(e.target.value)}
                            placeholder="Email"
                            className="flex-1 px-2 py-1 glass rounded text-white text-xs placeholder:text-slate-400"
                          />
                          <button
                            onClick={() => {
                              if (newContactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newContactEmail)) {
                                addContactToList(selectedList.id, {
                                  id: Date.now().toString() + Math.random(),
                                  name: newContactName || newContactEmail.split('@')[0],
                                  email: newContactEmail.toLowerCase(),
                                  phone: newContactPhone || undefined,
                                })
                                setNewContactName('')
                                setNewContactEmail('')
                                setNewContactPhone('')
                                toast.success('Contact added to list')
                              } else {
                                toast.error('Please enter a valid email address')
                              }
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback to leads if no list selected */}
                  {!selectedList && (
                    <div className="glass border border-slate-700/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {leads.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">
                          No leads yet. Import a CSV/TXT file or add leads first.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {leads.map((lead) => (
                          <label
                            key={lead.id}
                              className="flex items-center space-x-3 p-2 hover:bg-slate-700/50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead.email)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLeads([...selectedLeads, lead.email])
                                } else {
                                  setSelectedLeads(selectedLeads.filter((e) => e !== lead.email))
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div>
                                <p className="text-sm font-medium text-white">{lead.name}</p>
                                <p className="text-xs text-slate-400">{lead.email}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-3">
                  <button
                    onClick={handleCreateCampaign}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Create Campaign
                  </button>
                  <button
                    onClick={() => {
                      setShowCreate(false)
                      setCampaignName('')
                      setSubject('')
                      setContent('')
                      setSelectedLeads([])
                      setSelectedListId(null)
                      setEmailTone('professional')
                    }}
                    className="flex-1 glass text-slate-300 py-2 px-3 rounded-lg hover:bg-slate-700/50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact List Manager Modal */}
        {showListManager && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowListManager(false)
            }
          }}>
            <div className="glass-strong rounded-xl p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-glow-lg relative">
              <button
                onClick={() => setShowListManager(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-lg font-bold text-white mb-4 pr-8">Manage Contact Lists</h3>
              
              {/* Search Lists */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={listSearchTerm}
                    onChange={(e) => setListSearchTerm(e.target.value)}
                    placeholder="Search contact lists..."
                    className="w-full pl-8 pr-3 py-2 glass rounded-lg text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Create New List */}
              <div className="mb-4 p-3 glass border border-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="New list name..."
                    className="flex-1 px-3 py-2 glass rounded text-white placeholder:text-slate-400"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newListName.trim()) {
                        const newList: ContactList = {
                          id: Date.now().toString(),
                          name: newListName.trim(),
                          contacts: [],
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        }
                        addContactList(newList)
                        setNewListName('')
                        toast.success(`Created contact list "${newList.name}"`)
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newListName.trim()) {
                        const newList: ContactList = {
                          id: Date.now().toString(),
                          name: newListName.trim(),
                          contacts: [],
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        }
                        addContactList(newList)
                        setNewListName('')
                        toast.success(`Created contact list "${newList.name}"`)
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lists */}
              <div className="space-y-3">
                {filteredLists.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    {contactLists.length === 0 ? 'No contact lists yet. Create one above.' : 'No lists match your search.'}
                  </p>
                ) : (
                  filteredLists.map((list) => (
                    <div key={list.id} className="glass border border-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-1">
                          {editingListId === list.id ? (
                            <div className="flex items-center space-x-1 flex-1">
                              <input
                                type="text"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                className="flex-1 px-2 py-1 glass rounded text-white text-sm"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  if (newListName.trim()) {
                                    updateContactList(list.id, { name: newListName.trim() })
                                    setEditingListId(null)
                                    setNewListName('')
                                  }
                                }}
                                className="p-1 text-green-400 hover:text-green-300"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingListId(null)
                                  setNewListName('')
                                }}
                                className="p-1 text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <h4 className="text-sm font-semibold text-white">{list.name}</h4>
                              <span className="text-xs text-slate-400">({list.contacts.length} contacts)</span>
                            </>
                          )}
                        </div>
                        {editingListId !== list.id && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setSelectedListId(list.id)
                                setSelectedLeads(list.contacts.map(c => c.email))
                                setShowListManager(false)
                              }}
                              className="px-2 py-1 text-xs glass hover:bg-slate-700/50 rounded text-slate-300"
                            >
                              Use
                            </button>
                            <button
                              onClick={() => {
                                setEditingListId(list.id)
                                setNewListName(list.name)
                              }}
                              className="p-1 text-slate-400 hover:text-slate-300"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${list.name}"? This cannot be undone.`)) {
                                  deleteContactList(list.id)
                                  if (selectedListId === list.id) {
                                    setSelectedListId(null)
                                    setSelectedLeads([])
                                  }
                                  toast.success('Contact list deleted')
                                }
                              }}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-2">
                        Created {format(new Date(list.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Campaigns List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emailCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="glass rounded-xl p-4 hover-lift"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{campaign.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => deleteEmailCampaign(campaign.id)}
                  className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-slate-200 mb-1">Subject:</p>
                <p className="text-sm text-slate-300">{campaign.subject}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-slate-200 mb-1">Recipients:</p>
                <div className="flex items-center space-x-1 text-sm text-slate-300">
                  <Users className="w-4 h-4" />
                  <span>{campaign.recipients.length} recipients</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  campaign.status === 'sent'
                    ? 'bg-green-100 text-green-700'
                    : campaign.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-700'
                    : 'glass text-slate-300'
                }`}>
                  {campaign.status}
                </span>
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => handleSend(campaign.id)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Now</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {emailCampaigns.length === 0 && (
          <div className="glass rounded-xl p-8 text-center">
            <Mail className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No campaigns yet</h3>
            <p className="text-slate-400 mb-6">
              Create your first email campaign to start automating your marketing
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Campaign</span>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
