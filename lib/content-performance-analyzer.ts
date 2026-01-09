/**
 * Content Performance Analyzer
 * Analyzes post performance data to identify patterns and generate insights
 * for optimizing future content creation
 */

import { Post } from './store'
import { StyleAnalysis } from './content-analyzer'

export interface PerformanceInsight {
  bestPostingTimes: Array<{ hour: number; day: string; avgEngagement: number }>
  bestContentTypes: Array<{ type: string; avgViews: number; avgEngagement: number }>
  bestHashtags: Array<{ tag: string; avgViews: number; usageCount: number }>
  bestPlatforms: Array<{ platform: string; avgReach: number; avgEngagement: number }>
  contentLengthOptimal: { min: number; max: number; avgEngagement: number }
  mediaImpact: { withMedia: { avgViews: number }; withoutMedia: { avgViews: number } }
  topPerformingPosts: Post[]
  recommendations: string[]
}

// Scanned post type from contentPreferences
export interface ScannedPost {
  id: string
  platform: string
  content: string
  images?: string[]
  createdAt: string
  engagement?: {
    likes?: number
    comments?: number
    shares?: number
  }
  styleAnalysis?: {
    tone: string[]
    structure: string[]
    commonPhrases: string[]
    hashtagStyle: string[]
    callToAction: string[]
    length: { min: number; max: number; average: number }
    emojiUsage: boolean
    formatting: string[]
  }
}

/**
 * Convert scanned posts to Post format for analysis
 */
function convertScannedPostToPost(scannedPost: ScannedPost): Post {
  // Extract hashtags from content
  const hashtagMatches = scannedPost.content.match(/#\w+/g) || []
  const hashtags = hashtagMatches.map(tag => tag.replace('#', ''))
  
  // Determine content type based on images
  const hasMedia = scannedPost.images && scannedPost.images.length > 0
  const contentType = hasMedia 
    ? (scannedPost.images!.length > 1 ? 'carousel' : 'image')
    : 'text'
  
  // Estimate views and reach from engagement (if available)
  // Use a multiplier: typically views are 10-50x likes, reach is 2-5x views
  const likes = scannedPost.engagement?.likes || 0
  const comments = scannedPost.engagement?.comments || 0
  const shares = scannedPost.engagement?.shares || 0
  const totalEngagements = likes + comments + shares
  
  // Estimate views: if we have engagements, estimate views as 20x likes (conservative)
  // If no engagements, set to 0
  const estimatedViews = totalEngagements > 0 ? Math.max(likes * 20, totalEngagements * 10) : 0
  
  // Estimate reach: typically 2-3x views for organic posts
  const estimatedReach = estimatedViews > 0 ? Math.round(estimatedViews * 2.5) : 0
  
  return {
    id: scannedPost.id,
    content: scannedPost.content,
    platform: scannedPost.platform as Post['platform'],
    status: 'posted', // Scanned posts are already posted
    createdAt: scannedPost.createdAt,
    postedAt: scannedPost.createdAt, // Use createdAt as postedAt
    hasMedia: hasMedia ?? false,
    contentType: contentType as Post['contentType'],
    hashtags: hashtags.length > 0 ? hashtags : undefined,
    engagement: {
      views: estimatedViews,
      likes: likes,
      comments: comments,
      shares: shares,
      reach: estimatedReach,
      lastUpdated: scannedPost.createdAt,
    },
    // Add media info if images exist
    media: hasMedia && scannedPost.images ? {
      file: scannedPost.images[0], // Use first image
      type: 'image' as const,
    } : undefined,
  }
}

export interface PostPerformance {
  post: Post
  engagementRate: number
  reachRate: number
  score: number // Overall performance score
}

/**
 * Calculate engagement rate for a post
 */
export function calculateEngagementRate(post: Post): number {
  if (!post.engagement) return 0
  
  const { likes = 0, comments = 0, shares = 0, reach = 0, views = 0 } = post.engagement
  const totalEngagements = likes + comments + shares
  
  // If we have reach, use it (most accurate)
  if (reach > 0) {
    return (totalEngagements / reach) * 100
  }
  
  // If no reach but we have views, estimate engagement rate from views
  // Typical engagement rate is 1-5% of views
  if (views > 0) {
    return (totalEngagements / views) * 100
  }
  
  // If we only have engagements but no reach/views, we can't calculate a meaningful rate
  // Return 0 to indicate insufficient data
  return 0
}

/**
 * Calculate overall performance score (0-100)
 */
export function calculatePerformanceScore(post: Post): number {
  if (!post.engagement) return 0
  
  const { views = 0, likes = 0, comments = 0, shares = 0, reach = 0 } = post.engagement
  
  // Weighted scoring
  const viewScore = Math.min(views / 1000, 1) * 20 // Max 20 points
  const likeScore = Math.min(likes / 100, 1) * 30 // Max 30 points
  const commentScore = Math.min(comments / 50, 1) * 25 // Max 25 points
  const shareScore = Math.min(shares / 25, 1) * 15 // Max 15 points
  const reachScore = Math.min(reach / 5000, 1) * 10 // Max 10 points
  
  return Math.round(viewScore + likeScore + commentScore + shareScore + reachScore)
}

/**
 * Analyze posting times to find optimal schedule
 */
function analyzePostingTimes(posts: Post[]): Array<{ hour: number; day: string; avgEngagement: number }> {
  const timeSlots: Map<string, { totalEngagement: number; count: number }> = new Map()
  
  posts
    .filter(p => (p.postedAt || p.createdAt) && p.engagement)
    .forEach(post => {
      // Use postedAt if available, otherwise fall back to createdAt (for scanned posts)
      const dateStr = post.postedAt || post.createdAt
      if (!dateStr) return
      
      const date = new Date(dateStr)
      const day = date.toLocaleDateString('en-US', { weekday: 'long' })
      const hour = date.getHours()
      const key = `${day}-${hour}`
      
      const engagement = calculateEngagementRate(post)
      // Only include posts with meaningful engagement data
      if (engagement > 0 || (post.engagement && (post.engagement.likes || post.engagement.comments || post.engagement.shares))) {
      const existing = timeSlots.get(key) || { totalEngagement: 0, count: 0 }
      
      timeSlots.set(key, {
        totalEngagement: existing.totalEngagement + engagement,
        count: existing.count + 1
      })
      }
    })
  
  return Array.from(timeSlots.entries())
    .map(([key, data]) => {
      const [day, hourStr] = key.split('-')
      return {
        hour: parseInt(hourStr),
        day,
        avgEngagement: data.totalEngagement / data.count
      }
    })
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 10)
}

