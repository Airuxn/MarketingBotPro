# Social Media API Limits Summary

This document summarizes the free tier limits and paid options for all social media APIs used in the application.

## Key Difference: Shared vs Per-User Limits

**CRITICAL:** Twitter free tier uses **SHARED limits** (single API quota for all customers), while Facebook, Instagram, and LinkedIn use **per-user limits** (each customer has their own quota).

---

## Twitter/X API

### Free Tier
- **Cost:** Free
- **Limit Type:** **SHARED across ALL customers** (single API key)
- **Rate Limit:** 1 request per 15 minutes per user
- **Monthly Limit:** **100 posts per month TOTAL** (shared)
- **Customer Capacity:** ~20 customers max (20 × 5 tweets = 100 posts/month)
- **Scanning Strategy:** 30-day cache, 5 tweets per scan, 1 scan per month per customer
- **Paid Options:** Yes
  - **Basic Tier:** $200/month ($175/month annual)
    - ~15,000 posts per month
    - Supports ~300 customers with daily scans (300 × 25 tweets/day × 30 days)
  - **Pro Tier:** $5,000/month
    - ~1 million posts per month
    - Supports thousands of customers

### Summary
- **Free tier is very limited** due to shared quota
- **Best for:** Testing, small deployments (<20 customers)
- **For production:** Consider Basic tier ($200/month) or make Twitter a paid feature

---

## Facebook Graph API

### Free Tier
- **Cost:** Free
- **Limit Type:** **Per-user access token** (each customer has their own quota)
- **Rate Limit:** ~200 calls per hour per user access token
- **Monthly Limit:** None (only hourly rate limit)
- **Customer Capacity:** **Unlimited** (each customer has their own token)
- **Scanning Strategy:** 1-hour cache, ~50 posts per scan
- **Paid Options:** No official paid tier
  - API is free with rate limits
  - Third-party services may offer paid aggregation services

### Summary
- **Free tier is very generous** - per-user limits mean no shared quota
- **Best for:** Production use (no customer limit)
- **No paid tier needed** - free tier works well for most use cases

---

## Instagram Graph API

### Free Tier
- **Cost:** Free
- **Limit Type:** **Per-user access token** (each customer has their own quota)
- **Rate Limit:** ~200 requests per hour per user access token
- **Specific Limits:** 
  - Comment writes: 60 per hour per user
- **Monthly Limit:** None (only hourly rate limit)
- **Customer Capacity:** **Unlimited** (each customer has their own token)
- **Requirements:** Instagram Business or Creator account linked to Facebook Page
- **Scanning Strategy:** 1-hour cache, ~100 posts per scan
- **Paid Options:** No official paid tier
  - API is free with rate limits
  - Third-party services may offer paid aggregation services

### Summary
- **Free tier is very generous** - per-user limits mean no shared quota
- **Best for:** Production use (no customer limit)
- **No paid tier needed** - free tier works well for most use cases
- **Note:** Requires Business/Creator account (not personal accounts)

---

## LinkedIn API

### Free Tier
- **Cost:** Free
- **Limit Type:** **Per-application** (but tokens are per-user)
- **Rate Limit:** Up to **100,000 calls per day per application**
- **Monthly Limit:** None (only daily rate limit)
- **Customer Capacity:** **Very high** (100K calls/day ÷ 30 days = ~3,333 calls/day)
  - With 1-hour cache: ~1 scan per customer per hour = 24 scans/day per customer
  - 100K calls/day ÷ 24 scans = ~4,166 customers max per day
- **Scanning Strategy:** 1-hour cache
- **Paid Options:** No official paid tier for standard API
  - API is free with rate limits
  - **LinkedIn Sales Navigator** ($99-$165/month per user): Enhanced features, not higher API limits
  - Third-party services may offer paid aggregation services

### Summary
- **Free tier is extremely generous** - 100K calls/day per application
- **Best for:** Production use (supports thousands of customers)
- **No paid tier needed** - free tier works well for most use cases

---

## Comparison Table

| Platform | Free Tier Limit Type | Rate Limit | Monthly Limit | Customer Capacity (Free) | Paid Tier Available? |
|----------|---------------------|------------|---------------|-------------------------|---------------------|
| **Twitter/X** | **SHARED** (all customers) | 1 req/15min | **100 posts/month** | ~20 customers | Yes ($200-$5000/month) |
| **Facebook** | Per-user token | ~200 req/hour | None | **Unlimited** | No |
| **Instagram** | Per-user token | ~200 req/hour | None | **Unlimited** | No |
| **LinkedIn** | Per-application | 100K calls/day | None | **~4,000+ customers** | No (Sales Navigator optional) |

---

## Recommendations

### For Free Tier Deployment:
1. **Twitter:** Limit to 20 customers max (shared quota)
2. **Facebook/Instagram/LinkedIn:** No customer limit needed (per-user/per-app limits)

### For Paid Features:
1. **Twitter:** Make Twitter features paid to cover API costs ($200/month Basic tier)
   - Can support 300+ customers with daily scans
2. **Facebook/Instagram/LinkedIn:** No paid API needed
   - Free tier is sufficient for production use
   - May consider making premium features paid (AI analysis, advanced analytics, etc.)

### For Scaling:
1. **Twitter:** Upgrade to Basic tier ($200/month) when you have >20 customers
2. **Facebook/Instagram/LinkedIn:** Free tier scales well, no upgrade needed
3. **Consider:** Making Twitter a paid feature, Facebook/Instagram/LinkedIn can remain free

---

## Current Implementation

- **Twitter:** 30-day cache, 5 tweets per scan (optimized for free tier)
- **Facebook:** 1-hour cache, ~50 posts per scan
- **Instagram:** 1-hour cache, ~100 posts per scan
- **LinkedIn:** 1-hour cache (no explicit limit in code)

All platforms use per-user access tokens except Twitter (which uses shared API key for free tier).
