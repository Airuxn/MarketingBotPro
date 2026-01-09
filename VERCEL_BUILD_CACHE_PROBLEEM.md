# Vercel Build Cache Probleem - Oplossing

## Het Probleem

De code gebruikt nog steeds de oude URL (`[your-project]`) ook al:
- ✅ De nieuwe code is gepusht naar GitHub
- ✅ Je hebt alles opnieuw gedaan in Vercel
- ✅ De request URL is correct (`marketing-bot-pro.vercel.app`)

**Waarom?** Vercel gebruikt nog een oude build cache.

## Oplossing: Complete Reset

### Stap 1: Verwijder Build Cache in Vercel

1. Ga naar: https://vercel.com/dashboard
2. Selecteer je project: **marketing-bot-pro**
3. Ga naar: **Settings** → **General**
4. Scroll naar beneden naar **"Build & Development Settings"**
5. Klik op **"Clear Build Cache"** (als deze optie bestaat)
6. OF: Ga naar **Deployments** → Klik op **3 dots** → **"Redeploy"** → **Zet "Use existing Build Cache" UIT**

### Stap 2: Force Nieuwe Build

1. Maak een kleine wijziging in de code (bijv. een comment toevoegen)
2. Push naar GitHub
3. Dit forceert Vercel om een nieuwe build te maken

### Stap 3: Check Deployment

1. Ga naar: **Deployments** tab
2. Check de laatste deployment:
   - **Commit:** Moet `a386bbe` of nieuwer zijn (commit "ULTIMATE FIX")
   - **Status:** Moet "Ready" zijn
   - **Build Logs:** Check of er geen cache warnings zijn

### Stap 4: Check Logs

Na de nieuwe deployment, check de logs:

1. Ga naar: Deployments → laatste deployment → Functions → `/api/oauth/facebook` → Logs
2. Zoek naar: `[getOAuthUrls] ========== START ==========`

**Als je deze log ziet:**
- ✅ De nieuwe code IS actief
- De log moet zeggen: `baseUrl (from request): https://marketing-bot-pro.vercel.app`

**Als je deze log NIET ziet:**
- ❌ Vercel gebruikt nog de oude build
- Probeer Stap 5

### Stap 5: Nuclear Option - Herimport Project

Als niets werkt:

1. Ga naar: Vercel Dashboard → Je project → Settings → General
2. Scroll naar beneden naar **"Danger Zone"**
3. Klik op **"Delete Project"** (of maak een nieuw project)
4. Import opnieuw vanuit GitHub
5. Voeg alle environment variables opnieuw toe
6. Deploy

**LET OP:** Dit verwijdert alle deployments en logs. Gebruik dit alleen als laatste redmiddel.

## Alternatieve Oplossing: Check Of Er Een Andere Deployment Actief Is

1. Ga naar: **Deployments** tab
2. Check of er meerdere deployments zijn
3. Check welke deployment **"Production"** is (groene badge)
4. Als een oude deployment Production is:
   - Klik op de nieuwe deployment → **"Promote to Production"**

## Waarom Dit Gebeurt

Next.js cached builds agressief. Als de eerste build met oude environment variables is gedaan, kan Vercel die cached build blijven gebruiken, zelfs na:
- Environment variables updaten
- Code pushen
- Redeploy (met cache aan)

**De oplossing:** Force een nieuwe build zonder cache.

## Snelle Test

Na een redeploy zonder cache:

1. Ga naar: `https://marketing-bot-pro.vercel.app/api/test-facebook-redirect`
2. Check `redirectUri` - moet `marketing-bot-pro.vercel.app` zijn
3. Check Vercel logs - moet `[getOAuthUrls] ========== START ==========` tonen

Als beide correct zijn, werkt het!
