# Facebook App - Basic Setup for Development

## The Issue

Facebook is showing "Ineligible for Submission" with missing fields. This is **only for going "Live" (production)**. For development/testing, you can still use the app, but you might need to fill in minimum fields.

## Quick Fix: Fill Minimum Fields (5 minutes)

### Step 1: App Icon (Easiest)
1. Go to: https://developers.facebook.com/apps/[YOUR_BUSINESS_APP_ID]/settings/basic/
2. Find **"App Icon"**
3. Upload any 1024x1024 image (can be a simple logo or placeholder)
4. Click **"Save changes"**

### Step 2: Category
1. Still in Basic Settings
2. Find **"Category"** dropdown
3. Select **"Business"** or **"Utility"** (doesn't matter for testing)
4. Click **"Save changes"**

### Step 3: Privacy Policy URL (Simple)
You can create a simple privacy policy page:

1. In your webapp, create a page at `/privacy` or use any URL
2. Or use a simple online privacy policy generator:
   - https://www.freeprivacypolicy.com/
   - Generate a basic policy
   - Host it anywhere (even GitHub Pages, or just a simple text file online)

3. In Facebook Basic Settings:
   - Find **"Privacy Policy URL"**
   - Paste your privacy policy URL
   - Click **"Save changes"**

### Step 4: User Data Deletion
1. In Basic Settings, find **"User Data Deletion"** or **"Data Deletion Instructions URL"**
2. You can use the same URL as Privacy Policy, or create a simple page explaining:
   - "Users can delete their data by disconnecting their account in Settings"
   - Or point to the same privacy policy URL
3. Click **"Save changes"**

## After Filling These

1. Go back to: **Facebook Login** → **Settings** → **Login Configuration**
2. Click **"+ Add Configuration"**
3. Create the configuration with `public_profile` permission
4. Copy the `config_id`
5. Add to `.env.local`:
   ```env
   FACEBOOK_LOGIN_CONFIG_ID=your_config_id_here
   ```

## Note

- These fields are only required if Facebook blocks Login Configuration creation
- In pure development mode, you might not need them
- But filling them is quick and ensures everything works
- You don't need to submit for review - just fill the fields to unlock Login Configuration
