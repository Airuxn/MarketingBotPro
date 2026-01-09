# Hoe Environment Variables Instellen in Vercel - STAP-VOOR-STAP

## 📍 Stap 1: Ga naar Environment Variables

1. Ga naar: **https://vercel.com/dashboard**
2. Klik op je project: **marketing-bot-pro** (of de naam van je project)
3. Klik bovenaan op **"Settings"** tab
4. Klik in het linker menu op **"Environment Variables"**

---

## 📝 Stap 2: Verwijder Oude Variables (als ze bestaan)

1. Scroll door de lijst van environment variables
2. Als je ziet:
   - `NEXT_PUBLIC_APP_URL` met waarde `https://[your-project].vercel.app` → Klik op de **3 dots (⋮)** → **"Delete"**
   - `NEXT_PUBLIC_OAUTH_REDIRECT_URI` met waarde met `[your-project]` → Klik op de **3 dots (⋮)** → **"Delete"**

---

## ➕ Stap 3: Voeg Nieuwe Variables Toe

Voor ELKE variable doe je dit:

### Variable 1: `NEXT_PUBLIC_APP_URL`

1. Klik op de knop **"Add New"** (rechtsboven)
2. Vul in:
   - **Key:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://marketing-bot-pro.vercel.app`
   - **Environment:** Vink aan: ✅ **Production** (en optioneel ✅ Preview, ✅ Development)
3. Klik **"Save"**

### Variable 2: `NEXT_PUBLIC_OAUTH_REDIRECT_URI`

1. Klik op **"Add New"**
2. Vul in:
   - **Key:** `NEXT_PUBLIC_OAUTH_REDIRECT_URI`
   - **Value:** `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback`
   - **Environment:** Vink aan: ✅ **Production** (en optioneel ✅ Preview, ✅ Development)
3. Klik **"Save"**

### Variable 3: `FACEBOOK_CLIENT_ID`

1. Klik op **"Add New"**
2. Vul in:
   - **Key:** `FACEBOOK_CLIENT_ID`
   - **Value:** `[JE FACEBOOK APP ID]` (bijv. `1234567890123456`)
   - **Environment:** Vink aan: ✅ **Production** (en optioneel ✅ Preview, ✅ Development)
3. Klik **"Save"**

**Waar te vinden:**
- Ga naar: https://developers.facebook.com/apps/
- Selecteer je app
- Ga naar: **Settings** → **Basic**
- Kopieer **App ID**

### Variable 4: `FACEBOOK_CLIENT_SECRET`

1. Klik op **"Add New"**
2. Vul in:
   - **Key:** `FACEBOOK_CLIENT_SECRET`
   - **Value:** `[JE FACEBOOK APP SECRET]` (lange string)
   - **Environment:** Vink aan: ✅ **Production** (en optioneel ✅ Preview, ✅ Development)
3. Klik **"Save"**

**Waar te vinden:**
- Ga naar: https://developers.facebook.com/apps/
- Selecteer je app
- Ga naar: **Settings** → **Basic**
- Klik op **"Show"** naast App Secret
- Kopieer **App Secret**

### Variable 5: `FACEBOOK_LOGIN_CONFIG_ID`

1. Klik op **"Add New"**
2. Vul in:
   - **Key:** `FACEBOOK_LOGIN_CONFIG_ID`
   - **Value:** `2310982732753378`
   - **Environment:** Vink aan: ✅ **Production** (en optioneel ✅ Preview, ✅ Development)
3. Klik **"Save"**

### Variable 6: `FACEBOOK_REDIRECT_URI` (BELANGRIJK!)

1. Klik op **"Add New"**
2. Vul in:
   - **Key:** `FACEBOOK_REDIRECT_URI`
   - **Value:** `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback`
   - **Environment:** Vink aan: ✅ **Production** (en optioneel ✅ Preview, ✅ Development)
3. Klik **"Save"**

**WAAROM:** Facebook gebruikt deze variable voor OAuth redirect. Deze MOET exact overeenkomen met wat in Facebook App Settings staat.

---

## ✅ Stap 4: Check of Alles Correct is

Na het toevoegen, check of je deze variables hebt:

- [ ] `NEXT_PUBLIC_APP_URL` = `https://marketing-bot-pro.vercel.app`
- [ ] `NEXT_PUBLIC_OAUTH_REDIRECT_URI` = `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback`
- [ ] `FACEBOOK_CLIENT_ID` = [je App ID]
- [ ] `FACEBOOK_CLIENT_SECRET` = [je App Secret]
- [ ] `FACEBOOK_LOGIN_CONFIG_ID` = `2310982732753378`

---

## 🔄 Stap 5: Force Redeploy (ZONDER CACHE)

**BELANGRIJK:** Na het toevoegen van variables MOET je een redeploy doen!

1. Klik bovenaan op **"Deployments"** tab
2. Klik op de **3 dots (⋮)** van de laatste deployment
3. Klik **"Redeploy"**
4. **BELANGRIJK:** Zorg dat **"Use existing Build Cache"** NIET is aangevinkt
5. Klik **"Redeploy"**
6. Wacht tot deployment klaar is (groen vinkje ✅)

---

## 🧪 Stap 6: Test

Na de redeploy:

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

## 📸 Screenshot Locaties:

**Environment Variables:**
- Vercel Dashboard → Je Project → Settings → Environment Variables

**Add New Button:**
- Rechtsboven in de Environment Variables pagina

**Environment Checkboxes:**
- Onder het "Value" veld
- Vink aan: Production (verplicht), Preview (optioneel), Development (optioneel)

**Redeploy:**
- Deployments tab → 3 dots (⋮) → Redeploy

---

## ⚠️ BELANGRIJK:

1. **Gebruik HTTPS** - altijd `https://` niet `http://`
2. **Geen trailing slash** - eindig niet met `/`
3. **Exacte waarden** - kopieer en plak exact, geen extra spaties
4. **Production environment** - altijd Production aanvinken
5. **Redeploy na wijzigingen** - altijd een redeploy doen na het toevoegen/wijzigen

---

## 🆘 Als het niet werkt:

1. ✅ Check of alle variables correct zijn toegevoegd
2. ✅ Check of je een redeploy hebt gedaan (zonder cache)
3. ✅ Check of alle variables op **Production** staan
4. ✅ Check Vercel logs: Deployments → laatste deployment → Functions → `/api/oauth/facebook` → Logs
5. ✅ Wacht 2-3 minuten (Vercel kan cachen)
