# Vercel Environment Variables - COMPLETE STAP-VOOR-STAP GUIDE

## 📍 Waar te vinden:
**Vercel Dashboard** → **Je Project** → **Settings** → **Environment Variables**

---

## ✅ VERPLICHTE VARIABLES (MOETEN ALLEMAAL TOEGEVOEGD WORDEN):

### 1. `NEXT_PUBLIC_APP_URL`
- **Name:** `NEXT_PUBLIC_APP_URL`
- **Value:** `https://marketing-bot-pro.vercel.app`
- **Environment:** ✅ **Production** (en optioneel Preview, Development)
- **Waarom:** Dit is je Vercel app URL. De app gebruikt dit om te weten waar hij draait.

### 2. `NEXT_PUBLIC_OAUTH_REDIRECT_URI`
- **Name:** `NEXT_PUBLIC_OAUTH_REDIRECT_URI`
- **Value:** `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback`
- **Environment:** ✅ **Production** (en optioneel Preview, Development)
- **Waarom:** Dit is de callback URL die naar Facebook wordt gestuurd. MOET exact overeenkomen met wat in Facebook App Settings staat.

### 3. `FACEBOOK_CLIENT_ID`
- **Name:** `FACEBOOK_CLIENT_ID`
- **Value:** `[JE FACEBOOK APP ID]` (bijv. `1234567890123456`)
- **Environment:** ✅ **Production** (en optioneel Preview, Development)
- **Waar te vinden:** 
  1. Ga naar: https://developers.facebook.com/apps/
  2. Selecteer je app
  3. Ga naar: **Settings** → **Basic**
  4. Kopieer **App ID**

### 4. `FACEBOOK_CLIENT_SECRET`
- **Name:** `FACEBOOK_CLIENT_SECRET`
- **Value:** `[JE FACEBOOK APP SECRET]` (lange string)
- **Environment:** ✅ **Production** (en optioneel Preview, Development)
- **Waar te vinden:**
  1. Ga naar: https://developers.facebook.com/apps/
  2. Selecteer je app
  3. Ga naar: **Settings** → **Basic**
  4. Klik op **"Show"** naast App Secret
  5. Kopieer **App Secret**

### 5. `FACEBOOK_REDIRECT_URI` ⚠️ BELANGRIJK!
- **Name:** `FACEBOOK_REDIRECT_URI`
- **Value:** `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback`
- **Environment:** ✅ **Production** (en optioneel Preview, Development)
- **Waarom:** Facebook gebruikt deze variable voor OAuth. MOET exact overeenkomen met Facebook App Settings.

---

## 🔧 OPTIONELE VARIABLES (alleen toevoegen als je ze nodig hebt):

### 5. `FACEBOOK_LOGIN_CONFIG_ID` (Optioneel - alleen als je Business Login gebruikt)
- **Name:** `FACEBOOK_LOGIN_CONFIG_ID`
- **Value:** `[JE FACEBOOK LOGIN CONFIG ID]`
- **Environment:** ✅ **Production** (en optioneel Preview, Development)
- **Waar te vinden:**
  1. Ga naar: https://developers.facebook.com/apps/
  2. Selecteer je app
  3. Ga naar: **Facebook Login** → **Settings**
  4. Zoek naar **Login Config ID**

### 6. `TWITTER_CLIENT_ID` (Optioneel - voor Twitter/X OAuth)
- **Name:** `TWITTER_CLIENT_ID`
- **Value:** `[JE TWITTER CLIENT ID]`
- **Environment:** ✅ **Production** (en optioneel Preview, Development)
- **Waar te vinden:** Twitter Developer Portal → Je App → Keys and Tokens

### 7. `TWITTER_CLIENT_SECRET` (Optioneel - voor Twitter/X OAuth)
- **Name:** `TWITTER_CLIENT_SECRET`
- **Value:** `[JE TWITTER CLIENT SECRET]`
- **Environment:** ✅ **Production** (en optioneel Preview, Development)
- **Waar te vinden:** Twitter Developer Portal → Je App → Keys and Tokens

### 8. `LINKEDIN_CLIENT_ID` (Optioneel - voor LinkedIn OAuth)
- **Name:** `LINKEDIN_CLIENT_ID`
- **Value:** `[JE LINKEDIN CLIENT ID]`
- **Environment:** ✅ **Production** (en optioneel Preview, Development)
- **Waar te vinden:** LinkedIn Developer Portal → Je App → Auth tab

### 9. `LINKEDIN_CLIENT_SECRET` (Optioneel - voor LinkedIn OAuth)
- **Name:** `LINKEDIN_CLIENT_SECRET`
- **Value:** `[JE LINKEDIN CLIENT SECRET]`
- **Environment:** ✅ **Production** (en optioneel Preview, Development)
- **Waar te vinden:** LinkedIn Developer Portal → Je App → Auth tab

### 10. `GEMINI_API_KEY` (Optioneel - voor AI features)
- **Name:** `GEMINI_API_KEY`
- **Value:** `[JE GOOGLE GEMINI API KEY]`
- **Environment:** ✅ **Production** (en optioneel Preview, Development)
- **Waar te vinden:** https://aistudio.google.com/app/apikey
- **Opmerking:** Gebruikers kunnen dit ook zelf invoeren in de app UI, dus dit is optioneel

---

## 📋 STAP-VOOR-STAP INSTRUCTIES:

### Stap 1: Ga naar Environment Variables
1. Ga naar: https://vercel.com/dashboard
2. Selecteer je project: **marketing-bot-pro**
3. Klik op **Settings** (bovenaan)
4. Klik op **Environment Variables** (in het linker menu)

