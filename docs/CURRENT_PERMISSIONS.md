# Current Facebook Permissions - What Data Can Be Accessed

## Current Configuration

You're using **Facebook Login for Business** with a Login Configuration (config_id: 2310982732753378).

Based on your Login Configuration, it currently has:
- `public_profile` - Basic profile information
- `pages_show_list` - List of your Facebook Pages

## What Data Can Currently Be Accessed

### ✅ **What Works NOW:**

1. **Basic Profile Info** (`public_profile`):
   - Your name
   - Your Facebook user ID
   - Your profile picture

2. **Your Facebook Pages List** (`pages_show_list`):
   - List of Pages you manage
   - Page IDs and names

### ❌ **What Does NOT Work (Missing Permissions):**

1. **Page Posts** - CANNOT read page posts (needs `pages_read_engagement` or `pages_read_user_content`)
2. **Personal Posts** - CANNOT read personal profile posts (needs `user_posts`)
3. **Page Content** - CANNOT read page content details (needs `pages_read_user_content`)
4. **Images from Posts** - CANNOT extract images from posts (needs post access first)

## What the Scanning Code Tries to Access

The scanning code tries to access:

1. **Personal Posts** (`/me/posts`):
   - Needs: `user_posts` permission
   - **Status: ❌ FAILS** (you don't have this permission)

2. **Page Posts** (`/me/accounts` → `/page-id/posts`):
   - Needs: `pages_read_engagement` or `pages_read_user_content` permission
   - **Status: ❌ FAILS** (you don't have this permission)

## To Get Your Posts, You Need:

### Option 1: Update Login Configuration (Business Login)
Add these permissions to your Login Configuration:
- `pages_read_engagement` - Read page posts
- `pages_read_user_content` - Read page content

### Option 2: Use Consumer Login (Remove config_id)
Remove `FACEBOOK_LOGIN_CONFIG_ID` from `.env.local` and use:
- `pages_show_list` - List pages
- `pages_read_engagement` - Read page posts  
- `pages_read_user_content` - Read page content

## Current Status

**Right now, the app can:**
- ✅ See your basic profile (name, ID, picture)
- ✅ List your Facebook Pages
- ❌ **CANNOT read your posts** (missing permissions)
- ❌ **CANNOT get images from posts** (needs post access)

That's why scanning shows "No accounts connected" or returns no results - it's failing silently because it doesn't have permission to read posts.
