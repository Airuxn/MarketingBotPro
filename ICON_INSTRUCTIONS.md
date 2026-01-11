# App Icon Instructions

## Quick Guide: Creating App Icons

Je hebt 3 icon files nodig voor je MarketingBot Pro app:

### Required Icon Files:
1. **favicon.ico** - 32x32 pixels (browser tab icon)
2. **icon-192.png** - 192x192 pixels (PWA icon)
3. **icon-512.png** - 512x512 pixels (PWA icon, high-res)

## Option 1: Using Online Tools (Easiest)

### Step 1: Create Base Icon
Ik heb een SVG icon gemaakt: `public/icon.svg`

### Step 2: Convert to PNG/ICO
1. Ga naar één van deze online tools:
   - **Favicon Generator**: https://realfavicongenerator.net/
   - **App Icon Generator**: https://www.favicon-generator.org/
   - **ICO Convert**: https://icoconvert.com/

2. Upload het `icon.svg` bestand (of maak je eigen icon)

3. Download de gegenereerde iconen:
   - favicon.ico (32x32)
   - icon-192.png (192x192)
   - icon-512.png (512x512)

4. Plaats ze in de `public/` folder

### Step 3: Update manifest.json
De manifest.json is al geconfigureerd met de juiste icon referenties.

## Option 2: Create Custom Icon

### Design Ideas:
- **Theme**: AI Marketing Bot
- **Colors**: Indigo/Purple gradient (#6366f1 to #8b5cf6) - matches your app theme
- **Elements**: Megaphone (marketing), Sparkles (AI), Sound waves (social media)

### Tools:
- **Figma** (free, online): https://www.figma.com/
- **Canva** (free, online): https://www.canva.com/
- **GIMP** (free, desktop): https://www.gimp.org/
- **Adobe Illustrator** (paid)

### Size Requirements:
- Start with **1024x1024 pixels** (high resolution)
- Export at these sizes:
  - 512x512 (for icon-512.png)
  - 192x192 (for icon-192.png)
  - 32x32 (for favicon.ico)

## Option 3: Use AI Image Generator

Als je een AI image generator wilt gebruiken:

1. **Prompt suggestions**:
   - "Modern app icon for AI marketing automation tool, gradient background indigo to purple, minimalist megaphone design, professional, clean, 1024x1024"
   - "App icon marketing bot, purple gradient, megaphone with sparkles, modern flat design, transparent background"

2. **Tools**:
   - **DALL-E**: https://openai.com/dall-e-2
   - **Midjourney**: https://www.midjourney.com/
   - **Stable Diffusion**: https://stablediffusionweb.com/
   - **Canva AI**: https://www.canva.com/ (has AI image generator)

3. Export and resize to required sizes

## Quick Setup (Using the SVG)

1. Open `public/icon.svg` in je browser
2. Screenshot of export naar PNG (1024x1024)
3. Gebruik een online tool om te converteren naar:
   - favicon.ico (32x32)
   - icon-192.png (192x192)
   - icon-512.png (512x512)
4. Plaats bestanden in `public/` folder

## After Adding Icons

De manifest.json zal automatisch de iconen gebruiken zodra ze in de `public/` folder staan.

Test lokaal:
```bash
npm run dev
```

Open http://localhost:3000 en check:
- Browser tab icon (favicon.ico)
- Install prompt icon (PWA)
- Mobile home screen icon
