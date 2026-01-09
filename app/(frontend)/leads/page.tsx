'use client'

import { useState } from 'react'
import { Users, Plus, Search, Mail, Phone, MapPin, Trash2, Edit2 } from 'lucide-react'
import { useStore, Lead } from '@/lib/store'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function LeadsPage() {
  const { leads, addLead, updateLead, deleteLead } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    notes: '',
  })

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required')
      return
    }

    if (editingLead) {
      updateLead(editingLead.id, formData)
      toast.success('Lead updated!')
    } else {
      const newLead: Lead = {
        id: Date.now().toString(),
        ...formData,
        status: 'new',
        createdAt: new Date().toISOString(),
      }
      addLead(newLead)
      toast.success('Lead added!')
    }

    setShowAdd(false)
    setEditingLead(null)
    setFormData({ name: '', email: '', phone: '', source: '', notes: '' })
  }

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead)
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      source: lead.source,
      notes: lead.notes || '',
    })
    setShowAdd(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      deleteLead(id)
      toast.success('Lead deleted')
    }
  }

  const filteredLeads = leads.filter((lead) =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.source.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statusColors = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    qualified: 'bg-purple-100 text-purple-700',
    converted: 'bg-green-100 text-green-700',
  }

  return (
    <div className="min-h-screen relative">
      {/* Page Header */}
      <div className="glass-strong border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">Lead Management</h1>
                <p className="text-sm text-slate-300">Track and manage your clients</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowAdd(true)
                setEditingLead(null)
                setFormData({ name: '', email: '', phone: '', source: '', notes: '' })
              }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Add Lead</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by name, email, or source..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-strong rounded-xl p-5 max-w-md w-full shadow-glow-lg">
              <h3 className="text-lg font-bold text-white mb-4">
                {editingLead ? 'Edit Lead' : 'Add New Lead'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 glass rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 glass rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 glass rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Source
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="E.g., Website, Social Media, Referral"
                    className="w-full px-4 py-2 glass rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingLead ? 'Update' : 'Add'} Lead
                  </button>
                  <button
                    onClick={() => {
                      setShowAdd(false)
                      setEditingLead(null)
                      setFormData({ name: '', email: '', phone: '', source: '', notes: '' })
                    }}
                    className="flex-1 glass text-slate-300 py-2 px-4 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leads Grid */}
        {filteredLeads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="glass rounded-xl p-4 hover-lift"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{lead.name}</h3>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                      {lead.status}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(lead)}
                      className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(lead.id)}
                      className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-slate-300">
                    <Mail className="w-4 h-4" />
                    <span>{lead.email}</span>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center space-x-2 text-sm text-slate-300">
                      <Phone className="w-4 h-4" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  {lead.source && (
                    <div className="flex items-center space-x-2 text-sm text-slate-300">
                      <MapPin className="w-4 h-4" />
                      <span>{lead.source}</span>
                    </div>
                  )}
                  {lead.notes && (
                    <p className="text-sm text-slate-400 mt-3 line-clamp-2">{lead.notes}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-slate-500">
                    Added {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-8 text-center">
            <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm ? 'No leads found' : 'No leads yet'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm
                ? 'Try a different search term'
                : 'Start tracking your potential clients'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  setShowAdd(true)
                  setEditingLead(null)
                  setFormData({ name: '', email: '', phone: '', source: '', notes: '' })
                }}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Lead</span>
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
