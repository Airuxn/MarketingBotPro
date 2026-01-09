'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language } from './i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start with 'en' - will be updated after mount
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    // Load saved language from localStorage (only on client after mount)
    const saved = localStorage.getItem('marketing-bot-language') as Language
    if (saved && ['en', 'fr', 'nl'].includes(saved)) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('marketing-bot-language', lang)
  }

  const t = (key: string): string => {
    const { getTranslation } = require('./i18n')
    return getTranslation(key, language)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
