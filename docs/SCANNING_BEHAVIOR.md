# Scanning Behavior - How Posts Are Scanned and Stored

This document explains exactly how the app scans social media posts and stores them, including image handling and deduplication.

## How Scanning Works

### Important: The app scans only what it needs, then stores a limited amount

**Key Points:**
1. **Scans only recent posts** (not all posts, then filter)
2. **Deduplicates** - Won't re-scan posts that were already scanned
3. **Stores limited amount** - Keeps only last 35 scanned posts total
4. **Image optimization** - Keeps images only for newest 14 posts

---

## Platform-Specific Scanning

### Twitter/X

**What gets scanned:**
- **Only 5 tweets** per scan (not 100, then save 5)
- Uses `max_results=5` in API call
- Scans the **most recent 5 tweets** (excluding replies and retweets)
- Gets images from those 5 tweets

**Image handling:**
- All 5 scanned tweets keep their images initially
- When storing, if total scanned posts > 35, only newest 14 keep images
- Older posts have images removed to save storage

**Deduplication:**
- Checks if tweet ID already exists in stored scanned posts
- If exists, skips it (won't re-scan)
- Only new tweets are added

**Example:**
```
Scan 1: Gets tweets [A, B, C, D, E] → Stores all 5 with images
Scan 2 (next month): Gets tweets [A, B, F, G, H] → Only stores [F, G, H] (A, B already exist)
Result: Total stored = 8 posts (A, B, C, D, E, F, G, H)
```

---

### Facebook

**What gets scanned:**
- **Up to 10 posts** per scan for personal posts (`limit=10`)
- **Up to 10 posts** per page for page posts (`limit=10`)
- Scans the **most recent 10 posts** from API
- Gets images from all scanned posts

**Image handling:**
- All scanned posts keep their images initially
- When storing, if total scanned posts > 35, only newest 14 keep images
- Older posts have images removed to save storage

**Deduplication:**
- Checks if post ID already exists in stored scanned posts
- If exists, skips it (won't re-scan)
- Only new posts are added

**Example:**
```
Scan 1: Gets 10 posts [A-J] → Stores all 10 with images
Scan 2 (next hour): Gets 10 posts [A-J, K-T] → Only stores [K-T] (A-J already exist)
Result: Total stored = 35 posts (newest 35 from all scans), images only for newest 14
```

---

### Instagram

**What gets scanned:**
- **Up to 10 posts** per scan (`limit=10`)
- Scans the **most recent 10 media items** from API
- Gets images from all scanned posts (media_url or thumbnail_url)

**Image handling:**
- All scanned posts keep their images initially
- When storing, if total scanned posts > 35, only newest 14 keep images
- Older posts have images removed to save storage

**Deduplication:**
- Checks if media ID already exists in stored scanned posts
- If exists, skips it (won't re-scan)
- Only new posts are added

**Example:**
```
Scan 1: Gets 10 posts [A-J] → Stores all 10 with images
Scan 2 (next hour): Gets 10 posts [A-J, K-T] → Only stores [K-T] (A-J already exist)
Result: Total stored = 35 posts (newest 35 from all scans), images only for newest 14
```

---

### LinkedIn

**What gets scanned:**
- **Up to 10 posts** per scan (`count=10`)
- Scans the **most recent 10 posts** from API
- Gets images from all scanned posts

**Image handling:**
- All scanned posts keep their images initially
- When storing, if total scanned posts > 35, only newest 14 keep images
- Older posts have images removed to save storage

**Deduplication:**
- Checks if post ID already exists in stored scanned posts
- If exists, skips it (won't re-scan)
- Only new posts are added

**Example:**
```
Scan 1: Gets 10 posts [A-J] → Stores all 10 with images
Scan 2 (next hour): Gets 10 posts [A-J, K-T] → Only stores [K-T] (A-J already exist)
Result: Total stored = 35 posts (newest 35 from all scans), images only for newest 14
```

---

## Storage Limits (After Scanning)

Regardless of how many posts are scanned, the app stores:

| Item | Limit | Notes |
|------|-------|-------|
| **Total Scanned Posts** | 35 | Across all platforms combined |
| **Images Kept** | Newest 14 posts only | Older posts have images removed |
| **Storage Strategy** | Newest first | Oldest posts removed when limit exceeded |

**How it works:**
1. Scan returns N posts (varies by platform)
2. Merge with existing scanned posts (deduplicate by ID)
3. Sort by date (newest first)
4. Keep only last 35 posts
5. Remove images from posts older than newest 14

---

## Deduplication Logic

**How duplicates are prevented:**

```typescript
// From content/page.tsx line 323-328
const existingScannedPosts = settings.contentPreferences?.scannedPosts || []
const allScannedPosts = [...scannedPosts, ...existingScannedPosts]
const uniqueScannedPosts = allScannedPosts.filter((post, idx, self) =>
  idx === self.findIndex(p => p.id === post.id && p.platform === post.platform)
)
```

**What this means:**
- Checks both `post.id` AND `post.platform`
- If same ID exists for same platform, it's a duplicate
- Only the first occurrence is kept (newest first after sorting)
- **Result:** Same post won't be stored twice, even if scanned multiple times

---

## Image Storage Details

### How Many Images Are Scanned?

| Platform | Posts Scanned | Images Per Post | Total Images Scanned |
|----------|---------------|-----------------|---------------------|
| **Twitter** | 5 tweets | 0-4 images each | Up to 20 images |
| **Facebook** | 10 posts | 0-10 images each | Up to 100 images |
| **Instagram** | 10 posts | 1 image each | Up to 10 images |
| **LinkedIn** | 10 posts | 0-5 images each | Up to 50 images |

### How Many Images Are Stored?

**After scanning:**
- All scanned posts keep their images initially

**After storage optimization:**
- **Newest 14 posts:** Keep all images
- **Posts 15-35:** Images removed (saves ~3.1MB storage)
- **Total images stored:** ~14-56 images (depending on how many images per post)

**Storage impact:**
- Images are stored as URLs (not base64), so ~150KB per image
- 14 posts × 4 images max = 56 images × 150KB = ~8.4MB (worst case)
- But typically: 14 posts × 1-2 images = 14-28 images × 150KB = ~2.1-4.2MB

---

## Scanning Frequency

### Twitter
- **Cache:** 30 days per customer
- **Rate limit:** 1 request per 15 minutes
- **Result:** Scans once per month per customer max
- **New posts per scan:** Up to 5 tweets

### Facebook/Instagram/LinkedIn
- **Cache:** 1 hour
- **Rate limit:** Per-user limits (very generous)
- **Result:** Can scan multiple times per day
- **New posts per scan:** Varies (50-100 posts)

---

## Summary

**To answer your questions:**

1. **Does it scan 100 and save 5, or only scan 5?**
   - **Twitter:** Only scans 5 (not 100)
   - **Facebook:** Scans 10, stores up to 35 total
   - **Instagram:** Scans 10, stores up to 35 total
   - **LinkedIn:** Scans 10, stores up to 35 total

2. **Does it scan the last images or not?**
   - Yes, scans images from all scanned posts
   - But only keeps images for newest 14 posts after storage optimization

3. **If already scanned once, does it scan again?**
   - No, deduplication prevents re-scanning same posts
   - Checks by post ID + platform
   - Only new posts are added

4. **How many images are scanned?**
   - **Twitter:** Up to 20 images (5 tweets × 4 images max)
   - **Facebook:** Up to 100 images (10 posts × 10 images max)
   - **Instagram:** Up to 10 images (10 posts × 1 image each)
   - **LinkedIn:** Up to 50 images (10 posts × 5 images max)

5. **How many images are stored?**
   - **Newest 14 posts:** All images kept
   - **Posts 15-35:** Images removed
   - **Total:** ~14-56 images stored (typically ~2.1-4.2MB)
