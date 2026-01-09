# Facebook Post Permissions - Pages vs Personal Profile

## Understanding the Difference

There are TWO types of posts on Facebook:

### 1. **Personal Profile Posts**
- Posts on your personal Facebook profile
- Need permission: `user_posts`
- API endpoint: `/me/posts`

### 2. **Page Posts** (Business Pages)
- Posts on Facebook Pages (business pages)
- Need permissions: `pages_read_engagement`, `pages_read_user_content`, `pages_show_list`
- API endpoint: `/page-id/posts`

## Which One Do You Need?

**Most businesses post on Pages, not personal profiles!**

If your posts are on a **Facebook Page** (business page):
- You DON'T need `user_posts`
- You DO need `pages_read_engagement` and `pages_read_user_content`
- The scanning code already tries pages as a fallback

## What Permissions to Use

### For Page Posts (Most Common):
```env
# Use Business login with page permissions
FACEBOOK_LOGIN_CONFIG_ID=your_config_id
# OR use Consumer login with page permissions
scope=public_profile,pages_show_list,pages_read_engagement,pages_read_user_content
```

### For Personal Profile Posts (Less Common):
```env
# Use Consumer login with personal permissions
# Remove config_id to use Consumer mode
# FACEBOOK_LOGIN_CONFIG_ID=
scope=public_profile,user_posts,user_photos
```

## The Scanning Code

The scanning code I updated tries BOTH:
1. First tries `/me/posts` (personal posts) - needs `user_posts`
2. Then tries `/me/accounts` → `/page-id/posts` (page posts) - needs `pages_read_engagement`

So it handles both cases!

## What Should You Use?

**Question: Where are your posts?**
- On a **Facebook Page**? → Use page permissions
- On your **personal profile**? → Use user_posts

**Most likely: You're posting on a Page, so use page permissions!**
