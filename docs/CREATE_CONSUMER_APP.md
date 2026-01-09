# Creating a Consumer App for Personal Posts

## The Issue

Facebook's developer interface has changed, and "Consumer" app type might not be explicitly labeled. The app type is often determined by:

1. **The use cases you select** when creating the app
2. **The products you add** after creating the app
3. **The permissions you request**

## Solution: Use Cases That Lead to Personal Post Access

When you see the "Add use cases" page:

1. **Look for use cases related to:**
   - "Facebook Login" or "User Authentication"
   - "User Content Access"
   - "Social Login"
   - "Access user posts/photos"

2. **Try these approaches:**

### Approach 1: Filter by "Content management"
- Click "Content management (5)" filter on the left
- Look for use cases about reading user content
- Select any that mention posts, photos, or user content

### Approach 2: Look for "Others" category
- Click "Others (5)" filter
- Facebook Login might be in this category

### Approach 3: Skip use cases (if possible)
- Some apps let you skip use cases
- Add "Facebook Login" product later
- Configure permissions in Facebook Login settings

### Approach 4: Select "Marketing API" use cases
- Sometimes Marketing API apps can also access user content
- Select "Create & manage ads" or similar
- Then add Facebook Login product separately

## After Selecting Use Cases

1. **Complete the app creation**
2. **Add "Facebook Login" product:**
   - Go to your new app dashboard
   - Click "Add Product"
   - Find "Facebook Login" → "Set Up"
3. **Configure permissions in Facebook Login settings:**
   - Go to Facebook Login → Settings
   - You should be able to request permissions like `user_posts`, `user_photos`
4. **Configure redirect URI:**
   - Add: `http://localhost:3000/api/oauth/facebook/callback`

## Alternative: Check Your Current Business App

Actually, wait - you might be able to add Facebook Login (Consumer) to your existing Business app! Business apps can sometimes have multiple login methods:

1. Check your existing Business app ([YOUR_BUSINESS_APP_ID])
2. See if you can add "Facebook Login" product alongside "Facebook Login for Business"
3. Configure it with `user_posts` and `user_photos` permissions

## Recommendation

**Try Approach 3 first:**
- Skip use cases if possible, or select something general
- Complete app creation
- Add "Facebook Login" product after
- Configure `user_posts` and `user_photos` in Facebook Login settings

If that doesn't work, let me know what options you see and we'll figure it out!
