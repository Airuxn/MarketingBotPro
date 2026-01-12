'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Sparkles, 
  Calendar, 
  Mail, 
  Users, 
  BarChart3, 
  Settings,
  Zap,
  Bot
} from 'lucide-react'
import { LanguageSelector } from './LanguageSelector'
import { useLanguage } from '@/lib/language-context'

const navigation = [
  { nameKey: 'dashboard', href: '/', icon: Home },
  { nameKey: 'automate', href: '/automate', icon: Bot },
  { nameKey: 'content', href: '/content', icon: Sparkles },
  { nameKey: 'schedule', href: '/schedule', icon: Calendar },
  { nameKey: 'email', href: '/email', icon: Mail },
  { nameKey: 'leads', href: '/leads', icon: Users },
  { nameKey: 'analytics', href: '/analytics', icon: BarChart3 },
]

export function Navigation() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/40 border-b border-slate-800/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group relative">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 rounded-lg blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
              <div className="relative w-9 h-9 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-all duration-300">
              <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-all duration-300">
              MarketingBot Pro
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isAutomate = item.nameKey === 'automate'
              return (
                <Link
                  key={item.nameKey}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'text-white bg-slate-800/60 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  } ${isAutomate ? 'font-semibold' : ''}`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${
                    isAutomate 
                      ? 'text-cyan-400' 
                      : isActive 
                        ? 'text-white' 
                        : 'text-slate-500 group-hover:text-white'
                  }`} />
                  <span className={isAutomate ? 'rainbow-text' : ''}>{t(item.nameKey)}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Settings Icon, Language Selector and Mobile Menu */}
          <div className="flex items-center gap-0.5">
            {/* Settings Icon */}
            <Link
              href="/settings"
              className={`p-2 rounded-lg transition-all duration-200 ${
                pathname === '/settings'
                  ? 'bg-slate-800/60 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
              aria-label="Settings"
            >
              <Settings className={`w-5 h-5 ${pathname === '/settings' ? 'text-white' : 'text-slate-400'}`} />
            </Link>
            
            <LanguageSelector />
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <MobileMenu pathname={pathname} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

function MobileMenu({ pathname }: { pathname: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useLanguage()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-slate-800/50 transition-all duration-200"
        aria-label="Menu"
      >
        <svg
          className="w-5 h-5 text-slate-300"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-14 w-56 backdrop-blur-xl bg-slate-900/95 rounded-xl shadow-glow-lg z-50 overflow-hidden border border-slate-800/50">
            <div className="py-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const isAutomate = item.nameKey === 'automate'
                return (
                  <Link
                    key={item.nameKey}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-white bg-slate-800/60'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                    } ${isAutomate ? 'font-semibold' : ''}`}
                  >
                    <Icon className={`w-5 h-5 transition-colors ${
                      isAutomate 
                        ? 'text-cyan-400' 
                        : isActive 
                          ? 'text-white' 
                          : 'text-slate-400'
                    }`} />
                    <span className={isAutomate ? 'rainbow-text' : ''}>{t(item.nameKey)}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
