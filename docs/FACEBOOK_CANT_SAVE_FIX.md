# Can't Save Facebook Redirect URI? Here's the Fix!

## The Issue

Facebook might not let you save `localhost` URLs explicitly because they're automatically allowed in development mode. **That's actually OK!**

The real issue is the **domain error** you got earlier - that needs to be fixed in a different place.

## Fix: Add Domain to "App Domains" (Basic Settings)

1. **Go to Basic Settings:**
   - In the left sidebar, click **"Settings"** → **"Basic"**
   - (NOT "Facebook Login" → "Settings", but the main "Settings" → "Basic")

2. **Add "localhost" to App Domains:**
   - Scroll down to find **"App Domains"**
   - Add: `localhost` (just the word "localhost", no http:// or port)
   - Click **"Save changes"** (this one should save fine!)

3. **The Redirect URI:**
   - If Facebook won't let you save the localhost redirect URI, that's OK!
   - Facebook automatically allows `http://localhost:*` (any port) in development mode
   - The redirect URI should work automatically

4. **Restart your server:**
   ```bash
   npm run dev
   ```

## Try Connecting Now!

After adding `localhost` to App Domains, try connecting again. It should work!

If you still get errors, the redirect URI is working automatically (Facebook handles it), so the domain fix should be enough.
