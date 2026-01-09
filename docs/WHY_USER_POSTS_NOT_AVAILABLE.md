# Why user_posts Is NOT Available - Business App Limitation

## The Problem

You're trying to get `user_posts` permission, but it's **NOT showing up** in Facebook Developer settings.

## Why This Happens

**Facebook Login for Business does NOT support personal profile permissions.**

If your app is a **Business app** (which it is: App ID [YOUR_BUSINESS_APP_ID]), you literally **cannot** get:
- ❌ `user_posts` - Personal posts (NOT available)
- ❌ `user_photos` - Personal photos (NOT available)

**Business apps ONLY support:**
- ✅ Page permissions (`pages_read_engagement`, `pages_read_user_content`)
- ✅ Ad Account permissions
- ✅ Business assets

## The Solution: You MUST Create a Consumer App

Since you need **personal posts**, you need a **Consumer app**, not a Business app.

### Step 1: Create a NEW Consumer App

1. Go to: https://developers.facebook.com/apps/
2. Click **"Create App"**
3. **IMPORTANT:** Choose **"Consumer"** (NOT "Business")
   - If you don't see "Consumer" option, Facebook might be defaulting to Business
   - Look for "What do you need your app to do?" and choose options that lead to Consumer
   - Or select "Build Connected Experiences" → This often gives Consumer option
4. Fill in:
   - **App name**: Something like "Marketing Bot Personal" or "My Marketing Bot"
   - **App contact email**: Your email
5. Click **"Create App"**

### Step 2: Add Facebook Login (Consumer)

1. In your new Consumer app dashboard
2. Click **"Add Product"** (or look for products)
3. Find **"Facebook Login"** (NOT "Facebook Login for Business")
4. Click **"Set Up"**

### Step 3: Configure Redirect URI

1. Click **"Facebook Login"** → **"Settings"** (left sidebar)
2. Under **"Valid OAuth Redirect URIs"**, add:
   - `http://localhost:3000/api/oauth/facebook/callback`
3. Click **"Save Changes"**

### Step 4: Get New Credentials

1. Go to **"Settings"** → **"Basic"**
2. Copy **App ID** (this is your new `FACEBOOK_CLIENT_ID`)
3. Click **"Show"** next to App Secret (this is your new `FACEBOOK_CLIENT_SECRET`)
4. Update `.env.local`:
   ```env
   FACEBOOK_CLIENT_ID=your_new_consumer_app_id
   FACEBOOK_CLIENT_SECRET=your_new_consumer_app_secret
   # Remove or comment out config_id (Consumer doesn't use it)
   # FACEBOOK_LOGIN_CONFIG_ID=
   ```

### Step 5: Permissions Will Work Automatically

**Important:** With Consumer login, you DON'T need to "select" permissions in the dashboard!

The code requests `user_posts` and `user_photos` in the OAuth URL, and Facebook will show them to users during login. You don't configure them in the dashboard - they're requested dynamically.

### Step 6: Reconnect Account

1. Restart your server: `npm run dev`
2. Go to Settings page
3. Disconnect Facebook (if connected)
4. Click **"Connect with Facebook"**
5. Log in - Facebook will ask you to approve `user_posts` and `user_photos`
6. Approve them
7. Now scanning will work!

## Why Your Current App Can't Do This

Your current app ([YOUR_BUSINESS_APP_ID]) is a **Business app**:
- It uses "Facebook Login for Business"
- Business login ONLY supports business assets (Pages, Ads)
- Personal profile permissions are **completely unavailable**
- There's no way to add them - Facebook doesn't allow it

**You MUST create a Consumer app to get personal posts.**

## What About Your Old App?

You can:
- Keep the old Business app (it won't be used)
- OR delete it if you don't need it
- Your new Consumer app will be completely separate

## Summary

- ❌ Business app = NO `user_posts` (impossible)
- ✅ Consumer app = YES `user_posts` (just request it in OAuth URL)
- You need to create a NEW Consumer app
- Don't try to configure permissions in dashboard for Consumer - they're requested in code
