# Project Structure

This document outlines the professional structure of MarketingBot Pro.

## Directory Organization

```
marketing-bot/
├── .editorconfig          # Editor configuration
├── .eslintrc.json         # ESLint configuration
├── .gitignore             # Git ignore rules
├── .npmrc                 # npm configuration
├── .nvmrc                 # Node.js version
├── .prettierrc            # Prettier configuration
├── CONTRIBUTING.md        # Contribution guidelines
├── LICENSE                # MIT License
├── next.config.js         # Next.js configuration
├── package.json           # Dependencies and scripts
├── postcss.config.js      # PostCSS configuration
├── README.md              # Main documentation
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
│
├── app/                   # Next.js App Router
│   ├── (frontend)/      # Frontend pages (user interface)
│   │   ├── page.tsx     # Home/Dashboard page
│   │   ├── analytics/   # Analytics dashboard
│   │   ├── content/     # AI content generator
│   │   ├── email/       # Email campaigns
│   │   ├── leads/       # Lead management
│   │   ├── schedule/    # Post scheduling
│   │   └── settings/    # Settings page
│   ├── (backend)/       # Backend API routes (server code)
│   │   └── api/         # API endpoints
│   │       ├── oauth/   # OAuth handlers
│   │       ├── analyze-content/  # Content analysis
│   │       └── extract-images/    # Image extraction
│   ├── globals.css      # Global styles
│   └── layout.tsx       # Root layout
│
├── components/            # React components
│   ├── AdPlatformConnector.tsx
│   ├── BrandImageLibrary.tsx
│   ├── CreateAdDialog.tsx
│   ├── EngagementTracker.tsx
│   ├── LanguageSelector.tsx
│   ├── MediaUpload.tsx
│   ├── Navigation.tsx
│   ├── NoSSR.tsx
│   ├── ReferenceLinks.tsx
│   └── SocialAccountConnector.tsx
│
├── docs/                  # Documentation
│   ├── AD_INTEGRATION.md
│   ├── ARCHITECTURE.md
│   ├── BRAND_IMAGES.md
│   ├── MEDIA_FEATURES.md
│   ├── QUICKSTART.md
│   ├── README.md
│   ├── SETUP.md
│   └── UPGRADE_NODE.md
│
├── lib/                   # Core utilities
│   ├── ad-platforms.ts
│   ├── ai.ts
│   ├── auto-scanner.ts
│   ├── backup.ts
│   ├── content-analyzer.ts
│   ├── content-learner.ts
│   ├── content-performance-analyzer.ts
│   ├── facebook-ads.ts
│   ├── google-ads.ts
│   ├── hydration-provider.tsx
│   ├── i18n.ts
│   ├── image-editor.ts
│   ├── image-extractor.ts
│   ├── image-optimizer.ts
│   ├── instagram-ads.ts
│   ├── language-context.tsx
│   ├── linkedin-ads.ts
│   ├── platform-specs.ts
│   ├── post-publisher.ts
│   ├── store.ts
│   └── twitter-ads.ts
│
└── public/                # Static assets
    ├── manifest.json
    └── sw.js
```

## File Naming Conventions

- **Components**: PascalCase (e.g., `Navigation.tsx`)
- **Utilities**: kebab-case (e.g., `content-analyzer.ts`)
- **Pages**: lowercase (e.g., `page.tsx`)
- **Config files**: dot-prefixed (e.g., `.gitignore`)

## Code Organization Principles

1. **Separation of Concerns**: Business logic in `lib/`, UI in `components/`
2. **Feature-based**: Pages organized by feature in `app/`
3. **Reusability**: Shared components in `components/`
4. **Documentation**: All docs in `docs/` directory
5. **Configuration**: All config files at root level

