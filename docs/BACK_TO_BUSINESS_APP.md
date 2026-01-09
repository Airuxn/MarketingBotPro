# Back to Business App - Using Page Permissions

## Configuration Updated

You've switched back to the Business app:
- **App ID:** [YOUR_BUSINESS_APP_ID]
- **Secret:** Updated in `.env.local`

## What Changed

The code now requests **Page permissions** instead of personal post permissions:
- ✅ `public_profile` - Basic profile info
- ✅ `pages_show_list` - List user's Facebook Pages
- ✅ `pages_read_engagement` - Read page posts
- ✅ `pages_read_user_content` - Read page content

## How It Works

**The app will now scan Facebook Page posts** (business pages), not personal profile posts.

The scanning code:
1. Gets list of user's Facebook Pages (`/me/accounts`)
2. Scans posts from each Page (`/page-id/posts`)
3. Extracts images and content from Page posts

## What You Need to Do

### Step 1: Configure Redirect URI

1. Go to: https://developers.facebook.com/apps/[YOUR_BUSINESS_APP_ID]/
2. Click **"Facebook Login"** → **"Settings"** (left sidebar)
3. Under **"Valid OAuth Redirect URIs"**, add:
   - `http://localhost:3000/api/oauth/facebook/callback`
4. Click **"Save Changes"**

### Step 2: Restart Server

```bash
npm run dev
```

### Step 3: Reconnect Facebook Account

1. Go to Settings page
2. Disconnect Facebook (if connected)
3. Click **"Connect with Facebook"** again
4. Log in and approve permissions:
   - ✅ `public_profile` (basic info)
   - ✅ `pages_show_list` (list pages)
   - ✅ `pages_read_engagement` (read page posts)
   - ✅ `pages_read_user_content` (read page content)
5. Approve all permissions

### Step 4: Test Scanning

1. Go to Content page
2. Scanning should run automatically
3. You should see posts from your **Facebook Pages** (not personal profile)

## Important Notes

**Page permissions may also require App Review for production use**, but they often work in development mode for testing.

**If you see permission errors:**
- The permissions might need App Review
- But try connecting first - they might work in development mode
- If they don't work, you'll need to request them in App Review

## What Gets Scanned

**The app scans:**
- ✅ Posts from your Facebook Pages (business pages)
- ✅ Images from Page posts
- ✅ Content/text from Page posts
- ✅ Engagement metrics (likes, comments, shares)

**The app does NOT scan:**
- ❌ Personal profile posts (would need `user_posts` which requires App Review)

## Summary

- ✅ Using Business app credentials
- ✅ Requesting Page permissions (not personal post permissions)
- ✅ Will scan Facebook Page posts
- ✅ Should work for development/testing
- ⚠️ Page permissions may require App Review for production
