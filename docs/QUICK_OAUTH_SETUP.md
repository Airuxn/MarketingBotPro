# Quick OAuth Setup - "Login with Facebook"

## What is OAuth?

OAuth is **exactly** what you want:
- Your CLIENT clicks "Connect with Facebook"
- They see a Facebook login screen (just like logging into any website with Facebook)
- After logging in, their account connects to your webapp

**Important:** YOU (the developer) set this up ONCE. Then ALL your clients can use it without any setup on their part!

## How It Works

Think of it like any website that has "Login with Facebook":
- **You** (the website owner) set up Facebook login ONCE when building your site
- **Your users** (clients) just click "Login with Facebook" and log in - no setup needed!

Same here:
- **You** set up Facebook App credentials ONCE
- **Your clients** click "Connect with Facebook" and log in - done!

## Why Do I Need Facebook Credentials?

To use Facebook login, YOU (the developer) need to register your webapp with Facebook ONCE. Facebook gives you:
- **Client ID** (App ID) - Public identifier for your app
- **Client Secret** - Secret key to prove it's really your app

This is FREE and takes about 5-10 minutes. You do it ONCE, then all your clients can use Facebook login!

## ⚠️ Important: You Do This ONCE, Not Your Clients!

**YOU** (the developer) set this up ONCE when you deploy your webapp.

**YOUR CLIENTS** just click "Connect with Facebook" and log in - no setup needed!

---

## 💰 COST: IT'S 100% FREE!

**Facebook OAuth is completely free** - no payment required, no credit card needed, no subscription. Just create an account and get your credentials.

---

## Quick Setup (5 minutes) - ONE TIME ONLY

### Step 1: Go to Facebook Developers (FREE Account)
Visit: https://developers.facebook.com/
- Click "Log In" (use your regular Facebook account - same one you use for Facebook)
- **It's FREE** - no payment required!

### Step 2: Create a Facebook App (FREE)
1. Once logged in, click the green **"My Apps"** button (top right)
2. Click **"Create App"**
3. Choose app type:
   - Click **"Consumer"** (or "Business" - doesn't matter for login)
   - Click **"Next"**
4. Fill in app details:
   - **App name**: Something like "My Marketing Bot" or your business name
   - **App contact email**: Your email
   - **Business account**: (Optional - you can skip this)
5. Click **"Create App"**
   - You might need to verify with a code sent to your email (normal security step)

### Step 3: Add Facebook Login Product (FREE)
1. In your new app dashboard, scroll down to find **"Add Product"** section
2. Find **"Facebook Login"** and click **"Set Up"**
3. You'll see Facebook Login added to your products list

### Step 4: Configure Redirect URI
1. In the left sidebar, click **"Facebook Login"** → **"Settings"**
2. Scroll down to **"Valid OAuth Redirect URIs"**
3. Click **"Add URI"** and add:
   - `http://localhost:3000/api/oauth/facebook/callback` (for development/testing)
   - Click **"Save Changes"**

**Note:** Later, when you deploy to production, you'll add your production URL here too.

### Step 5: Get Your FREE Credentials (This is what you need!)
1. In the left sidebar, click **"Settings"** → **"Basic"**
2. You'll see:
   - **App ID** - Copy this (this is your `FACEBOOK_CLIENT_ID`)
   - **App Secret** - Click **"Show"** next to it, then copy it (this is your `FACEBOOK_CLIENT_SECRET`)
3. **That's it!** You now have your free OAuth credentials!

### Step 6: Add to Your .env.local File
Create or edit `.env.local` in your project root:
```env
FACEBOOK_CLIENT_ID=paste_your_app_id_here
FACEBOOK_CLIENT_SECRET=paste_your_app_secret_here
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/facebook/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 7: Restart Your Server
```bash
npm run dev
```

## That's It! You're Done!

Now when YOUR CLIENTS click "Connect with Facebook":
1. ✅ They see the Facebook login screen (just like logging into any website)
2. ✅ They log in with their own Facebook account
3. ✅ Their account connects to your webapp
4. ✅ No setup needed on their part - they just log in!

**You set this up ONCE. Your clients use it forever!**

## Important Notes

- **💰 100% FREE** - Facebook doesn't charge for OAuth login (no payment, no subscription)
- **Development Mode** - Your app starts in "Development Mode" where only you and test users can log in (perfect for testing)
- **Live Mode** - When you're ready for real clients, you can request "Live Mode" (also free, just requires app review)
- **For Now** - Development mode works great for testing and personal use!

## What About Other Platforms?

- **Twitter/X**: Same process - go to https://developer.twitter.com/ (also FREE)
- **LinkedIn**: Same process - go to https://www.linkedin.com/developers/ (also FREE)
- **Instagram**: Uses Facebook credentials (same ones you just got - FREE)

All social media OAuth is FREE - you just need to register your app with each platform.

## Need Help?

If you get stuck, check:
- Facebook Developer Documentation: https://developers.facebook.com/docs/facebook-login/
- Make sure your redirect URI matches exactly
- Make sure you restarted the server after adding environment variables
