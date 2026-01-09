# Facebook OAuth Complete Setup Guide

## ⚠️ BELANGRIJK: Volg deze stappen EXACT in deze volgorde

### Stap 1: Check welke URL je app gebruikt

1. Ga naar: `https://marketing-bot-pro.vercel.app/api/debug-oauth`
2. Check de `redirectUri` waarde
3. **Dit is de URL die je MOET gebruiken in Facebook**

### Stap 2: Facebook App Settings - Basic

1. Ga naar: https://developers.facebook.com/apps → Je App → Settings → Basic
2. **App Domains:**
   - Voeg toe: `marketing-bot-pro.vercel.app`
   - **VERWIJDER** `[your-project].vercel.app` als die er nog staat
3. **Site URL:**
   - Zet op: `https://marketing-bot-pro.vercel.app`
   - **VERWIJDER** `https://[your-project].vercel.app` als die er nog staat

### Stap 3: Facebook App Settings - Facebook Login

1. Ga naar: Settings → Facebook Login → Settings
2. **Client OAuth Login:** ✅ **ENABLED**
3. **Web OAuth Login:** ✅ **ENABLED**
4. **Valid OAuth Redirect URIs:**
   - **VERWIJDER ALLES** (alle oude URLs)
   - Voeg toe: `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback`
   - **NIET** `https://[your-project].vercel.app/api/oauth/facebook/callback`
   - **NIET** `http://localhost:3000/api/oauth/facebook/callback` (tenzij je lokaal test)

### Stap 4: App Mode

1. Ga naar: Settings → Basic → App Mode
2. Zet op: **Live** (of voeg jezelf toe als Tester als je in Development mode bent)

### Stap 5: Wacht 5-10 minuten

Facebook cache't settings. Wacht even voordat je test.

### Stap 6: Test

1. Ga naar: `https://marketing-bot-pro.vercel.app/settings`
2. Klik "Connect with Facebook"
3. Als het nog steeds niet werkt:
   - Check Vercel logs: Deployments → laatste deployment → Functions → `/api/oauth/facebook` → Logs
   - Zoek naar: `[OAuth] Final Redirect URI (to Facebook):`
   - Deze URL MOET exact overeenkomen met wat in Facebook staat

## Troubleshooting

### Fout: "URI van de omleiding niet aan de whitelist"

**Oorzaak:** De URL in de code komt niet overeen met Facebook settings.

**Oplossing:**
1. Check `/api/debug-oauth` om te zien welke URL de code gebruikt
2. Zorg dat deze EXACTE URL in Facebook staat (inclusief `https://`)
3. Wacht 5-10 minuten en test opnieuw

### Fout: "App is niet actief"

**Oorzaak:** App staat in Development mode en je bent niet toegevoegd als Tester.

**Oplossing:**
1. Ga naar: Settings → Basic → App Mode
2. Zet op "Live" OF voeg jezelf toe als Tester in Roles → Testers

### Fout: "Domein niet toegevoegd"

**Oorzaak:** App Domain komt niet overeen.

**Oplossing:**
1. Ga naar: Settings → Basic → App Domains
2. Voeg toe: `marketing-bot-pro.vercel.app` (zonder `https://`)
3. Zet Site URL op: `https://marketing-bot-pro.vercel.app` (met `https://`)

## Checklist

- [ ] `/api/debug-oauth` toont de juiste redirect URI
- [ ] App Domain = `marketing-bot-pro.vercel.app`
- [ ] Site URL = `https://marketing-bot-pro.vercel.app`
- [ ] Client OAuth Login = ENABLED
- [ ] Web OAuth Login = ENABLED
- [ ] Valid OAuth Redirect URIs bevat ALLEEN: `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback`
- [ ] Geen oude URLs (`[your-project]`) meer in Facebook settings
- [ ] App Mode = Live (of je bent Tester)
- [ ] 5-10 minuten gewacht na wijzigingen
- [ ] Getest en werkt
