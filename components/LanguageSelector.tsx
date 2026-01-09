'use client'

import { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { Language } from '@/lib/i18n'

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
]

export function LanguageSelector() {
  const [mounted, setMounted] = useState(false)
  const { language, setLanguage } = useLanguage()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always show English on server to match initial client render
  const currentLang = mounted 
    ? (languages.find((l) => l.code === language) || languages[0])
    : languages[0]

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors">
        <Globe className="w-5 h-5 text-slate-400" />
        <span className="text-lg">{currentLang.flag}</span>
        <span className="text-sm font-medium text-slate-200 hidden sm:inline">
          {currentLang.name}
        </span>
      </button>
      
      {mounted && (
        <div className="absolute right-0 mt-2 w-48 glass-strong rounded-xl shadow-glow-lg border border-slate-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                language === lang.code ? 'bg-purple-600/30 text-white' : 'text-slate-200'
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
              {language === lang.code && (
                <span className="ml-auto text-purple-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
