# CRITICAL: Business Apps CANNOT Get user_posts Permission

## The Problem

You're trying to get `user_posts` permission, but **it's NOT available** in Facebook Developer settings.

## Why You Can't Get It

**Your app ([YOUR_BUSINESS_APP_ID]) is a BUSINESS APP.**

**Business apps literally CANNOT get personal profile permissions:**
- ❌ `user_posts` - **NOT AVAILABLE** for Business apps
- ❌ `user_photos` - **NOT AVAILABLE** for Business apps
- ❌ Any personal profile permissions - **NOT AVAILABLE** for Business apps

**Facebook doesn't even show these permissions as options for Business apps** - they're completely unavailable.

## The Only Solution: Create a NEW Consumer App

**You MUST create a NEW Consumer app** - there's no way around this.

Your current Business app ([YOUR_BUSINESS_APP_ID]) will **NEVER** be able to get `user_posts` permission. It's impossible.

## How to Create a Consumer App

### Step 1: Go to Create App

1. Go to: https://developers.facebook.com/apps/
2. Click **"Create App"**

### Step 2: Choose the RIGHT Type

When Facebook asks "What do you need your app to do?":

**IMPORTANT:** Choose options that lead to **Consumer app**, NOT Business:
- ✅ Look for "Facebook Login" or "Social Login"
- ✅ Look for "Build Connected Experiences"
- ✅ Look for options about "user authentication" or "social login"
- ❌ Avoid "Marketing API" or "Business Management"
- ❌ Avoid "Pages" or "Ads Management"

**OR:** Look for a dropdown/category that says **"Consumer"** directly.

### Step 3: Complete App Creation

1. Enter app name (e.g., "Marketing Bot Personal")
2. Enter contact email
3. Click **"Create App"**

### Step 4: Add Facebook Login (Consumer)

1. In your new app dashboard, click **"Add Product"**
2. Find **"Facebook Login"** (NOT "Facebook Login for Business")
3. Click **"Set Up"**

### Step 5: Configure Redirect URI

1. Click **"Facebook Login"** → **"Settings"** (left sidebar)
2. Under **"Valid OAuth Redirect URIs"**, add:
   - `http://localhost:3000/api/oauth/facebook/callback`
3. Click **"Save Changes"**

### Step 6: Get New Credentials

1. Go to **"Settings"** → **"Basic"**
2. Copy **App ID** (this is your new `FACEBOOK_CLIENT_ID`)
3. Click **"Show"** next to App Secret (this is your new `FACEBOOK_CLIENT_SECRET`)
4. Update `.env.local`:
   ```env
   # Use your NEW Consumer app credentials
   FACEBOOK_CLIENT_ID=your_new_consumer_app_id
   FACEBOOK_CLIENT_SECRET=your_new_consumer_app_secret
   
   # Remove or comment out config_id (Consumer doesn't use it)
   # FACEBOOK_LOGIN_CONFIG_ID=
   ```

### Step 7: Permissions Are Requested Automatically!

**IMPORTANT:** With Consumer apps, you DON'T need to "select" permissions in the dashboard!

Our code already requests `user_posts` and `user_photos` in the OAuth URL. When users log in, Facebook will show them these permissions and ask them to approve.

You don't configure permissions in the dashboard for Consumer login - you request them in the OAuth URL (which our code does).

### Step 8: Restart and Reconnect

1. Restart your server: `npm run dev`
2. Go to Settings page
3. Disconnect Facebook (if connected)
4. Click **"Connect with Facebook"**
5. Log in - Facebook will ask you to approve `user_posts` and `user_photos`
6. Approve them
7. Scanning will now work!

## Why Your Current App Can't Work

**Your current app ([YOUR_BUSINESS_APP_ID]) is a Business app:**
- It was created as "Business" type
- Business apps ONLY support business assets (Pages, Ads)
- Personal profile permissions are **completely impossible** - Facebook doesn't even offer them
- There's no setting, configuration, or workaround to add `user_posts` to a Business app

**You MUST create a Consumer app - there's no alternative.**

## Summary

- ❌ **Business app** = NO `user_posts` (impossible, not even an option)
- ✅ **Consumer app** = YES `user_posts` (requested in OAuth URL - no dashboard config needed)
- 🔧 **You need a NEW Consumer app**
- 📝 **Your old Business app can't be fixed** - create a new one
