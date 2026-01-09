# What Data Can Your App Access From Facebook?

## Current Configuration Status

Based on your setup:
- **App ID:** [YOUR_BUSINESS_APP_ID] (Business app)
- **Login Type:** Facebook Login for Business (with config_id) OR Consumer (without config_id)
- **Current .env.local:** No `FACEBOOK_LOGIN_CONFIG_ID` found, so using **Consumer mode**

## What Data the App TRIES to Access

### 1. Basic Profile Info (`public_profile`)
**API Call:** `/me?fields=id,name`
**Status:** ✅ **WORKS**
**Data Retrieved:**
- Your Facebook user ID
- Your name
- Profile picture URL (if available)

### 2. Your Facebook Pages List (`pages_show_list`)
**API Call:** `/me/accounts?fields=id,name,access_token`
**Status:** ✅ **WORKS** (if you have this permission)
**Data Retrieved:**
- List of Facebook Pages you manage
- Page IDs
- Page names
- Page access tokens (for posting to pages)

### 3. Personal Profile Posts (`user_posts`)
**API Call:** `/me/posts?fields=id,message,created_time,attachments,likes,comments,shares`
**Status:** ❌ **FAILS** (you don't have `user_posts` permission)
**Data Tried:**
- Post content (text)
- Post images
- Post engagement (likes, comments, shares)
- Post creation date

### 4. Page Posts (`pages_read_engagement`)
**API Call:** `/me/accounts` → `/page-id/posts?fields=id,message,created_time,attachments,likes,comments,shares`
**Status:** ❌ **FAILS** (you don't have `pages_read_engagement` permission)
**Data Tried:**
- Page post content (text)
- Page post images
- Page post engagement
- Page post creation date

## What Data CAN Be Accessed RIGHT NOW

With your current permissions (assuming `public_profile` and `pages_show_list`):

✅ **Available:**
1. **Basic Profile:**
   - Your Facebook user ID
   - Your name
   - Profile picture

2. **Pages List:**
   - List of Pages you manage
   - Page IDs and names
   - Page access tokens (for posting, not reading)

❌ **NOT Available:**
1. **Your Posts** (both personal and page posts)
2. **Post Images**
3. **Post Engagement Data** (likes, comments, shares)
4. **Post Content** (text, captions)

## Why Scanning Doesn't Work

The scanning code tries to access:
- `/me/posts` - ❌ Fails (no `user_posts` permission)
- `/me/accounts` → `/page-id/posts` - ❌ Fails (no `pages_read_engagement` permission)

So scanning runs but returns **empty results** because it doesn't have permission to read posts!

## To Get Your Posts, You Need

Add these permissions to your Login Configuration (if using Business login):
- `pages_read_engagement` - Read page posts
- `pages_read_user_content` - Read page content

OR remove config_id and use Consumer mode with:
- `pages_show_list` - List pages
- `pages_read_engagement` - Read page posts
- `pages_read_user_content` - Read page content
