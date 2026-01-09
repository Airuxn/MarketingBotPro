# Switch to Consumer Login for Personal Posts

## The Problem

Facebook Login for Business only supports **business assets** (Pages, Ad Accounts), NOT personal posts.

To scan personal Facebook posts, you need **Consumer Login** (regular Facebook Login), not Business Login.

## The Issue

If your app was created as **Business type** (which it was), you **cannot switch** to Consumer login. According to Facebook:
> "Newly created Business Type apps cannot switch back to Facebook Login."

## Solution: Create a New Consumer App

You need to create a **new Consumer app** for personal post scanning:

### Step 1: Create New Consumer App

1. Go to: https://developers.facebook.com/apps/
2. Click **"Create App"**
3. Choose **"Consumer"** (NOT "Business")
4. Fill in app details:
   - **App name**: Something like "Marketing Bot Personal" or "My Marketing Bot Consumer"
   - **App contact email**: Your email
5. Click **"Create App"**

### Step 2: Add Facebook Login (Consumer)

1. In your new Consumer app, click **"Add Product"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Click **"Settings"** under Facebook Login
4. Add redirect URI:
   - `http://localhost:3000/api/oauth/facebook/callback`
   - Click **"Save Changes"**

### Step 3: Get Credentials

1. Go to **"Settings"** → **"Basic"**
2. Copy **App ID** and **App Secret**
3. Update your `.env.local`:
   ```env
   FACEBOOK_CLIENT_ID=new_consumer_app_id
   FACEBOOK_CLIENT_SECRET=new_consumer_app_secret
   # Remove or comment out FACEBOOK_LOGIN_CONFIG_ID (Consumer doesn't use config_id)
   # FACEBOOK_LOGIN_CONFIG_ID=
   ```

### Step 4: Update Code to Use Consumer Login

Consumer login uses `scope` parameter instead of `config_id`. The code already has fallback support for this.

### Step 5: Update Permissions in Code

For Consumer login, you can request:
- `public_profile` (basic)
- `user_posts` (personal posts)
- `user_photos` (personal photos)

Update the OAuth route to request these permissions.

## Alternative: Keep Both Apps

You could:
- Use **Consumer app** for personal post scanning
- Keep **Business app** for page management/posting later
- Update code to use different apps for different purposes

But for now, to scan personal posts, Consumer app is the way to go!
