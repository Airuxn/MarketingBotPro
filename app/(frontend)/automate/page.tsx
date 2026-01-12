'use client'

import { useState, useEffect } from 'react'
import { Bot, Plus, Trash2, Play, Pause, Calendar, Clock, Twitter, Linkedin, Facebook, Instagram, CheckCircle, X, Edit2, Save, Zap, Settings, Repeat, TrendingUp } from 'lucide-react'
import { useStore } from '@/lib/store'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useLanguage } from '@/lib/language-context'

interface AutomationRule {
  id: string
  name: string
  enabled: boolean
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram'
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
    days?: number[] // 0-6 for weekly, 1-31 for monthly
  }
  content: {
    type: 'ai-generated' | 'template' | 'scanned'
    prompt?: string
    template?: string
  }
  filters: {
    minEngagement?: number
    contentType?: string[]
    hashtags?: string[]
  }
  lastRun?: string
  nextRun?: string
  stats: {
    postsCreated: number
    postsPublished: number
    avgEngagement: number
  }
  createdAt: string
}

export default function AutomatePage() {
  const { t } = useLanguage()
  const { settings, posts } = useStore()
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    platform: 'twitter' as 'twitter' | 'linkedin' | 'facebook' | 'instagram',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '09:00',
    days: [] as number[],
    contentType: 'ai-generated' as 'ai-generated' | 'template' | 'scanned',
    prompt: '',
    template: '',
  })

  const platformIcons = {
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
    instagram: Instagram,
  }

  // Load automation rules from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('automationRules')
    if (saved) {
      try {
        setAutomationRules(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading automation rules:', error)
      }
    }
  }, [])

  // Save automation rules to localStorage
  useEffect(() => {
    if (automationRules.length > 0) {
      localStorage.setItem('automationRules', JSON.stringify(automationRules))
    }
  }, [automationRules])

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a name for the automation rule')
      return
    }

    if (formData.contentType === 'ai-generated' && !formData.prompt.trim()) {
      toast.error('Please enter a prompt for AI-generated content')
      return
    }

    if (formData.contentType === 'template' && !formData.template.trim()) {
      toast.error('Please enter a template')
      return
    }

    const now = new Date().toISOString()
    const rule: AutomationRule = {
      id: editingRule?.id || Date.now().toString(),
      name: formData.name,
      enabled: editingRule?.enabled || false,
      platform: formData.platform,
      schedule: {
        frequency: formData.frequency,
        time: formData.time,
        days: formData.days,
      },
      content: {
        type: formData.contentType,
        prompt: formData.prompt,
        template: formData.template,
      },
      filters: {},
      stats: editingRule?.stats || {
        postsCreated: 0,
        postsPublished: 0,
        avgEngagement: 0,
      },
      createdAt: editingRule?.createdAt || now,
    }

    if (editingRule) {
      setAutomationRules(rules => rules.map(r => r.id === editingRule.id ? rule : r))
      toast.success('Automation rule updated!')
    } else {
      setAutomationRules(rules => [...rules, rule])
      toast.success('Automation rule created!')
    }

    setShowCreate(false)
    setEditingRule(null)
    setFormData({
      name: '',
      platform: 'twitter',
      frequency: 'daily',
      time: '09:00',
      days: [],
      contentType: 'ai-generated',
      prompt: '',
      template: '',
    })
  }

  const handleToggle = (id: string) => {
    setAutomationRules(rules =>
      rules.map(rule =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
    toast.success('Automation rule toggled')
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this automation rule?')) {
      setAutomationRules(rules => rules.filter(rule => rule.id !== id))
      toast.success('Automation rule deleted')
    }
  }

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      platform: rule.platform,
      frequency: rule.schedule.frequency,
      time: rule.schedule.time,
      days: rule.schedule.days || [],
      contentType: rule.content.type,
      prompt: rule.content.prompt || '',
      template: rule.content.template || '',
    })
    setShowCreate(true)
  }

  const calculateNextRun = (rule: AutomationRule): string => {
    if (!rule.enabled) return 'N/A'
    
    const now = new Date()
    const [hours, minutes] = rule.schedule.time.split(':').map(Number)
    const nextRun = new Date()
    nextRun.setHours(hours, minutes, 0, 0)

    if (rule.schedule.frequency === 'daily') {
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
    } else if (rule.schedule.frequency === 'weekly') {
      const days = rule.schedule.days || []
      if (days.length > 0) {
        const currentDay = now.getDay()
        const sortedDays = [...days].sort((a, b) => a - b)
        let nextDay = sortedDays.find(d => d > currentDay)
        if (!nextDay) nextDay = sortedDays[0]
        const daysUntil = nextDay - currentDay + (nextDay <= currentDay ? 7 : 0)
        nextRun.setDate(now.getDate() + daysUntil)
      } else {
        nextRun.setDate(now.getDate() + 1)
      }
    } else if (rule.schedule.frequency === 'monthly') {
      const days = rule.schedule.days || []
      if (days.length > 0) {
        const currentDay = now.getDate()
        const sortedDays = [...days].sort((a, b) => a - b)
        let nextDay = sortedDays.find(d => d > currentDay)
        if (!nextDay) {
          nextDay = sortedDays[0]
          nextRun.setMonth(nextRun.getMonth() + 1)
        }
        nextRun.setDate(nextDay)
      } else {
        nextRun.setDate(now.getDate() + 1)
      }
    }

    return format(nextRun, 'MMM d, yyyy HH:mm')
  }

  const connectedPlatforms = (settings.socialAccounts || []).filter(acc => acc.connected)

  return (
    <div className="min-h-screen relative bg-slate-900">
      {/* Page Header */}
      <div className="glass-strong border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg blur-lg opacity-60"></div>
              <div className="relative w-7 h-7 lg:w-10 lg:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-glow">
                <Bot className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg lg:text-2xl font-bold text-gradient">Automate</h1>
              <p className="text-xs lg:text-sm text-slate-300 hidden sm:block">Automated posting and content generation</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 pb-1.5 lg:py-3">
        {/* Info Banner */}
        {connectedPlatforms.length === 0 && (
          <div className="glass rounded-lg p-3 lg:p-4 mb-4 border border-yellow-500/30 bg-yellow-500/10">
            <div className="flex items-start space-x-3">
              <Settings className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-200 mb-1">Connect Social Accounts</h3>
                <p className="text-xs text-yellow-200/80">Connect at least one social media account in Settings to start automating posts.</p>
              </div>
            </div>
          </div>
        )}

        {/* Header Actions */}
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div>
            <h2 className="text-base lg:text-xl font-bold text-white mb-1">Automation Rules</h2>
            <p className="text-xs lg:text-sm text-slate-400">
              {automationRules.length} {automationRules.length === 1 ? 'rule' : 'rules'} configured
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreate(true)
              setEditingRule(null)
              setFormData({
                name: '',
                platform: 'twitter',
                frequency: 'daily',
                time: '09:00',
                days: [],
                contentType: 'ai-generated',
                prompt: '',
                template: '',
              })
            }}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md text-xs lg:text-sm"
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden sm:inline">New Rule</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Automation Rules List */}
        {automationRules.length === 0 ? (
          <div className="glass rounded-xl p-8 lg:p-12 text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-2xl"></div>
              <Bot className="relative w-12 h-12 lg:w-16 lg:h-16 mx-auto text-cyan-400" />
            </div>
            <h3 className="text-base lg:text-lg font-semibold text-white mb-2">No Automation Rules</h3>
            <p className="text-xs lg:text-sm text-slate-400 mb-4">Create your first automation rule to start automating your social media posts.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Rule</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            {automationRules.map((rule) => {
              const PlatformIcon = platformIcons[rule.platform]
              const nextRun = calculateNextRun(rule)
              
              return (
                <div
                  key={rule.id}
                  className="glass rounded-xl p-3 lg:p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        rule.enabled 
                          ? 'bg-green-500/20 border border-green-500/50' 
                          : 'bg-slate-700/50 border border-slate-600/50'
                      }`}>
                        <PlatformIcon className={`w-4 h-4 lg:w-5 lg:h-5 ${
                          rule.enabled ? 'text-green-400' : 'text-slate-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm lg:text-base font-semibold text-white mb-1 truncate">{rule.name}</h3>
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <span className="capitalize">{rule.platform}</span>
                          <span>•</span>
                          <span className="capitalize">{rule.schedule.frequency}</span>
                          <span>•</span>
                          <span>{rule.schedule.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleToggle(rule.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          rule.enabled
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700/70'
                        }`}
                        aria-label={rule.enabled ? 'Disable' : 'Enable'}
                      >
                        {rule.enabled ? (
                          <Play className="w-4 h-4" />
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700/70 hover:text-white transition-colors"
                        aria-label="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Status</span>
                      <span className={`font-medium ${
                        rule.enabled ? 'text-green-400' : 'text-slate-500'
                      }`}>
                        {rule.enabled ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Next Run</span>
                      <span className="text-slate-300 font-medium">{nextRun}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Content Type</span>
                      <span className="text-slate-300 capitalize">{rule.content.type.replace('-', ' ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                    <div className="flex items-center space-x-4 text-xs">
                      <div>
                        <span className="text-slate-400">Created</span>
                        <span className="text-slate-300 ml-1">{rule.stats.postsCreated}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Published</span>
                        <span className="text-slate-300 ml-1">{rule.stats.postsPublished}</span>
                      </div>
                      {rule.stats.avgEngagement > 0 && (
                        <div>
                          <span className="text-slate-400">Avg Engagement</span>
                          <span className="text-green-400 ml-1">{rule.stats.avgEngagement.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-strong rounded-xl p-4 lg:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-glow-lg relative">
              <button
                onClick={() => {
                  setShowCreate(false)
                  setEditingRule(null)
                }}
                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg lg:text-xl font-bold text-white mb-4 pr-8">
                {editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Daily Twitter Posts"
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Platform *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['twitter', 'linkedin', 'facebook', 'instagram'] as const).map((platform) => {
                      const Icon = platformIcons[platform]
                      const isConnected = connectedPlatforms.some(acc => acc.platform === platform)
                      return (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => setFormData({ ...formData, platform })}
                          disabled={!isConnected}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.platform === platform
                              ? 'border-blue-500 bg-blue-500/20'
                              : 'border-slate-700 bg-slate-800/50'
                          } ${!isConnected ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-600'}`}
                        >
                          <Icon className={`w-5 h-5 mx-auto mb-1 ${
                            formData.platform === platform ? 'text-blue-400' : 'text-slate-400'
                          }`} />
                          <span className={`text-xs capitalize ${
                            formData.platform === platform ? 'text-white' : 'text-slate-400'
                          }`}>
                            {platform}
                          </span>
                          {!isConnected && (
                            <span className="text-[10px] text-red-400 block mt-1">Not connected</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Frequency *
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any, days: [] })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Content Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Content Type *
                  </label>
                  <select
                    value={formData.contentType}
                    onChange={(e) => setFormData({ ...formData, contentType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ai-generated">AI Generated</option>
                    <option value="template">Template</option>
                    <option value="scanned">From Scanned Posts</option>
                  </select>
                </div>

                {/* Prompt or Template */}
                {formData.contentType === 'ai-generated' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      AI Prompt *
                    </label>
                    <textarea
                      value={formData.prompt}
                      onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      placeholder="Describe what kind of content you want to generate..."
                    />
                  </div>
                )}

                {formData.contentType === 'template' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Template *
                    </label>
                    <textarea
                      value={formData.template}
                      onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      placeholder="Enter your post template..."
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => {
                      setShowCreate(false)
                      setEditingRule(null)
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