### Stap 2: Verwijder oude variables (als ze bestaan)
1. Zoek naar `NEXT_PUBLIC_APP_URL` - als deze `[your-project]` bevat → **VERWIJDER**
2. Zoek naar `NEXT_PUBLIC_OAUTH_REDIRECT_URI` - als deze `[your-project]` bevat → **VERWIJDER**

### Stap 3: Voeg VERPLICHTE variables toe

Voor ELKE variable:
1. Klik op **"Add New"** knop
2. Vul in:
   - **Key:** (bijv. `NEXT_PUBLIC_APP_URL`)
   - **Value:** (bijv. `https://marketing-bot-pro.vercel.app`)
   - **Environment:** Vink aan: ✅ **Production** (en optioneel Preview, Development)
3. Klik **"Save"**

**Voeg deze 4 VERPLICHTE variables toe:**
1. ✅ `NEXT_PUBLIC_APP_URL` = `https://marketing-bot-pro.vercel.app`
2. ✅ `NEXT_PUBLIC_OAUTH_REDIRECT_URI` = `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback`
3. ✅ `FACEBOOK_CLIENT_ID` = `[JE FACEBOOK APP ID]`
4. ✅ `FACEBOOK_CLIENT_SECRET` = `[JE FACEBOOK APP SECRET]`

### Stap 4: Voeg OPTIONELE variables toe (als je ze nodig hebt)
Voeg alleen toe wat je gebruikt:
- `FACEBOOK_LOGIN_CONFIG_ID` (als je Business Login gebruikt)
- `TWITTER_CLIENT_ID` + `TWITTER_CLIENT_SECRET` (als je Twitter/X wilt gebruiken)
- `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET` (als je LinkedIn wilt gebruiken)
- `GEMINI_API_KEY` (als je AI features wilt gebruiken)

### Stap 5: Force Redeploy (ZONDER CACHE)
1. Ga naar **Deployments** tab
2. Klik op de **3 dots** (⋮) van de laatste deployment
3. Klik **"Redeploy"**
4. **BELANGRIJK:** Zorg dat **"Use existing Build Cache"** NIET is aangevinkt
5. Klik **"Redeploy"**
6. Wacht tot deployment klaar is (groen vinkje)

---

## ✅ CHECKLIST:

Na het toevoegen, check of alles correct is:

- [ ] `NEXT_PUBLIC_APP_URL` = `https://marketing-bot-pro.vercel.app` (geen `[your-project]`)
- [ ] `NEXT_PUBLIC_OAUTH_REDIRECT_URI` = `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback` (geen `[your-project]`)
- [ ] `FACEBOOK_CLIENT_ID` is ingesteld (met je echte App ID)
- [ ] `FACEBOOK_CLIENT_SECRET` is ingesteld (met je echte App Secret)
- [ ] Alle variables zijn ingesteld voor **Production** environment
- [ ] Je hebt een **Redeploy** gedaan (zonder cache)

---

## 🧪 TEST:

Na het toevoegen en redeploy:

1. Ga naar: `https://marketing-bot-pro.vercel.app/api/debug-oauth`
2. Check de JSON output:
   - `redirectUri` moet zijn: `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback`
   - `baseUrl` moet zijn: `https://marketing-bot-pro.vercel.app`
   - **NIET** `[your-project]` of `localhost`

3. Test Facebook OAuth:
   - Ga naar: `https://marketing-bot-pro.vercel.app/settings`
   - Klik "Connect with Facebook"
   - Je zou nu naar je Vercel app moeten worden geredirect (niet localhost)

---

## ⚠️ BELANGRIJK:

1. **Gebruik HTTPS** - altijd `https://` niet `http://`
2. **Geen trailing slash** - eindig niet met `/`
3. **Exacte match** - `NEXT_PUBLIC_OAUTH_REDIRECT_URI` moet EXACT overeenkomen met Facebook App Settings
4. **Verwijder oude URLs** - zorg dat er geen `[your-project]` meer in staat
5. **Redeploy na wijzigingen** - altijd een redeploy doen na het toevoegen/wijzigen van variables

---

## 📱 FACEBOOK APP SETTINGS (ook updaten!):

Na het toevoegen van de environment variables, update ook Facebook:

1. Ga naar: https://developers.facebook.com/apps/
2. Selecteer je app
3. Ga naar **Settings** → **Basic**:
   - **App Domains:** `marketing-bot-pro.vercel.app` (zonder `https://`)
   - **Site URL:** `https://marketing-bot-pro.vercel.app` (met `https://`)
   - **VERWIJDER** `[your-project]` als die er nog staat

4. Ga naar **Facebook Login** → **Settings**:
   - **Client OAuth Login:** ✅ **Enabled**
   - **Web OAuth Login:** ✅ **Enabled**
   - **Valid OAuth Redirect URIs:**
     - **VERWIJDER ALLES** (alle oude URLs)
     - **VOEG TOE:** `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback`
     - **NIET** `[your-project]` of `localhost`

5. Klik **"Save changes"**
6. Wacht 5-10 minuten (Facebook cache't settings)

---

## 🆘 TROUBLESHOOTING:

**Als je nog steeds naar localhost of oude URL wordt geredirect:**

1. ✅ Check of alle environment variables correct zijn ingesteld
2. ✅ Check of je een redeploy hebt gedaan (zonder cache)
3. ✅ Check of Facebook App Settings de juiste redirect URI heeft
4. ✅ Test in een incognito venster (om browser cache te vermijden)
5. ✅ Wacht 5-10 minuten (Facebook en Vercel kunnen cachen)
6. ✅ Check Vercel logs: Deployments → laatste deployment → Functions → `/api/oauth/facebook` → Logs
