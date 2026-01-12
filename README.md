# MarketingBot Pro

> ⚠️ **ABANDONED** ⚠️  
> This project is no longer maintained. Some features may be incomplete or broken. Use at your own discretion.

> AI-Powered Marketing Automation Platform

A modern, enterprise-grade Progressive Web App (PWA) that automates marketing tasks using AI. Built for businesses that demand simplicity without compromising on power and sophistication.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## ✨ Features

### 🤖 AI-Powered Content Generation
- Generate social media posts, emails, and ad copy with Google Gemini
- Review one example at a time - regenerate until you're happy
- **Edit generated content** - make changes and the AI learns from your edits
- **Adaptive Learning System** - AI learns your preferences from:
  - Accepted content (what you approve)
  - Content edits (how you modify generated content)
  - Scanned social media posts (your existing posted content)
- **Auto-scanning**: Automatically scans connected social media accounts to learn from your existing posts
- Platform-specific optimization (Twitter, LinkedIn, Facebook, Instagram)
- Style learning from your existing content
- Performance-based content recommendations
- Gets smarter with every use - learns what you like and adapts

### 🤖 Automated Posting
- **Automation Rules** - Create rules for automated posting
- Schedule automated posts (daily, weekly, monthly)
- AI-generated content automation
- Template-based automation
- Content from scanned posts automation
- Track automation performance and statistics

### 📅 Smart Scheduling
- Schedule posts across multiple platforms
- Manage drafts and scheduled content
- Track posting history and engagement
- Mark posts as published with engagement tracking
- Manual engagement tracking for accurate analytics

### 📧 Email Campaign Automation
- Create email campaigns with AI assistance
- **Tone selector**: Choose from Personal, Neutral, Professional, or Marketing tones
- **Smart subject line generation**: AI generates polished subject lines based on your topic
- **Context-aware content**: AI understands context from your subject/topic to generate appropriate emails
- **Multi-language support**: Generate emails in your selected language (English, French, Dutch)
- **Contact list management**: Create and manage multiple contact lists for targeted campaigns
- Manage recipient lists
- Track campaign performance

### 👥 Lead Management
- Capture and organize leads
- Track lead status (new, contacted, qualified, converted)
- Advanced search and filtering
- Lead source tracking

### 📊 Advanced Analytics
- Real-time engagement metrics (views, likes, comments, shares, reach)
- **AI Performance Insights** - actionable recommendations based on posted content and scanned social media
- **AI Current Learned Preferences** - see what the AI has learned about your style
- **Mobile-optimized interface** - Performance Insights and Learned Preferences combined in a tabbed interface on mobile with "/" separator
- Best posting times analysis
- Content type performance tracking
- Platform performance comparison
- Top performing posts identification
- Engagement rate calculations
- Performance scoring system
- Analyzes both manually tracked posts and automatically scanned social media posts
- Time range selector for engagement trends (7D, 14D, 30D, 90D, All)

### 🌍 Internationalization
- Multi-language support (English, French, Dutch)
- Seamless language switching
- Localized content generation

### 🎨 Professional Design
- **Premium dark theme** with glassmorphism effects
- Modern, clean interface with professional color scheme (indigo/purple gradients)
- Animated gradient backgrounds and glow effects
- Contained layout with proper spacing (not stretched edge-to-edge)
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Professional typography and spacing
- Soft shadows and refined visual hierarchy

### 📱 Progressive Web App
- Installable on any device
- Offline support
- Fast loading with optimized assets
- Native app-like experience
- **Mobile-optimized** - Improved image loading with error handling and placeholders
- **CORS-aware** - Handles cross-origin image loading issues gracefully
- **Server-side proxies** - Twitter, LinkedIn, and Instagram use server-side APIs to avoid CORS issues on mobile browsers

### 💾 Data Backup & Restore
- **Export all data** - Download JSON backup files
- **Import/Restore** - Upload backup files to restore data
- **Automatic backups** - Last 5 backups stored automatically
- **Protect your data** - Never lose data when clearing browser cache

