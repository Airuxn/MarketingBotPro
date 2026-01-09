# Deployment naar Vercel - Stap voor Stap

## Stap 1: Ga naar de juiste directory

```bash
cd "MarketingBotPro"
```

Of als je vanuit je home directory werkt:
```bash
cd MarketingBotPro
```

## Stap 2: Git initialiseren (als nog niet gedaan)

```bash
git init
git add .
git commit -m "Vercel-ready version - all TypeScript errors fixed"
```

## Stap 3: Maak een GitHub repository

1. Ga naar https://github.com/new
2. Maak een nieuwe repository aan (bijv. `marketing-bot-vercel` of `marketing-bot-pro`)
3. **NIET** initialiseren met README, .gitignore of license (we hebben al code)

## Stap 4: Push naar GitHub

```bash
git remote add origin https://github.com/Airuxn/[JOUW_REPO_NAAM].git
git branch -M main
git push -u origin main
```

## Stap 5: Deploy op Vercel

1. Ga naar https://vercel.com
2. Klik op **"Import Project"**
3. Kies **"Import Git Repository"**
4. Selecteer je GitHub repository
5. Configureer:
   - **Framework Preset**: Next.js (wordt automatisch gedetecteerd)
   - **Root Directory**: `marketing-bot-vercel-ready` (als je de hele repo gebruikt, anders leeg laten)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
6. Klik op **"Deploy"**

## Stap 6: Environment Variables toevoegen

Na de eerste deployment:

1. Ga naar je project in Vercel
2. Klik op **Settings** → **Environment Variables**
3. Voeg toe:
   - `FACEBOOK_CLIENT_ID` = je Facebook App ID
   - `FACEBOOK_CLIENT_SECRET` = je Facebook App Secret
   - `NEXT_PUBLIC_APP_URL` = `https://[jouw-project].vercel.app` (vervang met je echte Vercel URL)
   - `NEXT_PUBLIC_OAUTH_REDIRECT_URI` = `https://[jouw-project].vercel.app/api/oauth/facebook/callback`
   - `GEMINI_API_KEY` (optioneel, voor AI features)

4. Klik op **"Redeploy"** om de nieuwe environment variables te activeren

## Stap 7: Facebook App OAuth URIs updaten

1. Ga naar https://developers.facebook.com/apps/
2. Selecteer je app
3. Ga naar **Facebook Login** → **Settings**
4. Voeg toe aan **Valid OAuth Redirect URIs**:
   - `https://[jouw-project].vercel.app/api/oauth/facebook/callback`

## Klaar! 🎉

Je app draait nu op Vercel! 🚀