/**
 * Analyze content types performance
 */
function analyzeContentTypes(posts: Post[]): Array<{ type: string; avgViews: number; avgEngagement: number }> {
  const typeStats: Map<string, { totalViews: number; totalEngagement: number; count: number }> = new Map()
  
  posts
    .filter(p => p.engagement)
    .forEach(post => {
      const type = post.contentType || (post.media ? (post.media.type === 'video' ? 'video' : 'image') : 'text')
      const views = post.engagement!.views || 0
      const engagement = calculateEngagementRate(post)
      
      const existing = typeStats.get(type) || { totalViews: 0, totalEngagement: 0, count: 0 }
      typeStats.set(type, {
        totalViews: existing.totalViews + views,
        totalEngagement: existing.totalEngagement + engagement,
        count: existing.count + 1
      })
    })
  
  return Array.from(typeStats.entries())
    .map(([type, data]) => ({
      type,
      avgViews: data.count > 0 ? Math.round(data.totalViews / data.count) : 0,
      avgEngagement: data.count > 0 ? data.totalEngagement / data.count : 0
    }))
    .sort((a, b) => b.avgViews - a.avgViews)
}

/**
 * Analyze hashtag performance
 */
function analyzeHashtags(posts: Post[]): Array<{ tag: string; avgViews: number; usageCount: number }> {
  const hashtagStats: Map<string, { totalViews: number; count: number }> = new Map()
  
  posts
    .filter(p => p.hashtags && p.hashtags.length > 0 && p.engagement)
    .forEach(post => {
      const views = post.engagement!.views || 0
      post.hashtags!.forEach(tag => {
        const existing = hashtagStats.get(tag) || { totalViews: 0, count: 0 }
        hashtagStats.set(tag, {
          totalViews: existing.totalViews + views,
          count: existing.count + 1
        })
      })
    })
  
  return Array.from(hashtagStats.entries())
    .map(([tag, data]) => ({
      tag,
      avgViews: data.count > 0 ? Math.round(data.totalViews / data.count) : 0,
      usageCount: data.count
    }))
    .sort((a, b) => b.avgViews - a.avgViews)
    .slice(0, 20)
}

/**
 * Analyze platform performance
 */
