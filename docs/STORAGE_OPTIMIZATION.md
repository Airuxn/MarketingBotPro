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
| **Scanned Posts** | 35 | ~1KB (text) + images | ~2.2MB | Text only, newest 14 keep images. See [SCANNING_BEHAVIOR.md](SCANNING_BEHAVIOR.md) for details |
| **Accepted Content** | 30 | ~2KB | ~60KB | AI learning data |
| **Edits** | 35 | ~3KB | ~105KB | AI learning data with weighted voting |
| **Settings/Other** | - | - | ~100KB | API keys, preferences, etc. |
| **Total Estimated** | - | - | **~5.0MB** | Fits within 5MB localStorage limit (100 learning inputs total: 35 scanned + 35 edits + 30 accepted) |

## Free-Tier API Considerations

### Twitter/X Free Tier (SHARED LIMITS - Critical!)
- **Rate Limit:** 1 request per 15 minutes per user
- **Monthly Limit:** 100 posts per month total (SHARED across ALL customers using your API key!)
- **Posts per Request:** 5 tweets (optimized for customer capacity)
- **Customer Capacity Calculation:**
  - **Recommended: 20 customers max**
  - 20 customers × 5 tweets/scan × 1 scan/month = 100 posts/month ✅
  - Alternative: 10 customers × 10 tweets/scan × 1 scan/month = 100 posts/month ✅
  - Alternative: 25 customers × 4 tweets/scan × 1 scan/month = 100 posts/month ✅
- **Scanning Strategy:** 
  - 30-day cache per customer (prevents exceeding shared monthly limit)
  - Each customer can scan once per month max
  - 5 tweets per scan per customer
  - **Storage Impact:** ~35 scanned posts kept per customer (optimized to 35 total, but only ~5 new per month per customer)

### Facebook/Instagram Free Tier
- **Rate Limit:** ~200 requests per hour per user access token
- **Limit Type:** **Per-user access token** (each customer has their own quota - NO shared limit!)
- **Monthly Limit:** None (only hourly rate limit)
- **Customer Capacity:** **Unlimited** (each customer has their own token)
- **Scanning Strategy:** 
  - 1-hour cache (can scan more frequently than Twitter)
  - 10 posts per scan (Facebook, Instagram, LinkedIn)
  - Can scan multiple times per day (within hourly rate limit)
  - **Storage Impact:** ~20 scanned posts kept total (optimized for free-tier, scans more frequently)
- **Paid Options:** No official paid tier (API is free with rate limits)

### LinkedIn Free Tier
- **Rate Limit:** Up to 100,000 calls per day per application
- **Limit Type:** **Per-application** (very generous, supports thousands of customers)
- **Monthly Limit:** None (only daily rate limit)
- **Customer Capacity:** **~4,000+ customers** (100K calls/day ÷ 24 scans/day = ~4,166 customers)
- **Scanning Strategy:** 
  - 1-hour cache (can scan frequently)
  - 10 posts per scan (`count=10`)
  - **Storage Impact:** ~20 scanned posts kept total (optimized for free-tier)
- **Paid Options:** No official paid tier for standard API (API is free with rate limits)

## Why These Limits?

### 1. localStorage Constraints
- Browser localStorage: ~5-10MB per origin (varies by browser)
- **Browser-specific limits:**
  - **Brave/Chrome/Edge/Firefox/Opera:** ~10MB per origin
  - **Safari/Samsung Internet:** ~5MB per origin
- **Detection method:** Browser detection (not testing) - uses known browser limits
- Each customer uses their own browser (separate localStorage)
- **Target:** ~5.0MB per customer (works across all browsers, optimized for 100 learning inputs: 35 scanned + 35 edits + 30 accepted)
- **Display:** Settings page shows detected browser and its standard localStorage limit

