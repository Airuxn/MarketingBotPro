'use client'

import { Twitter, Linkedin, Facebook, Instagram } from 'lucide-react'

interface PlatformPreviewProps {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram'
  content: string
  imageUrl?: string | null
  businessName?: string
  isEditable?: boolean
  onContentChange?: (content: string) => void
}

export function PlatformPreview({ platform, content, imageUrl, businessName, isEditable = false, onContentChange }: PlatformPreviewProps) {
  const platformStyles = {
    twitter: {
      bg: 'bg-white',
      border: 'border border-gray-200',
      headerBg: 'bg-white',
      avatarBg: 'bg-blue-500',
      textColor: 'text-gray-900',
      metaColor: 'text-gray-500',
      imageBorder: 'border-gray-200',
    },
    facebook: {
      bg: 'bg-white',
      border: 'border border-gray-200',
      headerBg: 'bg-white',
      avatarBg: 'bg-blue-600',
      textColor: 'text-gray-900',
      metaColor: 'text-gray-500',
      imageBorder: 'border-gray-200',
    },
    linkedin: {
      bg: 'bg-white',
      border: 'border border-gray-200',
      headerBg: 'bg-white',
      avatarBg: 'bg-blue-700',
      textColor: 'text-gray-900',
      metaColor: 'text-gray-500',
      imageBorder: 'border-gray-200',
    },
    instagram: {
      bg: 'bg-white',
      border: 'border border-gray-200',
      headerBg: 'bg-white',
      avatarBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
      textColor: 'text-gray-900',
      metaColor: 'text-gray-500',
      imageBorder: 'border-gray-200',
    },
  }

  const styles = platformStyles[platform]
  const platformIcons = {
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
    instagram: Instagram,
  }
  const Icon = platformIcons[platform]

  const platformNames = {
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    instagram: 'Instagram',
  }

  return (
    <div className={`${styles.bg} ${styles.border} rounded-xl shadow-sm overflow-hidden w-full`} style={{ maxWidth: '100%', maxHeight: '100%', overflow: 'hidden' }}>
      {/* Platform Header */}
      <div className={`${styles.headerBg} px-4 py-3 border-b ${styles.border} flex items-center justify-between`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${styles.avatarBg} rounded-full flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className={`text-sm font-semibold ${styles.textColor}`}>
              {businessName || 'Your Business'}
            </div>
            <div className={`text-xs ${styles.metaColor}`}>
              @{businessName?.toLowerCase().replace(/\s+/g, '') || 'yourbusiness'} · Just now
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditable && onContentChange ? (
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className={`w-full ${styles.textColor} bg-transparent border-2 border-blue-400 rounded-lg px-3 py-2 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/50 whitespace-pre-wrap mb-3 placeholder:opacity-50`}
            rows={Math.max(3, content.split('\n').length + 1)}
            style={{ minHeight: '60px' }}
            placeholder="Edit your content directly in the preview..."
          />
        ) : (
        <p className={`${styles.textColor} whitespace-pre-wrap text-sm leading-relaxed mb-3`}>
          {content}
        </p>
        )}

        {/* Image Preview */}
        {imageUrl && (
          <div className={`mt-3 rounded-lg overflow-hidden border ${styles.imageBorder}`}>
            <img
              src={imageUrl}
              alt="Post preview"
              className="w-full h-auto object-cover"
              style={{
                maxHeight: platform === 'instagram' ? '500px' : '400px',
                objectFit: 'cover',
              }}
            />
          </div>
        )}

        {/* Platform-specific footer elements */}
        {platform === 'twitter' && (
          <div className="mt-3 flex items-center space-x-6 text-gray-500 text-sm">
            <div className="flex items-center space-x-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.23l-8.497 4.746c-1.103.617-2.457-.09-2.457-1.374v-1.704c3.392 0 6.435-1.28 8.8-3.548 2.235-2.15 3.5-5.17 3.5-8.39 0-3.39-2.744-6.13-6.129-6.13H9.756c-3.384 0-6.129 2.744-6.129 6.13v3.87z" />
              </svg>
              <span>0</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.791-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.791 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
              </svg>
              <span>0</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
              </svg>
              <span>0</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z" />
              </svg>
              <span>0</span>
            </div>
          </div>
        )}

        {platform === 'facebook' && (
          <div className="mt-3 flex items-center space-x-6 text-gray-500 text-sm">
            <button className="hover:text-blue-600 transition-colors">Like</button>
            <button className="hover:text-gray-700 transition-colors">Comment</button>
            <button className="hover:text-gray-700 transition-colors">Share</button>
          </div>
        )}

        {platform === 'linkedin' && (
          <div className="mt-3 flex items-center space-x-6 text-gray-500 text-sm">
            <button className="hover:text-blue-600 transition-colors flex items-center space-x-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.46 11l-3.91-3.91a7 7 0 01-1.69-2.74l-.49-1.47A2.76 2.76 0 0010.76 2H4.23a2.76 2.76 0 00-2.48 3.88l.49 1.47a7 7 0 01-1.69 2.74L3.54 11a6.78 6.78 0 010 2l3.91 3.91a7 7 0 011.69 2.74l.49 1.47a2.76 2.76 0 002.48 3.88h6.53a2.76 2.76 0 002.48-3.88l-.49-1.47a7 7 0 011.69-2.74L19.46 13a6.78 6.78 0 010-2z" />
              </svg>
              <span>Like</span>
            </button>
            <button className="hover:text-blue-600 transition-colors">Comment</button>
            <button className="hover:text-blue-600 transition-colors">Share</button>
          </div>
        )}

        {platform === 'instagram' && (
          <div className="mt-3 flex items-center space-x-6 text-gray-500 text-sm">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 1.072-.518 2.09-1.404 2.72L12 18.5l-8.096-6.658A4.987 4.987 0 012.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.12-1.763a4.21 4.21 0 013.675-1.941m0-2a6.04 6.04 0 00-4.797 2.127 6.052 6.052 0 00-4.787-2.127A6.985 6.985 0 00.5 9.122c0 1.72.518 3.312 1.404 4.65L12 20.5l10.096-6.728A6.98 6.98 0 0023.5 9.122a6.985 6.985 0 00-6.708-7.218z" />
            </svg>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 2.314a12.545 12.545 0 00-8 4.545 12.547 12.547 0 003.185 19.5c.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A12.548 12.548 0 0024 6.859 12.547 12.547 0 0016 2.314z" />
            </svg>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
