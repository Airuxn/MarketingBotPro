# Fix Facebook OAuth Setup - Invalid Scopes & Domain Error

## Problem
You're seeing two errors:
1. **Invalid Scopes** - The permissions we requested aren't approved
2. **Domain Error** - localhost isn't configured in Facebook App

## Quick Fix

### Step 1: Add localhost to Facebook App Settings

1. Go to: https://developers.facebook.com/apps/[YOUR_BUSINESS_APP_ID]/
2. Click **"Settings"** → **"Basic"** (left sidebar)
3. Scroll down to **"App Domains"**
4. Add: `localhost`
5. Click **"Save Changes"**

### Step 2: Add Redirect URI

1. Still in Settings, click **"Facebook Login"** → **"Settings"** (left sidebar)
2. Under **"Valid OAuth Redirect URIs"**, add:
   - `http://localhost:3000/api/oauth/facebook/callback`
3. Click **"Save Changes"**

### Step 3: Restart Your Server

After making these changes:
```bash
# Stop server (Ctrl+C)
npm run dev
```

## What Changed

I've updated the OAuth scopes to use **basic permissions** that work immediately:
- ✅ `email` - User email (works immediately)
- ✅ `public_profile` - Basic profile info (works immediately)

The previous scopes (`pages_manage_posts`, `instagram_basic`, etc.) require Facebook App Review, which takes time and isn't needed for basic login.

## After This Fix

When users click "Connect with Facebook":
1. ✅ They'll see Facebook login screen
2. ✅ They can log in successfully
3. ✅ Their account connects to your app

## Adding More Permissions Later

If you need to post to pages or use Instagram later:
1. These permissions require Facebook App Review
2. Facebook will review your app (can take a few days)
3. Once approved, you can add those scopes back

For now, basic login works perfectly!
