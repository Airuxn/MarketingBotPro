'use client'

import { useState, useEffect } from 'react'
import { Link, Plus, X, ExternalLink, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { analyzeContentFromUrl, StyleAnalysis } from '@/lib/content-analyzer'

interface ReferenceLink {
  id: string
  url: string
  status: 'pending' | 'analyzing' | 'success' | 'error'
  analysis?: StyleAnalysis
  error?: string
}

interface ReferenceLinksProps {
  onAnalysisComplete: (analyses: StyleAnalysis[]) => void
  savedLinks?: string[]
}

export function ReferenceLinks({ onAnalysisComplete, savedLinks = [] }: ReferenceLinksProps) {
  const [links, setLinks] = useState<ReferenceLink[]>([])
  const [inputUrl, setInputUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // Load saved links on mount
  useEffect(() => {
    if (savedLinks.length > 0) {
      savedLinks.forEach((url) => {
        analyzeLink(url)
      })
    }
  }, []) // Only run on mount

  const analyzeLink = async (url: string) => {
    const newLink: ReferenceLink = {
      id: Date.now().toString() + Math.random(),
      url,
      status: 'analyzing',
    }

    setLinks((prev) => [...prev, newLink])

    try {
      const analysis = await analyzeContentFromUrl(url)
      
      if (analysis) {
        const updatedLink = { ...newLink, status: 'success' as const, analysis }
        setLinks((prev) => {
          const updated = prev.map((l) => (l.id === newLink.id ? updatedLink : l))
          updateAnalyses(updated.filter((l) => l.analysis))
          return updated
        })
      } else {
        throw new Error('Failed to analyze content')
      }
    } catch (error: any) {
      const updatedLink = {
        ...newLink,
        status: 'error' as const,
        error: error.message || 'Failed to analyze content',
      }
      setLinks((prev) => prev.map((l) => (l.id === newLink.id ? updatedLink : l)))
    }
  }

  const addLink = async () => {
    if (!inputUrl.trim()) return

    const url = inputUrl.trim()
    // Basic URL validation
    try {
      new URL(url)
    } catch {
      alert('Please enter a valid URL')
      return
    }

    setIsAdding(true)
    await analyzeLink(url)
    setInputUrl('')
    setIsAdding(false)
  }

  const removeLink = (id: string) => {
    const updated = links.filter((l) => l.id !== id)
    setLinks(updated)
    updateAnalyses(updated.filter((l) => l.analysis))
  }

  const updateAnalyses = (linksWithAnalysis: ReferenceLink[]) => {
    const analyses = linksWithAnalysis
      .filter((l) => l.analysis)
      .map((l) => l.analysis!)
    if (analyses.length > 0) {
      onAnalysisComplete(analyses)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAdding) {
      addLink()
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reference Links (Optional)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Add links to your previous posts/ads so AI can match your style and tone
        </p>

        <div className="flex space-x-2">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://twitter.com/username/status/123456"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isAdding}
          />
          <button
            onClick={addLink}
            disabled={isAdding || !inputUrl.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Add</span>
          </button>
        </div>
      </div>

      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {link.status === 'analyzing' && (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                )}
                {link.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                )}
                {link.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                {link.status === 'pending' && (
                  <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate block"
                  >
                    {link.url}
                  </a>
                  {link.status === 'success' && link.analysis && (
                    <div className="text-xs text-gray-500 mt-1">
                      Style: {link.analysis.tone.join(', ')} •{' '}
                      {link.analysis.hashtagStyle.length > 0
                        ? `${link.analysis.hashtagStyle.length} hashtags`
                        : 'No hashtags'}
                    </div>
                  )}
                  {link.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">{link.error}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => removeLink(link.id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {links.length > 0 && links.some((l) => l.status === 'success') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>✓ Style Analysis Complete</strong>
            <br />
            AI will now match your previous post style, tone, and structure
          </p>
        </div>
      )}
    </div>
  )
}
