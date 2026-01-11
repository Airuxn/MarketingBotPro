# OAuth Setup Guide

This guide explains how to set up OAuth authentication for social media accounts (for normal posts). Ad accounts still use manual token entry.

## Overview

The app uses OAuth 2.0 to connect social media accounts for posting content. This provides a secure, user-friendly way for clients to connect their accounts without manually entering access tokens.

## Environment Variables

Add the following environment variables to your `.env.local` file:

### Facebook (required for Facebook and Instagram)
```env
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
```

**Note:** `NEXT_PUBLIC_FACEBOOK_APP_ID` should have the same value as `FACEBOOK_CLIENT_ID`. It's required for the Facebook JavaScript SDK to work in the browser. The `FACEBOOK_CLIENT_ID` is used for server-side OAuth, while `NEXT_PUBLIC_FACEBOOK_APP_ID` is used for client-side Facebook Login.

### Twitter/X
```env
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

### LinkedIn
```env
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### Redirect URI
```env
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/facebook/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, update these to your production URLs:
```env
NEXT_PUBLIC_OAUTH_REDIRECT_URI=https://yourdomain.com/api/oauth/facebook/callback
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Platform Setup Instructions

### Facebook

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add "Facebook Login" product
4. Configure OAuth redirect URIs (optional, used for Instagram):
   - `http://localhost:3000/api/oauth/facebook/callback` (development)
   - `https://yourdomain.com/api/oauth/facebook/callback` (production)
   
   **Note:** Facebook Login now uses the JavaScript SDK (no redirect needed), but these URIs are still required for Instagram OAuth.
5. **Configure Allowed Domains for JavaScript SDK** (REQUIRED):
   - Go to "Facebook Login" → "Settings"
   - Under "Allowed Domains for the JavaScript SDK", add:
     - `localhost` (for development)
     - `yourdomain.com` (for production, e.g., `marketing-bot-pro.vercel.app`)
   - **Important:** Only add the domain (no `http://` or `https://`, no paths)
   - Click "Save Changes"
   
   **Note:** Without this configuration, Facebook JavaScript SDK login will NOT work. This is required for `FB.login()` to function.
6. Add "Instagram Basic Display" and "Instagram Graph API" products (if using Instagram)
7. Request required permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
8. Copy App ID and App Secret to `.env.local`
   - Use the same App ID for both `FACEBOOK_CLIENT_ID` and `NEXT_PUBLIC_FACEBOOK_APP_ID`
   - The App Secret goes in `FACEBOOK_CLIENT_SECRET`

**Note:** Facebook Login now uses the JavaScript SDK (instead of OAuth redirect) for a better user experience. Make sure to set `NEXT_PUBLIC_FACEBOOK_APP_ID` in your environment variables.

### Instagram

Instagram uses Facebook OAuth, so use the same `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`.

1. In your Facebook App, add "Instagram Basic Display" and "Instagram Graph API" products
2. Configure Instagram OAuth redirect URI:
   - `http://localhost:3000/api/oauth/instagram/callback` (development)
   - `https://yourdomain.com/api/oauth/instagram/callback` (production)
3. Request Instagram permissions in your Facebook App settings

**Note:** Instagram requires the account to be a Business or Creator account connected to a Facebook Page.

### Twitter/X

#### Step 1: Create a Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with your Twitter/X account
3. If you don't have a developer account yet, apply for one:
   - Click "Sign up" or "Apply"
   - Fill out the application form explaining your use case
   - Wait for approval (usually takes a few hours to a day)

#### Step 2: Create an App

