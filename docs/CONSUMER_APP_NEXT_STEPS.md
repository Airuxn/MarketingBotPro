# Consumer App - Next Steps After Creating App

## You Don't Need the JavaScript SDK

The JavaScript SDK code you're seeing is for **client-side** Facebook Login (popups, buttons, etc.). 

**We're using server-side OAuth redirects**, which don't need the JavaScript SDK. You can ignore that code!

## What to Do Next

### Step 1: Add Facebook Login Product

1. In your new app dashboard, look for **"Add Product"** section
2. Find **"Facebook Login"** (NOT "Facebook Login for Business")
3. Click **"Set Up"** or **"Get Started"**

### Step 2: Configure Redirect URI

1. Click **"Facebook Login"** → **"Settings"** (left sidebar)
2. Under **"Valid OAuth Redirect URIs"**, add:
   - `http://localhost:3000/api/oauth/facebook/callback`
3. Click **"Save Changes"**

### Step 3: Get Your Credentials

1. Go to **"Settings"** → **"Basic"** (left sidebar)
2. Copy your **App ID** (this is your `FACEBOOK_CLIENT_ID`)
3. Click **"Show"** next to App Secret and copy it (this is your `FACEBOOK_CLIENT_SECRET`)

### Step 4: Update Your .env.local

Open `.env.local` and update with your new Consumer app credentials:

```env
# Use your NEW Consumer app credentials
FACEBOOK_CLIENT_ID=your_new_consumer_app_id
FACEBOOK_CLIENT_SECRET=your_new_consumer_app_secret

# Remove or comment out config_id (Consumer doesn't use it)
# FACEBOOK_LOGIN_CONFIG_ID=

# Keep these as they are
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/facebook/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Restart Your Server

```bash
npm run dev
```

### Step 6: Reconnect Your Account

1. Go to Settings page
2. Disconnect Facebook (if connected)
3. Click "Connect with Facebook" again
4. Log in and approve permissions
5. You should now see `user_posts` and `user_photos` permissions requested

### Step 7: Test Scanning

1. Go to Content page
2. Scanning should run automatically
3. You should see your personal posts and images!

## Important Notes

- **Don't use JavaScript SDK** - We use server-side redirects
- **Don't create Login Configuration** - That's for Business login
- **Consumer login uses scopes directly** - The code already handles this
- The code requests `user_posts` and `user_photos` automatically when no config_id is set

## After This

Your scanning should work and you should see your personal Facebook posts!
