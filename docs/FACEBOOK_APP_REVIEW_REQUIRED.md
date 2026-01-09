# Facebook App Review Required for user_posts Permission

## The Problem

You're getting this error:
```
Invalid Scopes: user_posts, user_photos. This message is only shown to developers.
```

## Why This Happens

**`user_posts` and `user_photos` permissions require Facebook App Review**, even for Consumer apps.

These are considered "sensitive" permissions that require Facebook to review your app before they can be used.

## What This Means

**You CANNOT use `user_posts` or `user_photos` without going through Facebook's App Review process.**

Even though you have a Consumer app, Facebook still requires review for these permissions.

## What Works Without Review

✅ **These permissions work immediately** (no review needed):
- `public_profile` - Basic profile (name, ID, picture)
- `email` - User email (sometimes works without review)

❌ **These require App Review:**
- `user_posts` - Read personal posts
- `user_photos` - Read personal photos
- `pages_read_engagement` - Read page posts
- `pages_read_user_content` - Read page content

## Your Options

### Option 1: Submit Your App for Review (Recommended if you need personal posts)

To get `user_posts` and `user_photos` permissions:

1. **Prepare your app:**
   - Complete your app setup
   - Have a working app that demonstrates your use case
   - Create a privacy policy URL
   - Add an app icon

2. **Go to App Review:**
   - Go to: https://developers.facebook.com/apps/[YOUR_APP_ID]/app-review/
   - Click **"Permissions and Features"**
   - Find **"user_posts"** and click **"Request"** or **"Add Details"**

3. **Provide information:**
   - Explain why you need this permission
   - Provide a video/screenshots showing how you use it
   - Explain how it benefits users
   - Provide test credentials if needed

4. **Wait for review:**
   - Facebook reviews apps (can take days to weeks)
   - They may ask for additional information
   - Once approved, the permission becomes available

5. **After approval:**
   - Update your code to request `user_posts` and `user_photos`
   - Users will now be able to grant these permissions

### Option 2: Use Page Posts Instead (If applicable)

If your posts are on **Facebook Pages** (business pages) instead of personal profiles:

1. Use page permissions instead:
   - `pages_read_engagement` - Read page posts
   - `pages_read_user_content` - Read page content
   - These ALSO require App Review, but might be easier to get approved

2. Update your code to scan pages instead of personal posts

### Option 3: Use Basic Profile Only (Limited Functionality)

For now, you can use just `public_profile`:
- ✅ Users can log in
- ✅ You get basic profile info
- ❌ You CANNOT read posts
- ❌ Scanning won't work

**This is not useful for your use case** (scanning posts), but it gets the login working.

## Current Status

**Right now, your app:**
- ✅ Can connect to Facebook (using `public_profile`)
- ✅ Gets basic profile information
- ❌ **CANNOT** read personal posts (needs App Review)
- ❌ **CANNOT** scan posts (needs App Review)

## Next Steps

**If you need personal posts (which you do):**

1. **Submit your app for Facebook App Review**
   - Go to: https://developers.facebook.com/apps/[YOUR_APP_ID]/app-review/
   - Request `user_posts` and `user_photos` permissions
   - Provide detailed use case information
   - Wait for approval

2. **After approval:**
   - Update the code to request `user_posts` and `user_photos`
   - Reconnect accounts
   - Scanning will work!

**If you want to test with Page posts instead:**
- Request `pages_read_engagement` and `pages_read_user_content` in App Review
- Update code to scan pages instead of personal posts

## Summary

- ❌ `user_posts` and `user_photos` **require Facebook App Review**
- ✅ You need to submit your app for review to get these permissions
- ✅ The review process takes time (days to weeks)
- ✅ Once approved, you can use these permissions
- ✅ There's no way around this - it's Facebook's policy

**You cannot use `user_posts` or `user_photos` without App Review approval.**
