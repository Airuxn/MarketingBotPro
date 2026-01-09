# Fix Facebook Redirect URI

## The Problem

In your Facebook Login Settings, you have:
- `http://localhost:3000/` ❌

But it should be:
- `http://localhost:3000/api/oauth/facebook/callback` ✅

## How to Fix

1. **In the "Valid OAuth Redirect URIs" field:**
   - Change `http://localhost:3000/` to:
   - `http://localhost:3000/api/oauth/facebook/callback`

2. **Click "Save changes"** (bottom right)

3. **Optional but recommended - Add to "Allowed Domains for the JavaScript SDK":**
   - Add: `localhost` (just the domain name, no http:// or port)

4. **Restart your server:**
   ```bash
   npm run dev
   ```

## Why?

The redirect URI must match EXACTLY what your code sends to Facebook. Your code sends:
- `http://localhost:3000/api/oauth/facebook/callback`

So Facebook settings must have the EXACT same URL.

## After Fixing

Try connecting again - it should work! ✅