function analyzePlatforms(posts: Post[]): Array<{ platform: string; avgReach: number; avgEngagement: number }> {
  const platformStats: Map<string, { totalReach: number; totalEngagement: number; count: number }> = new Map()
  
  posts
    .filter(p => p.engagement)
    .forEach(post => {
      const reach = post.engagement!.reach || 0
      const engagement = calculateEngagementRate(post)
      
      const existing = platformStats.get(post.platform) || { totalReach: 0, totalEngagement: 0, count: 0 }
      platformStats.set(post.platform, {
        totalReach: existing.totalReach + reach,
        totalEngagement: existing.totalEngagement + engagement,
        count: existing.count + 1
      })
    })
  
  return Array.from(platformStats.entries())
    .map(([platform, data]) => ({
      platform,
      avgReach: data.count > 0 ? Math.round(data.totalReach / data.count) : 0,
      avgEngagement: data.count > 0 ? data.totalEngagement / data.count : 0
    }))
    .sort((a, b) => b.avgReach - a.avgReach)
}

/**
 * Analyze optimal content length
 */
function analyzeContentLength(posts: Post[]): { min: number; max: number; avgEngagement: number } {
  const lengthGroups: Array<{ length: number; engagement: number }> = []
  
  posts
    .filter(p => p.engagement && p.content)
    .forEach(post => {
      const length = post.content.length
      const engagement = calculateEngagementRate(post)
      lengthGroups.push({ length, engagement })
    })
  
  if (lengthGroups.length === 0) {
    return { min: 0, max: 0, avgEngagement: 0 }
  }
  
  // Group by length ranges
  const ranges: Map<string, { totalEngagement: number; count: number }> = new Map()
  
  lengthGroups.forEach(({ length, engagement }) => {
    let range = ''
    if (length < 50) range = '0-50'
    else if (length < 100) range = '50-100'
    else if (length < 200) range = '100-200'
    else if (length < 300) range = '200-300'
    else range = '300+'
    
    const existing = ranges.get(range) || { totalEngagement: 0, count: 0 }
    ranges.set(range, {
      totalEngagement: existing.totalEngagement + engagement,
      count: existing.count + 1
    })
  })
  
  const bestRange = Array.from(ranges.entries())
    .map(([range, data]) => ({
      range,
      avgEngagement: data.totalEngagement / data.count
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)[0]
  
  if (!bestRange) {
    return { min: 0, max: 0, avgEngagement: 0 }
  }
  
  const [min, max] = bestRange.range.split('-').map(n => n === '+' ? 1000 : parseInt(n))
  
  return {
    min: min || 0,
    max: max || 1000,
    avgEngagement: bestRange.avgEngagement
  }
}

/**
 * Analyze media impact
 */
function analyzeMediaImpact(posts: Post[]): { withMedia: { avgViews: number }; withoutMedia: { avgViews: number } } {
  let withMedia = { totalViews: 0, count: 0 }
  let withoutMedia = { totalViews: 0, count: 0 }
  
  posts
    .filter(p => p.engagement)
    .forEach(post => {
      const views = post.engagement!.views || 0
      if (post.hasMedia || post.media) {
        withMedia.totalViews += views
        withMedia.count += 1
      } else {
        withoutMedia.totalViews += views
        withoutMedia.count += 1
      }
    })
  
  return {
    withMedia: {
      avgViews: withMedia.count > 0 ? Math.round(withMedia.totalViews / withMedia.count) : 0
    },
    withoutMedia: {
      avgViews: withoutMedia.count > 0 ? Math.round(withoutMedia.totalViews / withoutMedia.count) : 0
    }
  }
}

/**
 * Generate recommendations based on performance data
 */
function generateRecommendations(insights: Omit<PerformanceInsight, 'recommendations'>): string[] {
  const recommendations: string[] = []
  
  // Posting time recommendations
  if (insights.bestPostingTimes.length > 0) {
    const best = insights.bestPostingTimes[0]
    recommendations.push(`Post on ${best.day}s around ${best.hour}:00 for best engagement`)
  }
  
  // Content type recommendations
  if (insights.bestContentTypes.length > 0) {
    const best = insights.bestContentTypes[0]
    recommendations.push(`Use ${best.type} content more often - it averages ${best.avgViews.toLocaleString()} views`)
  }
  
  // Media recommendations
  if (insights.mediaImpact.withMedia.avgViews > insights.mediaImpact.withoutMedia.avgViews * 1.2) {
    recommendations.push('Posts with media perform significantly better - include images/videos when possible')
  }
  
  // Hashtag recommendations
  if (insights.bestHashtags.length > 0) {
    const topHashtags = insights.bestHashtags.slice(0, 3).map(h => h.tag).join(', ')
    recommendations.push(`Top performing hashtags: ${topHashtags}`)
  }
  
  // Platform recommendations
  if (insights.bestPlatforms.length > 0) {
    const best = insights.bestPlatforms[0]
    recommendations.push(`${best.platform} shows highest reach (avg ${best.avgReach.toLocaleString()})`)
  }
  
  // Content length recommendations
  if (insights.contentLengthOptimal.avgEngagement > 0) {
    recommendations.push(`Optimal content length: ${insights.contentLengthOptimal.min}-${insights.contentLengthOptimal.max} characters`)
  }
  
  return recommendations
}

/**
 * Main function to analyze all posts and generate insights
 * Now also includes scanned posts from social media accounts
 */
export function analyzeContentPerformance(
  posts: Post[], 
  scannedPosts?: ScannedPost[]
): PerformanceInsight {
  // Get regular posted posts with engagement
  const postedPosts = posts.filter(p => p.status === 'posted' && p.engagement)
  
  // Convert scanned posts to Post format and add them
  const convertedScannedPosts: Post[] = scannedPosts
    ? scannedPosts
        .filter(sp => sp.engagement && (sp.engagement.likes || sp.engagement.comments || sp.engagement.shares))
        .map(convertScannedPostToPost)
    : []
  
  // Combine both sources
  const allPosts = [...postedPosts, ...convertedScannedPosts]
  
  if (allPosts.length === 0) {
    return {
      bestPostingTimes: [],
      bestContentTypes: [],
      bestHashtags: [],
      bestPlatforms: [],
      contentLengthOptimal: { min: 0, max: 0, avgEngagement: 0 },
      mediaImpact: { withMedia: { avgViews: 0 }, withoutMedia: { avgViews: 0 } },
      topPerformingPosts: [],
      recommendations: ['Not enough data yet. Post more content or connect social accounts to scan existing posts to get insights!']
    }
  }
  
  // Calculate performance scores
  const postPerformances: PostPerformance[] = allPosts.map(post => ({
    post,
    engagementRate: calculateEngagementRate(post),
    reachRate: post.engagement!.reach > 0 ? (post.engagement!.views || 0) / post.engagement!.reach : 0,
    score: calculatePerformanceScore(post)
  }))
  
  // Get top performing posts
  const topPerformingPosts = postPerformances
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(p => p.post)
  
  const insights: Omit<PerformanceInsight, 'recommendations'> = {
    bestPostingTimes: analyzePostingTimes(allPosts),
    bestContentTypes: analyzeContentTypes(allPosts),
    bestHashtags: analyzeHashtags(allPosts),
    bestPlatforms: analyzePlatforms(allPosts),
    contentLengthOptimal: analyzeContentLength(allPosts),
    mediaImpact: analyzeMediaImpact(allPosts),
    topPerformingPosts
  }
  
  return {
    ...insights,
    recommendations: generateRecommendations(insights)
  }
}

/**
 * Generate AI prompt enhancement based on performance insights
 */
export function generatePerformancePrompt(insights: PerformanceInsight): string {
  let prompt = '\n\n--- PERFORMANCE INSIGHTS (Use these patterns for better engagement) ---\n'
  
  if (insights.bestPostingTimes.length > 0) {
    const best = insights.bestPostingTimes[0]
    prompt += `- Best posting time: ${best.day} at ${best.hour}:00 (${best.avgEngagement.toFixed(1)}% avg engagement)\n`
  }
  
  if (insights.bestContentTypes.length > 0) {
    const best = insights.bestContentTypes[0]
    prompt += `- Best content type: ${best.type} (${best.avgViews.toLocaleString()} avg views)\n`
  }
  
  if (insights.bestHashtags.length > 0) {
    const topHashtags = insights.bestHashtags.slice(0, 5).map(h => h.tag).join(', ')
    prompt += `- Top performing hashtags: ${topHashtags}\n`
  }
  
  if (insights.contentLengthOptimal.avgEngagement > 0) {
    prompt += `- Optimal length: ${insights.contentLengthOptimal.min}-${insights.contentLengthOptimal.max} characters\n`
  }
  
  if (insights.mediaImpact.withMedia.avgViews > insights.mediaImpact.withoutMedia.avgViews) {
    prompt += `- Media significantly improves performance (${Math.round((insights.mediaImpact.withMedia.avgViews / insights.mediaImpact.withoutMedia.avgViews) * 100)}% more views)\n`
  }
  
  if (insights.bestPlatforms.length > 0) {
    const best = insights.bestPlatforms[0]
    prompt += `- ${best.platform} performs best (${best.avgReach.toLocaleString()} avg reach)\n`
  }
  
  prompt += '\nApply these insights to create content that matches your best-performing patterns.\n'
  
  return prompt
}
