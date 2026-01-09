# Facebook Login Configuration - Required Setup

## The Problem

Facebook now requires you to create a **"Login Configuration"** in your app settings before you can use OAuth login. You can't just request permissions in the URL anymore.

## How to Fix

### Step 1: Create Login Configuration

1. Go to: https://developers.facebook.com/apps/[YOUR_BUSINESS_APP_ID]/
2. In the left sidebar, click **"Facebook Login"** → **"Settings"**
3. Scroll down to **"Login Configuration"** section
4. Click **"+ Add Configuration"** (or "Add Configuration" button)
5. Fill in:
   - **Configuration Name**: Something like "Default Login" or "Web Login"
   - **Permissions**: Add at least one permission:
     - Click the permissions dropdown
     - Add: `public_profile` (this is the basic one that works without review)
     - You can also add `email` if you want (but it might need review)
   - Click **"Save"** or **"Create"**
6. **Copy the `config_id`** that Facebook generates (it's a long number, like `1234567890123456`)

### Step 2: Update Your Code

After getting the `config_id`, you need to add it to your `.env.local` file:

```env
FACEBOOK_LOGIN_CONFIG_ID=your_config_id_here
```

### Step 3: Restart Server

```bash
npm run dev
```

## What This Does

By creating a Login Configuration, you're telling Facebook:
- "My app needs these permissions: public_profile"
- Facebook knows to allow these permissions during login

Without a Login Configuration, Facebook doesn't know what permissions your app needs, hence the error.

## Notes

- **public_profile** works immediately (no review needed)
- **email** might require app review depending on your app type
- You can add more permissions later and update your configuration
