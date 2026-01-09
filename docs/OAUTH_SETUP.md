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
```

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
4. Configure OAuth redirect URIs:
   - `http://localhost:3000/api/oauth/facebook/callback` (development)
   - `https://yourdomain.com/api/oauth/facebook/callback` (production)
5. Add "Instagram Basic Display" and "Instagram Graph API" products (if using Instagram)
6. Request required permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
7. Copy App ID and App Secret to `.env.local`

### Instagram

Instagram uses Facebook OAuth, so use the same `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`.

1. In your Facebook App, add "Instagram Basic Display" and "Instagram Graph API" products
2. Configure Instagram OAuth redirect URI:
   - `http://localhost:3000/api/oauth/instagram/callback` (development)
   - `https://yourdomain.com/api/oauth/instagram/callback` (production)
3. Request Instagram permissions in your Facebook App settings

**Note:** Instagram requires the account to be a Business or Creator account connected to a Facebook Page.

### Twitter/X

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app or use an existing one
3. Enable OAuth 2.0 in app settings
4. Configure callback URLs:
   - `http://localhost:3000/api/oauth/twitter/callback` (development)
   - `https://yourdomain.com/api/oauth/twitter/callback` (production)
5. Request required scopes:
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access`
6. Copy Client ID and Client Secret to `.env.local`

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
3. Click "Connect with [Platform]" for any platform
4. Complete the OAuth flow
5. You should be redirected back and see "Connected" status

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
