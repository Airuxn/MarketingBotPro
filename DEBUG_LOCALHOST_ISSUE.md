# Debug: Waarom redirect naar localhost?

## Het Probleem

Als je naar `https://[your-project].vercel.app/api/oauth/facebook/callback` gaat, word je naar `http://localhost:3000` geredirect.

## Waarom Dit Gebeurt

De callback route gebruikt `baseUrl` om te redirecten. Als `baseUrl` nog steeds `localhost:3000` is, dan redirect het daar naartoe.

## Oorzaken

1. **Vercel gebruikt nog oude code**
   - De nieuwe deployment is nog niet actief
   - Build cache gebruikt oude code

2. **isProduction check faalt**
   - `requestUrl.host.includes('vercel.app')` zou moeten werken
   - Maar misschien is `requestUrl.host` leeg of undefined

3. **VERCEL_URL bestaat niet**
   - Vercel injecteert `VERCEL_URL` automatisch
   - Maar misschien bestaat het niet tijdens runtime

## Oplossing

De code is al gefixt om:
- `isProduction` te checken op basis van `vercel.app` in hostname
- Hardcoded Vercel URL te gebruiken als fallback
- Geen localhost fallback op Vercel

## Check Dit

1. **Is de nieuwe deployment actief?**
   - Ga naar Vercel → Deployments
   - Check of commit `3a302b1` is gedeployed
   - Check of status "Ready" is

2. **Check Vercel Logs**
   - Ga naar de callback request in logs
   - Kijk naar console output:
     ```
     [OAuth Callback] Production: true/false
     [OAuth Callback] Base URL: ...
     [OAuth Callback] Request Host: ...
     ```
   - Dit laat zien wat de code ziet

3. **Force Redeploy**
   - Als de nieuwe deployment er niet is:
   - Klik "Redeploy" (zonder build cache)

## Wat Normaal Is

Als je direct naar de callback URL gaat (zonder `code` parameter):
- ✅ Moet redirecten naar: `https://[your-project].vercel.app/settings?oauth_error=no_code`
- ❌ NIET naar: `http://localhost:3000`

Als het nog steeds naar localhost gaat, betekent dit dat Vercel de nieuwe code nog niet gebruikt.
