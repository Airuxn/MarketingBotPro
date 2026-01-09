# Facebook OAuth Troubleshooting - Stap voor Stap

## Het Probleem

Je krijgt deze foutmelding:
```
URL geblokkeerd
Deze doorverwijzing is mislukt, omdat de URI van de omleiding niet aan de whitelist in de Client OAuth-instellingen van de app is toegevoegd.
```

## Stap 1: Check Wat De Code Naar Facebook Stuurt

1. Ga naar: `https://marketing-bot-pro.vercel.app/api/test-facebook-redirect`
2. Kijk naar `redirectUri` in de JSON
3. **Dit is de EXACTE URL die naar Facebook wordt gestuurd**

**Voorbeeld output:**
```json
{
  "redirectUri": "https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback"
}
```

**Als dit nog steeds `[your-project]` is:**
- ❌ De nieuwe code is nog niet actief
- Je moet een redeploy doen (zie Stap 2)

**Als dit `marketing-bot-pro.vercel.app` is:**
- ✅ De code is correct
- Ga naar Stap 3

---

## Stap 2: Force Redeploy (Als Code Nog Niet Actief Is)

1. Ga naar: https://vercel.com/dashboard
2. Selecteer je project: **marketing-bot-pro**
3. Ga naar: **Deployments** tab
4. Klik op de **3 dots (⋮)** van de laatste deployment
5. Klik **"Redeploy"**
6. **BELANGRIJK:** Zorg dat **"Use existing Build Cache"** NIET is aangevinkt
7. Klik **"Redeploy"**
8. Wacht 2-3 minuten tot deployment klaar is

**Test opnieuw:**
- Ga naar: `https://marketing-bot-pro.vercel.app/api/test-facebook-redirect`
- Check of `redirectUri` nu `marketing-bot-pro.vercel.app` is

---

## Stap 3: Check Facebook App Settings

### 3.1 Ga Naar Facebook App Settings

1. Ga naar: https://developers.facebook.com/apps/
2. Selecteer je app
3. Klik op **"Facebook Login"** in het linker menu
4. Klik op **"Settings"**

### 3.2 Check Client OAuth Login

- **Client OAuth Login:** Moet **Enabled** zijn ✅
- Als het **Disabled** is → Klik op **"Enable"** → Klik **"Save Changes"**

### 3.3 Check Web OAuth Login

- **Web OAuth Login:** Moet **Enabled** zijn ✅
- Als het **Disabled** is → Klik op **"Enable"** → Klik **"Save Changes"**

### 3.4 Check Valid OAuth Redirect URIs

**BELANGRIJK:** Dit is het belangrijkste!

1. Scroll naar **"Valid OAuth Redirect URIs"**
2. **VERWIJDER ALLES** wat er staat (alle oude URLs)
3. **VOEG ALLEEN TOE:** De EXACTE URL uit Stap 1
   - Bijvoorbeeld: `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback`
4. **EXACT betekent:**
   - ✅ Moet beginnen met `https://` (niet `http://`)
   - ✅ Moet eindigen met `/api/oauth/facebook/callback` (geen trailing slash)
   - ✅ Moet EXACT overeenkomen met wat in `/api/test-facebook-redirect` staat
5. Klik **"Save Changes"**

**Checklist:**
- [ ] Alle oude URLs zijn verwijderd
- [ ] Alleen de nieuwe URL staat er
- [ ] De URL is EXACT hetzelfde als in `/api/test-facebook-redirect`
- [ ] Geen trailing slash aan het einde
- [ ] Begint met `https://` (niet `http://`)

### 3.5 Check App Domains

1. Ga naar: **Settings** → **Basic**
2. Scroll naar **"App Domains"**
3. **VERWIJDER** `[your-project].vercel.app` als die er staat
4. **VOEG TOE:** `marketing-bot-pro.vercel.app` (zonder `https://`)
5. Scroll naar **"Site URL"**
6. **ZET OP:** `https://marketing-bot-pro.vercel.app` (met `https://`)
7. Klik **"Save Changes"**

### 3.6 Check App Mode

1. Ga naar: **Settings** → **Basic**
2. Scroll naar **"App Mode"**
3. **ZET OP:** **Live** (of voeg jezelf toe als Tester als je in Development mode bent)

---

## Stap 4: Wacht En Test

1. **Wacht 5-10 minuten** (Facebook cache't settings)
2. **Test in incognito venster** (om browser cache te vermijden)
3. Ga naar: `https://marketing-bot-pro.vercel.app/settings`
4. Klik "Connect with Facebook"

---

## Stap 5: Als Het Nog Steeds Niet Werkt

### Check 1: Is De Redirect URI Exact Hetzelfde?

1. Ga naar: `https://marketing-bot-pro.vercel.app/api/test-facebook-redirect`
2. Kopieer de `redirectUri` waarde
3. Ga naar Facebook → Facebook Login → Settings → Valid OAuth Redirect URIs
4. Check of deze EXACT hetzelfde is (karakter voor karakter)

**Veelvoorkomende fouten:**
- ❌ Trailing slash: `...callback/` (moet zijn: `...callback`)
- ❌ HTTP in plaats van HTTPS: `http://...` (moet zijn: `https://...`)
- ❌ Oude URL: `[your-project]` (moet zijn: `marketing-bot-pro`)

### Check 2: Zijn Client OAuth Login En Web OAuth Login Enabled?

- Ga naar: Facebook Login → Settings
- Check of beide **Enabled** zijn
- Als niet → Enable beide → Save Changes

### Check 3: Is App Mode Op Live?

- Ga naar: Settings → Basic → App Mode
- Moet **Live** zijn (of je moet Tester zijn)

### Check 4: Check Vercel Logs

1. Ga naar: Vercel Dashboard → Deployments → laatste deployment → Functions → `/api/oauth/facebook` → Logs
2. Zoek naar: `[getOAuthUrls] redirectUri:`
3. Check of dit de juiste URL is

---

## Samenvatting - Wat Je Moet Doen

1. ✅ Check `/api/test-facebook-redirect` - kopieer de `redirectUri`
2. ✅ Ga naar Facebook → Facebook Login → Settings
3. ✅ Verwijder ALLE oude URLs uit "Valid OAuth Redirect URIs"
4. ✅ Voeg ALLEEN de URL uit stap 1 toe (EXACT hetzelfde)
5. ✅ Zorg dat Client OAuth Login = Enabled
6. ✅ Zorg dat Web OAuth Login = Enabled
7. ✅ Zorg dat App Mode = Live
8. ✅ Wacht 5-10 minuten
9. ✅ Test in incognito venster

---

## Als Niets Werkt

Als je alles hebt geprobeerd en het werkt nog steeds niet:

1. **Check de exacte foutmelding** - wat zegt Facebook precies?
2. **Check Vercel logs** - wat stuurt de code naar Facebook?
3. **Check Facebook logs** - ga naar Facebook App Dashboard → Tools → Logs
4. **Test met een andere browser** - misschien is het browser cache

De meest voorkomende oorzaak is dat de redirect URI in Facebook NIET EXACT overeenkomt met wat de code stuurt. Check dit als eerste!
