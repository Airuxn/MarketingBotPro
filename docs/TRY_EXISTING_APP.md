# Try Using Existing App Without config_id

## The Idea

Your existing Business app already has Facebook Login. Instead of creating a new app, let's try:

1. **Remove config_id** from `.env.local` (comment it out)
2. The code will then use **scope-based** Consumer login
3. Request `user_posts` and `user_photos` permissions directly
4. Reconnect your account

## What We Did

I've commented out `FACEBOOK_LOGIN_CONFIG_ID` in your `.env.local`. This means:
- The code will use `scope` parameter instead of `config_id`
- It will request `user_posts` and `user_photos` permissions
- This might work even with a Business app!

## Next Steps

1. **Restart your server:**
   ```bash
   npm run dev
   ```

2. **Go to Settings page**
   - Disconnect Facebook (if connected)
   - Click "Connect with Facebook" again

3. **Log in with Facebook**
   - It should request `user_posts` and `user_photos` permissions
   - Approve the permissions

4. **Test scanning:**
   - Go to Content page
   - Scanning should run automatically
   - You should see your personal posts!

## If It Doesn't Work

If Facebook rejects `user_posts` permission (because it's a Business app):
- Then you'll need to create a Consumer app after all
- But it's worth trying this first!

## If It Works

Great! You can scan personal posts with your existing app. No need to create a new app!
