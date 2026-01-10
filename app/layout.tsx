import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster, toast as toastManager } from 'react-hot-toast'
import { LanguageProvider } from '@/lib/language-context'
import { HydrationProvider } from '@/lib/hydration-provider'
import { Navigation } from '@/components/Navigation'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'MarketingBot Pro - AI Marketing Automation',
  description: 'Automate your marketing with AI-powered content generation and scheduling',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MarketingBot Pro',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0ea5e9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Block rendering until CSS is loaded
              (function() {
                if (typeof window === 'undefined') return;
                
                // Hide body immediately
                document.documentElement.style.visibility = 'hidden';
                
                function showPage() {
                  document.documentElement.style.visibility = 'visible';
                }
                
                // Wait for CSS to load
                function waitForCSS() {
                  const stylesheets = document.styleSheets;
                  let loaded = 0;
                  let total = 0;
                  
                  for (let i = 0; i < stylesheets.length; i++) {
                    try {
                      if (stylesheets[i].href) {
                        total++;
                        if (stylesheets[i].href.includes('_next/static/css')) {
                          loaded++;
                        }
                      }
                    } catch(e) {}
                  }
                  
                  // If we have Next.js CSS or waited long enough, show page
                  if (loaded > 0 || document.readyState === 'complete') {
                    showPage();
                    return true;
                  }
                  return false;
                }
                
                // Check immediately
                if (waitForCSS()) return;
                
                // Check on load
                window.addEventListener('load', function() {
                  setTimeout(showPage, 100);
                });
                
                // Fallback: show after 2 seconds
                setTimeout(showPage, 2000);
                
                // Service worker handling
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                      navigator.serviceWorker.getRegistrations().then((registrations) => {
                        registrations.forEach((registration) => registration.unregister());
                      });
                    } else {
                      navigator.serviceWorker.register('/sw.js').catch(() => {});
                    }
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        <HydrationProvider>
          <LanguageProvider>
            <Navigation />
            {children}
            <Toaster 
              position="top-center"
              containerClassName="toast-container"
              toastOptions={{
                duration: 6000, // 6 seconds default duration
                success: {
                  duration: 7000, // 7 seconds for success messages
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 6000, // 6 seconds for error messages
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
                style: {
                  fontSize: '14px',
                  padding: '16px',
                  maxWidth: '500px',
                },
              }}
            />
          </LanguageProvider>
        </HydrationProvider>
      </body>
    </html>
  )
}
// Force rebuild 20260110-143120
