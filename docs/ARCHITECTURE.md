# Architecture Overview

## System Architecture

MarketingBot Pro is built using Next.js 14 with the App Router, following modern React patterns and best practices.

## Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management with persistence

### AI & APIs
- **Google Gemini** - Content generation
- **Social Media APIs** - Facebook, Twitter, LinkedIn, Instagram
- **Ad Platform APIs** - Facebook Ads, Google Ads, LinkedIn Ads, Twitter Ads

### State Management
- **Zustand** with `persist` middleware for client-side state
- Hydration-safe implementation to prevent SSR mismatches

## Project Structure

```
marketing-bot/
├── app/                    # Next.js App Router
│   ├── (frontend)/       # Frontend pages (user interface)
│   ├── (backend)/        # Backend API routes (server code)
│   │   └── api/          # API endpoints (OAuth, content analysis, etc.)
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── components/            # React components
├── lib/                   # Core utilities and business logic
│   ├── store.ts          # Zustand store with localStorage persistence
│   ├── backup.ts         # Data backup/restore system
│   ├── ai.ts             # Google Gemini integration
│   ├── content-learner.ts  # AI learning from user preferences
│   ├── content-performance-analyzer.ts  # Performance insights
│   ├── auto-scanner.ts   # Social media account scanning
│   └── [utilities]       # Helper functions
├── public/                # Static assets
└── docs/                  # Documentation
```

## Key Design Decisions

### 1. Client-Side State Management
- Zustand with localStorage persistence
- Hydration-safe implementation to prevent SSR issues
- Skip hydration on server, manual rehydration on client
- **Data Backup System**: Export/import functionality with automatic backups
- **Data Protection**: Users can export backups to prevent data loss

### 2. Internationalization
- Custom i18n solution (no external library)
- Language context with localStorage persistence
- Support for English, French, Dutch

### 3. Media Handling
- Client-side image optimization
- Platform-specific validation
- Automatic resizing and quality adjustment

### 4. Performance
- Automatic account scanning for brand images
- Performance-based AI recommendations
- Engagement tracking and analytics

## Data Flow

1. **User Input** → Component State
2. **Component State** → Zustand Store
3. **Store** → localStorage (persistence)
4. **Automatic Backups** → Created every 30 seconds (debounced)
5. **API Calls** → Google Gemini / Social Media APIs
6. **Response** → Store Update → UI Update

## Data Backup System

- **Export**: Users can download JSON backup files with all data
- **Import**: Users can upload backup files to restore data
- **Automatic Backups**: Last 5 backups stored in localStorage
- **Protection**: Prevents data loss when browser cache is cleared

## Security Considerations

- API keys stored client-side (consider server-side for production)
- CORS protection on API routes
- Input validation and sanitization
- Service worker disabled in development

## Performance Optimizations

- Image optimization on upload
- Lazy loading for components
- Code splitting via Next.js
- PWA caching strategies
