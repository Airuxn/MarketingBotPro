# Try Consumer Login Mode with Existing App

## The Situation

You're using your existing Business app, but we can try **Consumer login mode** by removing the `config_id`. The code automatically switches to Consumer mode when no `config_id` is set.

## Quick Test: Remove config_id

1. **Edit `.env.local`:**
   - Comment out or remove: `FACEBOOK_LOGIN_CONFIG_ID=2310982732753378`
   - Keep your existing App ID and Secret
   - The code will automatically use Consumer login (scope parameter)

2. **Make sure redirect URI is set:**
   - In Facebook Login Settings, add: `http://localhost:3000/api/oauth/facebook/callback`
   - Click "Save Changes"

3. **Restart your server:**
   ```bash
   npm run dev
   ```

4. **Reconnect your account:**
   - Go to Settings page
   - Disconnect Facebook
   - Connect again
   - It should request `user_posts` and `user_photos` permissions

## What Will Happen

- Without `config_id`, the code uses Consumer login mode
- Requests `user_posts` and `user_photos` permissions
- Should be able to scan personal posts

## If This Doesn't Work

If Consumer mode doesn't work with your Business app:
- You'll need to create a new Consumer app
- OR use Business login and scan Pages instead of personal posts

But let's try this first - it might work!
