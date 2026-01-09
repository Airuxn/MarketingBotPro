# Facebook Login Type - Business vs Consumer

## The Issue

Your app might be set up as a **Business type app**, which uses "Facebook Login for Business". This requires business permissions and is meant for apps that serve businesses.

However, for your use case (clients connecting their personal Facebook accounts to post content), you probably want **regular Facebook Login** (consumer), not Business.

## What You Need

For your use case:
- **Regular Facebook Login** (Consumer) - for personal account connections
- Simple permissions like `public_profile` and maybe `pages_show_list` for basic posting

## How to Check Your App Type

1. Go to: https://developers.facebook.com/apps/[YOUR_BUSINESS_APP_ID]/settings/basic/
2. Check what it says for "App Type" or "Category"
3. If it says "Business" and you see "Facebook Login for Business" banner, that's the issue

## Option 1: Use Facebook Login for Business (If Your App is Already Business Type)

If your app is already a Business type app, you need to add a business permission to your Login Configuration:

1. Go to: https://developers.facebook.com/apps/[YOUR_BUSINESS_APP_ID]/fb-login/settings/
2. Create a Login Configuration
3. Add these permissions:
   - `public_profile` (automatic, but add it explicitly)
   - `pages_show_list` (shows user's pages - good for basic use)
   - OR `pages_read_engagement` (read page data)

This satisfies the requirement of "at least one other permission beyond email/public_profile"

## Option 2: Switch to Regular Facebook Login (Recommended for Personal Accounts)

If you want clients to connect their **personal Facebook accounts** (not business accounts), switch to regular Facebook Login:

1. Go to: https://developers.facebook.com/apps/[YOUR_BUSINESS_APP_ID]/fb-login/settings/
2. Look for "Switch to Facebook Login" link (if available)
3. If you see a banner saying "Get started with Facebook Login for Business", **don't click it** - that means you're on regular Facebook Login

**Note:** If your app is already Business type, you can only switch back within 30 days.

## Recommended: Start Fresh with Consumer App

If possible, create a new app as "Consumer" type instead of "Business":

1. Go to: https://developers.facebook.com/apps/
2. Click "Create App"
3. Choose **"Consumer"** (NOT "Business")
4. This will use regular Facebook Login (simpler for personal accounts)

## For Now: Quick Fix with Business Login

If you want to proceed with your current Business app, add a business permission:

1. Go to Facebook Login → Settings → Configurations
2. Create configuration with:
   - `public_profile`
   - `pages_show_list` (this is a business permission that works for basic use)

This should satisfy Facebook's requirement!
