# Facebook Login for Business - Available Permissions

## The Issue

You can't select `user_posts` or `user_photos` because **Facebook Login for Business doesn't support personal profile permissions**.

Facebook Login for Business is designed for **business assets** (Pages, Ad Accounts, etc.), NOT personal profiles.

## Available Permissions for Facebook Login for Business

Based on the documentation, these permissions ARE available:

✅ **Page Permissions:**
- `pages_read_engagement` - Read page posts and engagement
- `pages_read_user_content` - Read page content
- `pages_manage_posts` - Post to pages (requires review)
- `pages_show_list` - List user's pages (you have this)

✅ **Instagram Permissions:**
- `instagram_basic` - Basic Instagram access
- `instagram_content_publish` - Post to Instagram

❌ **NOT Available (Personal Profile):**
- `user_posts` - Personal posts (Consumer login only)
- `user_photos` - Personal photos (Consumer login only)

## Solution: Scan Pages Instead of Personal Profile

Since you're using Facebook Login for Business, you need to scan **Facebook Pages** (business pages), not your personal profile.

### Option 1: Update Login Configuration for Page Scanning

1. Go to Facebook Login → Settings → Configurations
2. Edit your configuration
3. Add these permissions (which ARE available):
   - `pages_show_list` (already have)
   - `pages_read_engagement` (add this)
   - `pages_read_user_content` (add this)
   - `public_profile` (keep)
4. Save and get new config_id
5. Reconnect your account
6. The scanning will then scan your Facebook Pages (not personal profile)

### Option 2: Switch to Consumer Login (For Personal Profile)

If you want to scan your personal profile posts:
1. You need to switch from "Facebook Login for Business" to regular "Facebook Login" (Consumer)
2. This requires rolling back (if within 30 days)
3. Consumer login supports `user_posts` and `user_photos`

## Recommendation

For a marketing tool, scanning **Pages** (business pages) makes more sense than personal profiles:
- Pages are for business content
- Pages are what clients manage
- More relevant for marketing insights

So stick with Business login and add `pages_read_engagement` and `pages_read_user_content` permissions.