1. Once approved, go to your [Developer Portal Dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Click "Create Project" or "Create App"
3. Fill in the app details:
   - **App name**: Your application name (e.g., "Marketing Bot Pro")
   - **App description**: Brief description of your app
   - **Website URL**: Your app's website URL
   - **Callback URL**: `http://localhost:3000/api/oauth/twitter/callback` (for development)
   - **Organization name**: Your organization name
4. Review and accept the Twitter Developer Terms
5. Click "Create App"

#### Step 3: Configure OAuth 2.0

1. After creating the app, go to the "Keys and tokens" tab
2. Under "OAuth 2.0 Client ID and Client Secret":
   - **Client ID**: This is your `TWITTER_CLIENT_ID`
   - **Client Secret**: This is your `TWITTER_CLIENT_SECRET` (click "Generate" if not shown)
3. Copy both values - you'll need them for your `.env.local` file

#### Step 4: Configure App Settings

1. Go to the "App settings" tab
2. Under "User authentication settings", click "Set up" or "Edit"
3. Configure the following:
   - **App permissions**: Select "Read and write" (this enables `tweet.read` and `tweet.write`)
   - **Type of App**: Select "Web App, Automated App or Bot"
   - **Callback URI / Redirect URL**: 
     - Development: `http://localhost:3000/api/oauth/twitter/callback`
     - Production: `https://yourdomain.com/api/oauth/twitter/callback`
   - **Website URL**: Your app's website URL
4. **Required OAuth 2.0 scopes**:
   - `tweet.read` - Read tweets from authorized account
   - `tweet.write` - Create and manage tweets
   - `users.read` - Read user profile information
   - `offline.access` - Refresh tokens (for long-lived access)
5. Click "Save"

#### Step 5: Add Environment Variables

Add the following to your `.env.local` file:
```env
TWITTER_CLIENT_ID=your_twitter_client_id_here
TWITTER_CLIENT_SECRET=your_twitter_client_secret_here
```

#### Step 6: For Production/Vercel Deployment

1. Update the callback URL in your Twitter app settings to your production URL:
   - `https://yourdomain.com/api/oauth/twitter/callback`
2. Add the environment variables to your Vercel project:
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET`
   - Redeploy your application

#### Manual Token Connection

You can also connect Twitter using a manual token:

1. **Generate an Access Token** (alternative to OAuth flow):
   - Go to your Twitter Developer Portal
   - Navigate to your app's "Keys and tokens" tab
   - Under "Access Token and Secret", click "Generate"
   - Copy the generated access token
   
2. **In the App**:
   - Go to Settings page
   - Find Twitter/X section
   - Click "Token" button
   - Paste your access token
   - Click "Validate Token" to verify it works
   - Click "Connect" to save

**Note**: Manual tokens are useful for testing, but for production use, the OAuth flow is recommended as it provides better security and user experience.

### LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. In "Auth" tab, add redirect URLs:
   - `http://localhost:3000/api/oauth/linkedin/callback` (development)
   - `https://yourdomain.com/api/oauth/linkedin/callback` (production)
4. Request required scopes:
   - `openid`
   - `profile`
   - `email`
   - `w_member_social`
5. Copy Client ID and Client Secret to `.env.local`

## Testing

1. Start your development server: `npm run dev`
2. Go to Settings page
3. For Facebook: Click the "Social" button - a Facebook login popup will appear (JavaScript SDK)
4. For other platforms: Click "Connect with [Platform]" - you'll be redirected to OAuth
5. Complete the login flow
6. You should see "Connected" status after successful authentication

**Note:** Facebook uses the JavaScript SDK (popup), while Instagram, Twitter, and LinkedIn use OAuth redirect flows.

## Troubleshooting

### "OAuth not configured" error
- Make sure environment variables are set in `.env.local`
- Restart your development server after adding environment variables

### Redirect URI mismatch
- Ensure redirect URIs in your platform app settings exactly match the ones in your environment variables
- Check for trailing slashes or HTTP vs HTTPS mismatches

### Token retrieval failed
- Check browser console for errors
- Verify OAuth callback completed successfully
- Check that cookies are enabled in your browser

### Instagram connection fails
- Ensure the Instagram account is a Business or Creator account
- Verify the account is connected to a Facebook Page
- Check that required Instagram products are added to your Facebook App

### Twitter/X connection fails
- Verify your Twitter Developer account is approved and active
- Check that OAuth 2.0 is enabled in your app settings
- Ensure callback URLs match exactly (including protocol: http vs https)
- Verify the required scopes (`tweet.read`, `tweet.write`, `users.read`, `offline.access`) are enabled
- Make sure your app has "Read and write" permissions enabled
- Check that `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` are correctly set in environment variables
- For manual token connection, ensure the token has the necessary permissions (tweet.read and tweet.write)
- If using Vercel, make sure environment variables are set and the app is redeployed after adding them
