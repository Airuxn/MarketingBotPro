# Alle URLs Die Je Moet Toevoegen in Facebook App Settings

## 📍 Waar Te Vinden

Ga naar: https://developers.facebook.com/apps/ → Selecteer je app

---

## 1. Settings → Basic

### App Domains
**Voeg toe:**
```
marketing-bot-pro.vercel.app
```

**NIET:**
- ❌ `https://marketing-bot-pro.vercel.app` (geen https://)
- ❌ `[your-project].vercel.app` (oude URL)
- ❌ `localhost` (alleen voor development)

### Site URL
**Zet op:**
```
https://marketing-bot-pro.vercel.app
```

**NIET:**
- ❌ `http://marketing-bot-pro.vercel.app` (moet https zijn)
- ❌ `https://[your-project].vercel.app` (oude URL)

---

## 2. Facebook Login → Settings

### Client OAuth Login
**Zet op:** ✅ **Enabled**

### Web OAuth Login
**Zet op:** ✅ **Enabled**

### Valid OAuth Redirect URIs
**Voeg ALLEEN deze toe:**
```
https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback
```

**VERWIJDER ALLES ANDERS:**
- ❌ `http://localhost:3000/api/oauth/facebook/callback` (verwijder als je niet lokaal test)
- ❌ `https://[your-project].vercel.app/api/oauth/facebook/callback` (oude URL - VERWIJDER)
- ❌ Alle andere URLs die er nog staan

**BELANGRIJK:**
- Moet EXACT zijn: `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback`
- Geen trailing slash aan het einde
- Moet `https://` zijn (niet `http://`)

---

## 3. App Mode

### App Mode
**Zet op:** **Live** (of voeg jezelf toe als Tester als je in Development mode bent)

---

## 📋 Complete Checklist

### Settings → Basic:
- [ ] **App Domains:** `marketing-bot-pro.vercel.app` (zonder https://)
- [ ] **Site URL:** `https://marketing-bot-pro.vercel.app` (met https://)
- [ ] Geen oude URLs (`[your-project]`) meer in App Domains
- [ ] Geen oude URLs in Site URL

### Facebook Login → Settings:
- [ ] **Client OAuth Login:** ✅ Enabled
- [ ] **Web OAuth Login:** ✅ Enabled
- [ ] **Valid OAuth Redirect URIs:** ALLEEN `https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback`
- [ ] Geen `localhost` URLs (tenzij je lokaal test)
- [ ] Geen oude URLs (`[your-project]`)

### App Mode:
- [ ] **App Mode:** Live (of je bent Tester)

---

## ⚠️ BELANGRIJK

1. **Exacte match:** De redirect URI in Facebook MOET EXACT overeenkomen met wat de code gebruikt
2. **Geen trailing slash:** Eindig niet met `/`
3. **HTTPS:** Altijd `https://` niet `http://`
4. **Verwijder oude URLs:** Zorg dat er geen `[your-project]` meer staat
5. **Wacht 5-10 minuten:** Facebook cache't settings, wacht even na wijzigingen

---

## 🧪 Test

Na het toevoegen van alle URLs:

1. Wacht 5-10 minuten
2. Test: `https://marketing-bot-pro.vercel.app/settings` → "Connect with Facebook"
3. Als het nog steeds niet werkt:
   - Check of alle URLs exact overeenkomen
   - Check of Client OAuth Login en Web OAuth Login Enabled zijn
   - Check of App Mode op Live staat (of je bent Tester)

---

## 📝 Samenvatting - Alle URLs

**App Domains:**
```
marketing-bot-pro.vercel.app
```

**Site URL:**
```
https://marketing-bot-pro.vercel.app
```

**Valid OAuth Redirect URIs:**
```
https://marketing-bot-pro.vercel.app/api/oauth/facebook/callback
```

**Dat is alles! Geen andere URLs nodig.**
