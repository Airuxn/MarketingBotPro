# Setup Instructions

## Quick Start

1. **Install Node.js** (if not already installed)
   - Visit [nodejs.org](https://nodejs.org/) and install Node.js 18 or higher

2. **Install Dependencies**
   ```bash
   cd marketing-bot
   npm install
   ```

3. **Get Google Gemini API Key**
   - Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the key (starts with `AIza`)

4. **Install Google Gemini Package**
   ```bash
   npm install @google/generative-ai
   ```

5. **Run the App**
   ```bash
   npm run dev
   ```

6. **Open in Browser**
   - Go to [http://localhost:3000](http://localhost:3000)
   - Click on Settings
   - **1. Add API Key** - Add your Google Gemini API key (required for AI features)
   - **2. Business Info** - Fill in your business name, type, and target audience
   - **3. Connect Socials** - Connect social media accounts (optional, but recommended for learning)

## PWA Icons

To complete the PWA setup, you'll need to add icon files:

1. Create `public/icon-192.png` (192x192 pixels)
2. Create `public/icon-512.png` (512x512 pixels)
3. Create `public/favicon.ico` (standard favicon)

You can use any image editor or online tools to create these icons. The app will work without them, but they're needed for the full PWA experience.

## Production Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy!

### Deploy to Other Platforms

```bash
npm run build
npm start
```

The built files will be in the `.next` directory.

## Features Overview

- ✅ AI Content Generation (requires Google Gemini API key)
- ✅ Social Media Scheduling
- ✅ Email Campaign Management
- ✅ Lead Tracking
- ✅ Analytics Dashboard
- ✅ PWA Support (installable on any device)
- ✅ Offline Support
- ✅ Mobile-First Design

## Troubleshooting

**Google Gemini API Errors:**
- Make sure your API key is correct
- Check you have credits in your Google AI Studio account
- Verify the key starts with `AIza`
- Make sure you've installed the package: `npm install @google/generative-ai`

**Build Errors:**
- Make sure all dependencies are installed: `npm install`
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

**PWA Not Installing:**
- Make sure you're using HTTPS (or localhost)
- Check that `manifest.json` and `sw.js` are accessible
- Add the icon files mentioned above

## Next Steps

1. Customize the branding (colors, logo)
2. Add real social media API integrations
3. Integrate email sending service (Resend, SendGrid)
4. Add more analytics features
5. Customize AI prompts for your industry
