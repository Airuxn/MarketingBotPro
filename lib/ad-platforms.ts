/**
 * Advertising Platform Integrations
 * Supports Facebook, Instagram, LinkedIn, and Twitter/X
 */

export type AdPlatform = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'google'

export interface AdAccount {
  platform: AdPlatform
  accountId: string
  name: string
  accessToken?: string
  refreshToken?: string
  connected: boolean
  connectedAt?: string
}

export interface AdCampaign {
  id: string
  name: string
  platform: AdPlatform
  objective: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  budget?: number
  dailyBudget?: number
  startDate?: string
  endDate?: string
  targeting?: AdTargeting
  createdAt: string
}

export interface AdTargeting {
  ageMin?: number
  ageMax?: number
  genders?: string[]
  locations?: string[]
  interests?: string[]
  behaviors?: string[]
  customAudiences?: string[]
}

export interface AdCreative {
  id: string
  name: string
  platform: AdPlatform
  headline: string
  description: string
  imageUrl?: string
  videoUrl?: string
  callToAction?: string
  linkUrl?: string
  status: 'draft' | 'active' | 'paused'
}

export interface AdSet {
  id: string
  campaignId: string
  name: string
  platform: AdPlatform
  targeting: AdTargeting
  budget?: number
  dailyBudget?: number
  status: 'draft' | 'active' | 'paused'
}

export interface Ad {
  id: string
  adSetId: string
  creativeId: string
  name: string
  platform: AdPlatform
  status: 'draft' | 'active' | 'paused' | 'archived'
  createdAt: string
}

// Platform-specific configurations
export const platformConfigs = {
  facebook: {
    name: 'Facebook Ads',
    apiBase: 'https://graph.facebook.com/v18.0',
    requiredScopes: ['ads_management', 'ads_read', 'business_management'],
    objectives: [
      'OUTCOME_TRAFFIC',
      'OUTCOME_ENGAGEMENT',
      'OUTCOME_LEADS',
      'OUTCOME_APP_PROMOTION',
      'OUTCOME_SALES',
      'OUTCOME_AWARENESS',
    ],
  },
  instagram: {
    name: 'Instagram Ads',
    apiBase: 'https://graph.facebook.com/v18.0',
    requiredScopes: ['ads_management', 'ads_read', 'business_management'],
    objectives: [
      'OUTCOME_TRAFFIC',
      'OUTCOME_ENGAGEMENT',
      'OUTCOME_LEADS',
      'OUTCOME_APP_PROMOTION',
      'OUTCOME_SALES',
      'OUTCOME_AWARENESS',
    ],
  },
  linkedin: {
    name: 'LinkedIn Ads',
    apiBase: 'https://api.linkedin.com/v2',
    requiredScopes: ['r_ads', 'rw_ads'],
    objectives: [
      'WEBSITE_VISITS',
      'WEBSITE_CONVERSIONS',
      'JOB_APPLICANTS',
      'BRAND_AWARENESS',
      'VIDEO_VIEWS',
    ],
  },
  twitter: {
    name: 'Twitter/X Ads',
    apiBase: 'https://ads-api.twitter.com/12',
    requiredScopes: ['ads:read', 'ads:write'],
    objectives: [
      'APP_ENGAGEMENTS',
      'APP_INSTALLS',
      'FOLLOWERS',
      'LEAD_GENERATION',
      'TWEET_ENGAGEMENTS',
      'VIDEO_VIEWS',
      'WEBSITE_CLICKS',
    ],
  },
}
