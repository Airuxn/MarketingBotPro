# Personal Posts Setup - Consumer Login with user_posts

## What You Need

To scan **personal Facebook posts** (not page posts), you need:
- ✅ **Consumer login** (regular Facebook Login, NOT Business)
- ✅ `user_posts` permission - Read user's personal posts
- ✅ `user_photos` permission - Read user's photos

## Why Business Login Doesn't Work

**Facebook Login for Business** only supports business assets:
- ✅ Pages (business pages)
- ✅ Ad Accounts
- ❌ **NOT personal profile posts** (no `user_posts` available)

If you use Business login, you can only scan **Page posts**, not personal posts.

## Current Setup (Consumer Mode)

Your app is configured for **Consumer login**:
- No `FACEBOOK_LOGIN_CONFIG_ID` in `.env.local` = Consumer mode
- Code uses `scope` parameter (Consumer) instead of `config_id` (Business)
- Requests `user_posts` and `user_photos` permissions

## How It Works

1. User clicks "Connect with Facebook"
2. Redirects to Facebook OAuth dialog
3. Requests permissions: `public_profile`, `user_posts`, `user_photos`
4. User approves permissions
5. Returns to app with access token
6. App uses token to fetch `/me/posts` (personal posts)

## Facebook App Setup

### Step 1: Make Sure You Have a Consumer App

Your app should be a **Consumer app**, not Business:
- Go to: https://developers.facebook.com/apps/[YOUR_BUSINESS_APP_ID]/settings/basic/
- Check the app type
- If it's "Business", you need to create a new Consumer app

### Step 2: Add Facebook Login (Consumer)

1. Go to your app dashboard
2. Click **"Add Product"**
3. Find **"Facebook Login"** (NOT "Facebook Login for Business")
4. Click **"Set Up"**
5. Click **"Settings"** under Facebook Login

### Step 3: Configure Redirect URI

In Facebook Login Settings:
- Under **"Valid OAuth Redirect URIs"**, add:
  - `http://localhost:3000/api/oauth/facebook/callback`
- Click **"Save Changes"**

### Step 4: Get Credentials

1. Go to **"Settings"** → **"Basic"**
2. Copy **App ID** → This is `FACEBOOK_CLIENT_ID`
3. Click **"Show"** next to App Secret → This is `FACEBOOK_CLIENT_SECRET`
4. Update `.env.local`:
   ```env
   FACEBOOK_CLIENT_ID=your_app_id
   FACEBOOK_CLIENT_SECRET=your_app_secret
   # Do NOT set FACEBOOK_LOGIN_CONFIG_ID (that's for Business login)
   # FACEBOOK_LOGIN_CONFIG_ID=
   ```

### Step 5: Reconnect Account

1. Go to Settings page
2. Disconnect Facebook (if connected)
3. Click **"Connect with Facebook"** again
4. Log in and approve `user_posts` and `user_photos` permissions
5. App will now be able to scan your personal posts!

## Permissions Requested

The app requests these permissions:
- `public_profile` - Basic info (name, ID, picture) - always granted
- `user_posts` - Read your personal posts - **requires approval**
- `user_photos` - Read your photos - **requires approval**

## Notes

- `user_posts` and `user_photos` **do not require app review** for basic access
- These permissions are for **personal profile posts**, not Page posts
- If you also want Page posts, you'd need to request page permissions too
- Server-side OAuth redirects work fine for Consumer login (no JavaScript SDK needed)

## Testing

After reconnecting:
1. Go to Content page
2. Scanning should run automatically
3. Check browser console (F12) for any errors
4. You should see your personal posts and images!
