'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Sparkles,
  Calendar,
  Mail,
  Users,
  BarChart3,
  TrendingUp,
  MessageSquare
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { useLanguage } from '@/lib/language-context'
import { calculateEngagementRate } from '@/lib/content-performance-analyzer'

export default function Home() {
  const [isInstalled, setIsInstalled] = useState(false)
  const stats = useStore((state) => state.stats)
  const { posts, settings } = useStore()
  const { t } = useLanguage()
  
  // Calculate analytics data
  const postedPosts = posts.filter((p) => p.status === 'posted' && p.engagement)
  const totalViews = postedPosts.reduce((sum, p) => sum + (p.engagement?.views || 0), 0)
  const totalLikes = postedPosts.reduce((sum, p) => sum + (p.engagement?.likes || 0), 0)
  const totalComments = postedPosts.reduce((sum, p) => sum + (p.engagement?.comments || 0), 0)
  const totalShares = postedPosts.reduce((sum, p) => sum + (p.engagement?.shares || 0), 0)
  const avgEngagementRate = postedPosts.length > 0
    ? postedPosts.reduce((sum, p) => sum + calculateEngagementRate(p), 0) / postedPosts.length
    : 0
  const scannedPosts = settings.contentPreferences?.scannedPosts || []
  const hasData = postedPosts.length > 0 || scannedPosts.length > 0

  useEffect(() => {
    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Unregister service worker in dev mode to prevent 404 errors
    if ('serviceWorker' in navigator) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
      }
    }
  }, [])

  return (
    <div className="min-h-screen relative bg-slate-900">
      {/* Dashboard Header */}
      <div className="glass-strong border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg blur-lg opacity-60"></div>
              <div className="relative w-7 h-7 lg:w-10 lg:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-glow">
                <Sparkles className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg lg:text-2xl font-bold text-gradient">Dashboard</h1>
              <p className="text-xs lg:text-sm text-slate-300 hidden sm:block">Overview of your marketing performance</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 pb-1.5 lg:py-3 relative z-10">
        {/* Quick Actions */}
        <div className="mb-4 lg:mb-6">
          <h2 className="text-base lg:text-xl font-bold text-white mb-2.5 lg:mb-4 tracking-tight">{t('quickActions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4">
            {[
              {
                title: t('createContent'),
                description: t('generateAIPoweredPosts'),
                icon: Sparkles,
                href: '/content',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                title: t('schedulePosts'),
                description: t('planYourSocialMedia'),
                icon: Calendar,
                href: '/schedule',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                title: t('emailCampaigns'),
                description: t('automateYourEmails'),
                icon: Mail,
                href: '/email',
                gradient: 'from-green-500 to-emerald-500',
              },
              {
                title: t('manageLeads'),
                description: t('trackYourClients'),
                icon: Users,
                href: '/leads',
                gradient: 'from-orange-500 to-red-500',
              },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group relative overflow-hidden glass rounded-xl p-2.5 lg:p-4 hover-lift"
              >
                <div 
                  className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300" 
                  style={{
                    background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                    ['--tw-gradient-from' as string]: action.gradient.split(' ')[1],
                    ['--tw-gradient-to' as string]: action.gradient.split(' ')[3]
                  } as React.CSSProperties & Record<string, string>}
                ></div>
                <div className={`relative bg-gradient-to-br ${action.gradient} w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center mb-2 lg:mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-glow`}>
                  <action.icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <h3 className="relative text-sm lg:text-base font-bold text-white mb-1 lg:mb-1.5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-all duration-300 tracking-tight">
                  {action.title}
                </h3>
                <p className="relative text-[10px] lg:text-xs text-slate-300 leading-tight lg:leading-relaxed group-hover:text-slate-200 transition-colors">
                  {action.description}
                </p>
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                  style={{
                    background: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    ['--tw-gradient-from' as string]: action.gradient.split(' ')[1],
                    ['--tw-gradient-to' as string]: action.gradient.split(' ')[3]
                  } as React.CSSProperties & Record<string, string>}
                ></div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4 mb-4 lg:mb-6">
          <StatCard
            icon={MessageSquare}
            label={t('postsCreated')}
            value={stats.postsCreated}
            gradient="from-blue-500 to-cyan-500"
            glowColor="blue"
          />
          <StatCard
            icon={Mail}
            label={t('emailsSent')}
            value={stats.emailsSent}
            gradient="from-green-500 to-emerald-500"
            glowColor="green"
          />
          <StatCard
            icon={Users}
            label={t('leadsCaptured')}
            value={stats.leadsCaptured}
            gradient="from-purple-500 to-pink-500"
            glowColor="purple"
          />
          <StatCard
            icon={TrendingUp}
            label={t('engagementRate')}
            value={`${stats.engagementRate}%`}
            gradient="from-orange-500 to-red-500"
            glowColor="orange"
          />
        </div>

        {/* Analytics Preview */}
        <div className="glass rounded-xl p-2.5 lg:p-5 hover-lift">
          <div className="flex items-center justify-between mb-2.5 lg:mb-4">
            <h2 className="text-base lg:text-xl font-bold text-white tracking-tight">{t('analytics')}</h2>
            <Link
              href="/analytics"
              className="text-purple-400 hover:text-purple-300 font-semibold text-[10px] lg:text-sm transition-all duration-300 flex items-center space-x-1 lg:space-x-2 group"
            >
              <span className="hidden sm:inline">{t('viewFullReport')}</span>
              <span className="sm:hidden">View</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>
          </div>
          {hasData ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
              <div className="bg-slate-800/30 rounded-lg p-2 lg:p-3 border border-slate-700/50">
                <div className="flex items-center space-x-1 lg:space-x-2 mb-0.5 lg:mb-1">
                  <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 text-blue-400" />
                  <p className="text-[10px] lg:text-xs text-slate-400">Total Views</p>
                </div>
                <p className="text-base lg:text-lg font-bold text-white">{totalViews.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-2 lg:p-3 border border-slate-700/50">
                <div className="flex items-center space-x-1 lg:space-x-2 mb-0.5 lg:mb-1">
                  <MessageSquare className="w-3 h-3 lg:w-4 lg:h-4 text-purple-400" />
                  <p className="text-[10px] lg:text-xs text-slate-400">Total Likes</p>
                </div>
                <p className="text-base lg:text-lg font-bold text-white">{totalLikes.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-2 lg:p-3 border border-slate-700/50">
                <div className="flex items-center space-x-1 lg:space-x-2 mb-0.5 lg:mb-1">
                  <MessageSquare className="w-3 h-3 lg:w-4 lg:h-4 text-green-400" />
                  <p className="text-[10px] lg:text-xs text-slate-400">Comments</p>
                </div>
                <p className="text-base lg:text-lg font-bold text-white">{totalComments.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-2 lg:p-3 border border-slate-700/50">
                <div className="flex items-center space-x-1 lg:space-x-2 mb-0.5 lg:mb-1">
                  <BarChart3 className="w-3 h-3 lg:w-4 lg:h-4 text-orange-400" />
                  <p className="text-[10px] lg:text-xs text-slate-400">Engagement</p>
                </div>
                <p className="text-base lg:text-lg font-bold text-white">{avgEngagementRate.toFixed(1)}%</p>
              </div>
            </div>
          ) : (
            <div className="h-32 lg:h-40 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-2xl"></div>
                  <BarChart3 className="relative w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 lg:mb-3 text-purple-400" />
                </div>
                <p className="text-[10px] lg:text-xs text-slate-400">{t('analyticsDashboard')}</p>
                <p className="text-[9px] lg:text-xs text-slate-500 mt-1 lg:mt-2">Track engagement on your posts to see analytics here</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  gradient,
  glowColor
}: { 
  icon: any
  label: string
  value: string | number
  gradient: string
  glowColor: string
}) {
  return (
    <div className="group relative glass rounded-xl p-4 hover-lift overflow-hidden">
      <div 
        className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-300" 
        style={{
          background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
          ['--tw-gradient-from' as string]: gradient.split(' ')[1],
          ['--tw-gradient-to' as string]: gradient.split(' ')[3]
        } as React.CSSProperties & Record<string, string>}
      ></div>
      <div className="relative">
        <div className={`bg-gradient-to-br ${gradient} w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center mb-2 lg:mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-glow`}>
          <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
        </div>
        <p 
          className="text-lg lg:text-2xl font-bold text-white mb-0.5 lg:mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all duration-300" 
          style={{
            ['--tw-gradient-from' as string]: gradient.split(' ')[1],
            ['--tw-gradient-to' as string]: gradient.split(' ')[3]
          } as React.CSSProperties & Record<string, string>}
        >{value}</p>
        <p className="text-[10px] lg:text-xs text-slate-300 font-medium">{label}</p>
      </div>
    </div>
  )
}
