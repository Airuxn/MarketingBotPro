# New Consumer App - Next Steps

## ✅ You've Created a Consumer App!

**App ID:** [Your App ID - check Facebook Developer Console]

Your `.env.local` should be updated with the new credentials.

## Next Steps to Complete Setup

### Step 1: Configure Redirect URI in Facebook App

1. Go to: https://developers.facebook.com/apps/[YOUR_APP_ID]/
2. In the left sidebar, click **"Facebook Login"** → **"Settings"**
3. Scroll down to **"Valid OAuth Redirect URIs"**
4. Click **"Add URI"** or click the field
5. Add: `http://localhost:3000/api/oauth/facebook/callback`
6. Click **"Save Changes"**

### Step 2: Add Facebook Login Product (If Not Already Added)

If you don't see "Facebook Login" in the left sidebar:

1. In your app dashboard, look for **"Add Product"** or go to **"Products"**
2. Find **"Facebook Login"** (NOT "Facebook Login for Business")
3. Click **"Set Up"** or **"Get Started"**
4. Then go to **"Facebook Login"** → **"Settings"** to configure redirect URI

### Step 3: Verify .env.local is Updated

Check that your `.env.local` has:
```env
FACEBOOK_CLIENT_ID=your_consumer_app_id_here
FACEBOOK_CLIENT_SECRET=your_consumer_app_secret_here
# Make sure FACEBOOK_LOGIN_CONFIG_ID is commented out or removed (Consumer doesn't use it)
# FACEBOOK_LOGIN_CONFIG_ID=
```

### Step 4: Restart Your Server

```bash
npm run dev
```

### Step 5: Reconnect Your Facebook Account

1. Go to your app's Settings page
2. Find the Facebook social account connector
3. **Disconnect** Facebook (if it's already connected with the old Business app)
4. Click **"Connect with Facebook"** again
5. Log in with your Facebook account
6. **IMPORTANT:** Facebook will now show you a permission dialog asking for:
   - ✅ `public_profile` (basic info)
   - ✅ `user_posts` (read your posts) - **APPROVE THIS**
   - ✅ `user_photos` (read your photos) - **APPROVE THIS**
7. Click **"Continue"** or **"Allow"** to approve all permissions

### Step 6: Test Scanning

1. After reconnecting, go to the Content page
2. Scanning should run automatically
3. You should now see your **personal Facebook posts** and images!

## What's Different Now?

**Before (Business App):**
- ❌ Could only get page permissions
- ❌ Could NOT get `user_posts` or `user_photos`
- ❌ Could only scan Page posts, not personal posts

**Now (Consumer App):**
- ✅ Can request `user_posts` permission
- ✅ Can request `user_photos` permission
- ✅ Can scan your personal Facebook posts
- ✅ Can extract images from personal posts

## The Code Is Ready

The code has already been updated to:
- ✅ Request `user_posts` and `user_photos` permissions (for Consumer login)
- ✅ Scan personal posts using `/me/posts` endpoint
- ✅ Extract images from personal posts

You just need to configure the redirect URI and reconnect your account!

## Troubleshooting

**If you see "Redirect URI mismatch":**
- Make sure you added `http://localhost:3000/api/oauth/facebook/callback` in Facebook Login Settings
- Make sure it matches exactly (including `http://` not `https://`)

**If permissions aren't requested:**
- Make sure `FACEBOOK_LOGIN_CONFIG_ID` is NOT set in `.env.local` (Consumer doesn't use it)
- Restart your server after updating `.env.local`

**If scanning still doesn't work:**
- Check browser console (F12) for errors
- Make sure you approved `user_posts` and `user_photos` permissions during login
- Try disconnecting and reconnecting again
