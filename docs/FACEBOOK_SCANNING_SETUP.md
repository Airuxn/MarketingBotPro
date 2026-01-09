# Facebook Scanning - Missing Permissions Fix

## The Problem

Your Facebook account is connected, but scanning doesn't work because the Login Configuration is missing required permissions.

## What Permissions Are Needed?

To scan Facebook posts and images, you need:

1. **For Personal Accounts:**
   - `user_posts` - Read user's posts
   - `user_photos` - Read user's photos

2. **For Pages:**
   - `pages_read_engagement` - Read page posts
   - `pages_read_user_content` - Read page content
   - `pages_show_list` - List user's pages (you already have this)

## How to Fix

### Step 1: Update Your Login Configuration

1. Go to: https://developers.facebook.com/apps/[YOUR_BUSINESS_APP_ID]/fb-login/settings/
2. Find your Login Configuration (config_id: 2310982732753378)
3. Click **"Edit"** or recreate it
4. In **Permissions**, add:
   - `public_profile` (already there)
   - `pages_show_list` (already there)
   - `user_posts` (NEW - for personal posts)
   - `user_photos` (NEW - for personal photos)
   - `pages_read_engagement` (NEW - for page posts)
   - `pages_read_user_content` (NEW - for page content)
5. Click **"Save"** or **"Update"**
6. If you get a new config_id, update your `.env.local`:
   ```env
   FACEBOOK_LOGIN_CONFIG_ID=new_config_id_here
   ```

### Step 2: Re-authenticate Your Account

After updating permissions:
1. Go to Settings page
2. Disconnect Facebook account
3. Connect again (this will request the new permissions)
4. Approve the new permissions

### Step 3: Restart Server

```bash
npm run dev
```

### Step 4: Test Scanning

1. Go to Content page
2. Scanning should happen automatically
3. You should see images from your Facebook posts in the Brand Image Library

## Note About Permissions

Some permissions might require App Review for production use, but they should work in development mode for testing.

## If Scanning Still Doesn't Work

Check browser console (F12) for errors. The scanning runs automatically when you:
- Go to the Content page
- Connect a new account

If you see permission errors, you may need to add more permissions or the permissions might require App Review.
