# Project Structure Explained

## Where is the App?

**The entire app is the `marketing-bot` folder** (the root folder).

The `app` folder is just **one part** of the Next.js project - it contains your pages and API routes.

## Project Structure

```
marketing-bot/                    ← THIS IS YOUR APP ROOT
│                                 ← Run "npm run dev" HERE
├── app/                          ← Next.js pages & API routes (organized)
│   ├── (frontend)/              ← Frontend pages (user interface)
│   │   ├── page.tsx             ← Home page (/)
│   │   ├── analytics/           ← Analytics page (/analytics)
│   │   ├── content/             ← Content page (/content)
│   │   ├── email/               ← Email page (/email)
│   │   ├── leads/               ← Leads page (/leads)
│   │   ├── schedule/            ← Schedule page (/schedule)
│   │   └── settings/            ← Settings page (/settings)
│   │
│   ├── (backend)/               ← Backend API routes (server code)
│   │   └── api/                 ← API endpoints
│   │       ├── oauth/           ← OAuth handlers
│   │       ├── analyze-content/ ← Content analysis
│   │       └── extract-images/   ← Image extraction
│   │
│   ├── layout.tsx               ← Root layout (wraps all pages)
│   └── globals.css              ← Global styles
│
├── components/                    ← Reusable React components
├── lib/                          ← Core utilities & business logic
├── public/                       ← Static files (images, icons, etc.)
├── docs/                         ← Documentation
│
├── package.json                  ← Dependencies & scripts
├── next.config.js                ← Next.js configuration
├── tailwind.config.ts            ← Tailwind CSS config
└── tsconfig.json                 ← TypeScript config
```

## Where to Run Commands

**Always run commands from the `marketing-bot` folder (root):**

```bash
cd "MarketingBotPro"
npm run dev      # Start development server
npm run build    # Build for production
npm install      # Install dependencies
```

## What Each Folder Does

### `app/` - Next.js App Router
- Contains all your pages and API routes
- Organized into `(frontend)` and `(backend)` for clarity
- **This is NOT the entire app** - just the routing layer

### `components/` - React Components
- Reusable UI components (Navigation, Forms, etc.)
- Used by pages in `app/(frontend)/`

### `lib/` - Core Logic
- Business logic (AI, store, content learning, etc.)
- Utilities and helpers
- Used by both frontend and backend

### `public/` - Static Assets
- Images, icons, manifest files
- Served directly by Next.js

### Root Files
- `package.json` - Project dependencies and scripts
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Styling configuration
- `.env.local` - Environment variables (secrets)

## Quick Start

```bash
# 1. Navigate to the app root
cd "MarketingBotPro"

# 2. Install dependencies (if needed)
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# http://localhost:3000
```

## Summary

- **App Root**: `marketing-bot/` folder
- **Run Commands**: From `marketing-bot/` folder
- **Pages**: In `app/(frontend)/`
- **API Routes**: In `app/(backend)/api/`
- **Components**: In `components/`
- **Business Logic**: In `lib/`

The `app` folder is just for Next.js routing - the entire project is the `marketing-bot` folder!