### 🐛 Mobile Debugging
- **Mobile Debug Console** - View console logs directly on your phone
- **Remote Log Viewer** - View mobile logs on your computer in real-time
- **Auto-enabled on mobile** - Debug console appears automatically on mobile devices
- **Filter by log type** - Filter errors, warnings, and info logs
- **Download logs** - Export logs as text file for analysis

### 🆓 Free-Tier API Optimization
- **Optimized for free-tier social media APIs** - Runs entirely on free-tier APIs
- **Twitter/X**: Free tier support (100 posts/month shared, 20 customers max recommended)
- **Facebook/Instagram**: Free tier (unlimited customers, per-user limits)
- **LinkedIn**: Free tier (supports thousands of customers, 100K calls/day)
- **Smart caching** - Optimized cache strategies to stay within free-tier limits
- **Storage optimization** - All data fits within browser localStorage (~5MB per customer)
- **No paid APIs required** - Fully functional on free-tier APIs (except Twitter for >20 customers)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
marketing-bot/
├── app/                      # Next.js App Router
│   ├── (frontend)/          # Frontend pages (user interface)
│   │   ├── page.tsx         # Home/Dashboard page
│   │   ├── automate/        # Automated posting rules
│   │   ├── analytics/       # Analytics dashboard
│   │   ├── content/         # AI content generator
│   │   ├── email/           # Email campaigns
│   │   ├── leads/           # Lead management
│   │   ├── schedule/        # Post scheduling
│   │   └── settings/        # Settings page
│   ├── (backend)/           # Backend API routes (server code)
│   │   └── api/             # API endpoints
│   │       ├── oauth/       # OAuth handlers (Facebook, Instagram, Twitter, LinkedIn)
│   │       ├── analyze-content/  # Content analysis endpoint
│   │       └── extract-images/   # Image extraction endpoint
│   ├── globals.css          # Global styles
│   └── layout.tsx           # Root layout
├── components/                # React components
│   ├── AdPlatformConnector.tsx
│   ├── BrandImageLibrary.tsx
│   ├── CreateAdDialog.tsx
│   ├── EngagementTracker.tsx
│   ├── LanguageSelector.tsx
│   ├── MediaUpload.tsx
│   ├── Navigation.tsx
│   ├── NoSSR.tsx
│   └── SocialAccountConnector.tsx
├── lib/                       # Core utilities
│   ├── ad-platforms.ts       # Ad platform configurations
│   ├── ai.ts                  # Google Gemini integration
│   ├── auto-scanner.ts        # Social media account scanning
│   ├── backup.ts              # Data backup/restore system
│   ├── content-analyzer.ts    # Content style analysis
│   ├── content-learner.ts     # AI learning from user preferences
│   ├── content-performance-analyzer.ts  # Performance insights
│   ├── facebook-ads.ts        # Facebook Ads API
│   ├── google-ads.ts          # Google Ads API
│   ├── instagram-ads.ts       # Instagram Ads API
│   ├── hydration-provider.tsx # SSR hydration handling
│   ├── i18n.ts                # Internationalization
│   ├── image-editor.ts        # Image editing utilities
│   ├── image-extractor.ts     # Image extraction
│   ├── image-optimizer.ts     # Image optimization
│   ├── language-context.tsx   # Language context provider
│   ├── linkedin-ads.ts       # LinkedIn Ads API
│   ├── platform-specs.ts     # Platform specifications
│   ├── post-publisher.ts     # Post publishing utilities
│   ├── store.ts               # Zustand state management
│   └── twitter-ads.ts         # Twitter Ads API
├── public/                    # Static assets
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── docs/                      # Documentation
│   ├── AD_INTEGRATION.md      # Ad platform integration guide
│   ├── ARCHITECTURE.md        # System architecture
│   ├── BRAND_IMAGES.md        # Brand image library docs
│   ├── MEDIA_FEATURES.md      # Media handling features
│   ├── QUICKSTART.md          # Quick start guide
│   ├── README.md              # Documentation index
│   ├── SETUP.md               # Setup instructions
│   └── UPGRADE_NODE.md        # Node.js upgrade guide
├── .env.example               # Environment variables template
├── .eslintrc.json             # ESLint configuration
├── .gitignore                 # Git ignore rules
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## 🛠️ Tech Stack

- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[Google Gemini](https://deepmind.google/technologies/gemini/)** - AI content generation
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[React Hot Toast](https://react-hot-toast.com/)** - Toast notifications
- **[Recharts](https://recharts.org/)** - Chart library for analytics
- **[date-fns](https://date-fns.org/)** - Date utility library

## 📚 Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** - Get up and running quickly
- **[Setup Instructions](docs/SETUP.md)** - Detailed setup guide
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and design
- **[Ad Integration](docs/AD_INTEGRATION.md)** - Ad platform integration guide
- **[Brand Images](docs/BRAND_IMAGES.md)** - Brand image library documentation
- **[Media Features](docs/MEDIA_FEATURES.md)** - Media handling and optimization

## 🎯 Usage

1. **Initial Setup**
   - Go to Settings
   - Connect social media accounts (optional)
   - Add your Google Gemini API key
   - Fill in business information

2. **Create Content**
   - Navigate to Content
   - Select content type (Post, Paid Ad)
   - Choose platform (Twitter, LinkedIn, Facebook, Instagram)
   - Enter your prompt
   - Upload media or select from brand image library
   - Generate content - review the preview
   - **Edit directly in preview** - inline editing with AI learning
   - Regenerate if not satisfied
   - Accept when happy - AI learns your preferences
   - Scroll down for full-size preview after generation

3. **Automate Posting**
   - Navigate to Automate
   - Create automation rules for scheduled posting
   - Configure frequency (daily, weekly, monthly)
   - Choose content type (AI-generated, template, or scanned)
   - Select target platform
   - Enable/disable rules as needed
   - Track automation statistics

4. **Schedule Posts**
   - Create or save content
   - Schedule for optimal times
   - Track engagement after posting

5. **Manage Leads**
   - Add leads manually or import
   - Track status and notes
   - Convert leads to clients

6. **Analytics**
   - View performance metrics
   - Get AI-powered insights
   - Optimize based on data

## 🔧 Development

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Style

- TypeScript strict mode enabled
- ESLint configured with Next.js rules
- Prettier recommended (add if needed)

## 🏗️ Architecture

- **App Router**: Next.js 14 App Router with organized structure
  - `(frontend)/` - All user-facing pages
  - `(backend)/api/` - All API routes and server code
- **Server Components**: Default server-side rendering
- **Client Components**: Marked with `'use client'` directive
- **API Routes**: Next.js API routes for OAuth, content analysis, and image extraction
- **State Management**: Zustand with localStorage persistence
- **Data Backup**: Export/import system with automatic backups
- **Styling**: Tailwind CSS with professional design system
- **Internationalization**: Custom i18n solution
- **AI Learning System**: Tracks user preferences from accepted content, edits, and scanned posts
- **Content Performance Analysis**: Analyzes engagement data from both manual tracking and scanned social media

## 🔒 Security

- API keys stored in client-side state (consider server-side for production)
- CORS protection on API routes
- Input validation and sanitization
- Secure service worker implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) and the Vercel team for the React framework and deployment platform
- [Google Gemini](https://deepmind.google/technologies/gemini/) for AI content generation capabilities
- [Tailwind CSS](https://tailwindcss.com/), [Zustand](https://zustand-demo.pmnd.rs/), and the broader open-source React ecosystem
- Social platform developers whose APIs make multi-channel marketing automation possible

---

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Documentation: see the [`docs/`](docs/) folder

---

**⭐ If this project helped you, please give it a star!**
