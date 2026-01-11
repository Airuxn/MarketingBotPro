# Storage Optimization for Free-Tier APIs

This document outlines the optimized storage limits for the marketing bot application, designed to work efficiently with free-tier social media APIs and fit within browser localStorage limits (~5MB per customer).

## Storage Limits Summary

### Per-Customer Storage Limits (Optimized for Free-Tier)

| Data Type | Limit | Size Per Item | Total Size | Notes |
|-----------|-------|---------------|------------|-------|
| **Posts** | 50 | ~2KB | ~100KB | Keeps posted/scheduled posts, removes oldest drafts first |
| **Leads** | 50 | ~0.5KB | ~25KB | Small data structures |
| **Contact Lists** | 20 | ~5KB (with contacts) | ~100KB | Can contain many contacts, reduced to save storage |
| **Email Campaigns** | 30 | ~3KB | ~90KB | Email content and metadata |
| **Brand Images** | 20 | ~150KB | ~3MB | Biggest storage item - stored as URLs (not base64) |
| **Scanned Posts** | 20 | ~1KB (text) + images | ~1.2MB | Text only, newest 8 keep images |
| **Accepted Content** | 30 | ~2KB | ~60KB | AI learning data |
| **Rejected Content** | 10 | ~2KB | ~20KB | Just for tracking patterns |
| **Edits** | 20 | ~3KB | ~60KB | AI learning data with weighted voting |
| **Settings/Other** | - | - | ~100KB | API keys, preferences, etc. |
| **Total Estimated** | - | - | **~4.8MB** | Fits within 5MB localStorage limit |

## Free-Tier API Considerations

### Twitter/X Free Tier
- **Rate Limit:** 1 request per 15 minutes per user
- **Posts per Request:** Max 100 tweets
- **Monthly Limit:** 15,000 posts per month total
- **Scanning Strategy:** 
  - 24-hour cache (prevents excessive API calls)
  - Max 1-2 scans per day realistically
  - ~20-40 tweets per day per customer
  - **Storage Impact:** ~20 scanned posts per month (optimized to 20 total)

### Facebook/Instagram Free Tier
- More generous rate limits than Twitter
- Similar scanning strategy (24-hour cache)
- **Storage Impact:** ~20-30 scanned posts per month

### LinkedIn Free Tier
- Similar to Facebook
- **Storage Impact:** ~20-30 scanned posts per month

## Why These Limits?

### 1. localStorage Constraints
- Browser localStorage: ~5-10MB per origin
- **Safe limit:** 5MB to work across all browsers
- Each customer uses their own browser (separate localStorage)
- **Target:** ~4.8MB per customer (leaves 200KB buffer)

### 2. Free-Tier API Limits
- **Twitter:** Very strict (1 req/15min, 15K posts/month)
- **Other platforms:** More generous but still rate-limited
- **Realistic usage:** 1-2 scans per day per platform max
- **Result:** ~20-40 new posts per day per customer

### 3. Storage Priority
- **High Priority:** Scanned posts (learning data), brand images (UI library)
- **Medium Priority:** Posts (user content), edits (learning data)
- **Low Priority:** Leads, contact lists, rejected content

## Optimization Strategies

### Image Storage
- **Brand Images:** Stored as URLs (original social media URLs) - saves ~150KB per image
- **Scanned Posts:** Only newest 8 keep images, older posts remove images
- **Result:** Max ~1.2MB for images (vs 7-10MB if all stored)

### Automatic Cleanup
- Oldest items removed first when limits exceeded
- **Posts:** Drafts removed before posted/scheduled posts
- **Scanned Posts:** Images removed from older posts first
- **All data:** Sorted by date (newest first)

### Smart Caching
- **Twitter:** 24-hour cache (prevents rate limit issues)
- **Other platforms:** 1-hour cache (standard)
- **Result:** Reduced API calls, less data to store

## Storage Breakdown per Customer (Estimated)

```
Posts:           50 × 2KB    = 100KB
Leads:           50 × 0.5KB  = 25KB
Contact Lists:   20 × 5KB    = 100KB
Email Campaigns: 30 × 3KB    = 90KB
Brand Images:    20 × 150KB  = 3MB (URLs, not full images)
Scanned Posts:   20 × 1KB    = 20KB (text)
Scanned Images:  8 × 150KB   = 1.2MB (newest 8 only)
Accepted:        30 × 2KB    = 60KB
Rejected:        10 × 2KB    = 20KB
Edits:           20 × 3KB    = 60KB
Settings:        -            = 100KB
─────────────────────────────────────
Total:                        ~4.8MB
```

## For 20 Customers

Each customer uses their own browser (separate localStorage):
- **Per customer:** ~4.8MB
- **Total storage:** 20 × 4.8MB = 96MB (distributed across 20 browsers)
- **No server storage required** - all data in customer browsers
- **No cost** - localStorage is free

## When Limits Are Reached

### Automatic Cleanup
1. Oldest items removed first
2. Images removed before text
3. Drafts removed before posted content
4. User notified (one-time toast notification)

### Manual Cleanup
- Users can export data to JSON file
- Users can manually delete old posts/leads/campaigns
- Brand image library: Old images automatically removed

## Migration Notes

If you have existing customers with larger datasets:
- Automatic cleanup will run on next save
- Oldest data removed gradually (not all at once)
- No data loss: `learnedStyle` (aggregated preferences) preserved
- Backups available: Users can export before cleanup

## Recommendations

1. **For customers near limits:**
   - Encourage regular exports (backup)
   - Explain that old data is removed to keep app fast
   - `learnedStyle` (AI preferences) never deleted

2. **For new customers:**
   - These limits are already in place
   - No migration needed

3. **For scaling beyond 20 customers:**
   - Current limits work for up to ~50 customers
   - If needed, can reduce limits further (e.g., 15 posts, 10 brand images)
   - Or implement server-side storage (requires backend)
