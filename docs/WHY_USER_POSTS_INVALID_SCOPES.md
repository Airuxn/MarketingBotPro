# Why user_posts Shows "Invalid Scopes" Error

## The Error

```
Invalid Scopes: user_posts, user_photos. This message is only shown to developers.
```

## Why This Happens

**Facebook requires App Review for `user_posts` and `user_photos` permissions**, even for Consumer apps.

These permissions are considered "sensitive" because they access personal content. Facebook reviews apps to ensure they comply with privacy policies and use permissions appropriately.

## What You Can Do Right Now

**Nothing - you need App Review approval first.**

There's no way to use `user_posts` or `user_photos` without going through Facebook's App Review process.

## The Solution: App Review

1. **Go to App Review:**
   - https://developers.facebook.com/apps/[YOUR_CONSUMER_APP_ID]/app-review/

2. **Request Permissions:**
   - Click "Permissions and Features"
   - Find "user_posts" and click "Request"
   - Find "user_photos" and click "Request"

3. **Provide Information:**
   - Explain your use case
   - Provide screenshots/video
   - Explain how users benefit

4. **Wait for Approval:**
   - Facebook reviews (can take days/weeks)
   - Once approved, permissions become available

5. **Update Code:**
   - After approval, update code to request these permissions
   - Reconnect accounts
   - Scanning will work!

## Alternative: Page Posts

If your posts are on Facebook Pages:
- Request `pages_read_engagement` instead
- Still requires App Review, but might be easier

## Summary

- ❌ `user_posts` requires App Review (no exceptions)
- ✅ Submit app for review to get access
- ✅ Once approved, permissions work
- ❌ No workaround - it's Facebook policy