### 2. Free-Tier API Limits
- **Twitter:** Very strict (1 req/15min, 100 posts/month TOTAL **SHARED** across all customers)
  - **Realistic usage:** 1 scan per month per customer (to stay within shared limit)
  - **Result:** ~5 new posts per month per customer (with 20 customers max)
- **Facebook/Instagram:** Per-user limits (each customer has their own quota - NO shared limit!)
  - **Realistic usage:** Multiple scans per day per customer (within hourly rate limit)
  - **Result:** Can scan frequently, no customer limit needed
- **LinkedIn:** Per-application limit (100K calls/day - very generous)
  - **Realistic usage:** Multiple scans per day per customer
  - **Result:** Can support thousands of customers

### 3. Storage Priority
- **High Priority:** Scanned posts (learning data), brand images (UI library)
- **Medium Priority:** Posts (user content), edits (learning data)
- **Low Priority:** Leads, contact lists

## Optimization Strategies

### Image Storage
- **Brand Images:** Stored as URLs (original social media URLs) - saves ~150KB per image
- **Scanned Posts:** Only newest 14 keep images, older posts remove images
- **Result:** Max ~2.1MB for images (vs 7-10MB if all stored)

### Automatic Cleanup
- Oldest items removed first when limits exceeded
- **Posts:** Drafts removed before posted/scheduled posts
- **Scanned Posts:** Images removed from older posts first
- **All data:** Sorted by date (newest first)

### Smart Caching
- **Twitter:** 30-day cache per customer (prevents exceeding shared monthly limit of 100 posts)
- **Other platforms:** 1-hour cache (standard)
- **Result:** Reduced API calls, stays within shared monthly limits

## Storage Breakdown per Customer (Estimated)

```
Posts:           50 × 2KB    = 100KB
Leads:           50 × 0.5KB  = 25KB
Contact Lists:   20 × 5KB    = 100KB
Email Campaigns: 30 × 3KB    = 90KB
Brand Images:    20 × 150KB  = 3MB (URLs, not full images)
Scanned Posts:   35 × 1KB    = 35KB (text)
Scanned Images:  14 × 150KB  = 2.1MB (newest 14 only)
Accepted:        30 × 2KB    = 60KB
Edits:           35 × 3KB    = 105KB
Settings:        -            = 100KB
─────────────────────────────────────
Total:                        ~5.0MB
```

## For 20 Customers (Recommended for Free-Tier APIs)

Each customer uses their own browser (separate localStorage):
- **Per customer:** ~5.0MB
- **Total storage:** 20 × 5.0MB = 100MB (distributed across 20 browsers)
- **No server storage required** - all data in customer browsers
- **No cost** - localStorage is free

### Free-Tier API Capacity (Shared Limits - Critical!)
**IMPORTANT:** Free-tier API limits are SHARED across ALL customers using your API key!

- **Twitter:** 
  - 100 posts per month TOTAL (shared across all customers)
  - **Recommended: 20 customers max**
  - 20 customers × 5 tweets/scan × 1 scan/month = 100 posts/month ✅
  - Each customer can scan once per month (30-day cache)
  - Alternative: 10 customers × 10 tweets/scan × 1 scan/month = 100 posts/month ✅
  - Alternative: 25 customers × 4 tweets/scan × 1 scan/month = 100 posts/month ✅
- **Facebook/Instagram:** More generous, can support more customers
- **LinkedIn:** Similar to Facebook
- **Recommendation:** Start with 20 customers on free tier, upgrade to paid APIs when you need more capacity

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
   - **Twitter free tier:** Max 20 customers (100 posts/month shared limit)
   - **Options to support more customers:**
     - Upgrade Twitter API to Basic tier ($200/month): 15K posts/month = ~300 customers
     - Upgrade Twitter API to Pro tier ($5000/month): 1M posts/month = ~20,000 customers
     - Reduce tweets per scan: 25 customers × 4 tweets = 100 posts/month ✅
     - Or implement server-side storage and API key management per customer (requires backend)
