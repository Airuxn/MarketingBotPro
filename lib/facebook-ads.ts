/**
 * Facebook Ads API Integration
 */

import { AdAccount, AdCampaign, AdCreative, AdSet, Ad, AdTargeting } from './ad-platforms'

const API_BASE = 'https://graph.facebook.com/v18.0'

export async function connectFacebookAccount(accessToken: string): Promise<AdAccount> {
  try {
    const response = await fetch(`${API_BASE}/me?access_token=${accessToken}&fields=id,name`)
    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    // Get ad accounts
    const accountsResponse = await fetch(
      `${API_BASE}/me/adaccounts?access_token=${accessToken}&fields=id,name,account_id`
    )
    const accountsData = await accountsResponse.json()

    return {
      platform: 'facebook',
      accountId: accountsData.data[0]?.id || data.id,
      name: accountsData.data[0]?.name || data.name,
      accessToken,
      connected: true,
      connectedAt: new Date().toISOString(),
    }
  } catch (error: any) {
    throw new Error(`Facebook connection failed: ${error.message}`)
  }
}

export async function createFacebookCampaign(
  accessToken: string,
  accountId: string,
  campaign: {
    name: string
    objective: string
    status: 'PAUSED' | 'ACTIVE'
    dailyBudget?: number
    lifetimeBudget?: number
  }
): Promise<string> {
  try {
    const response = await fetch(
      `${API_BASE}/${accountId}/campaigns?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaign.name,
          objective: campaign.objective,
          status: campaign.status,
          special_ad_categories: [],
          ...(campaign.dailyBudget && {
            daily_budget: campaign.dailyBudget * 100, // Convert to cents
          }),
          ...(campaign.lifetimeBudget && {
            lifetime_budget: campaign.lifetimeBudget * 100,
          }),
        }),
      }
    )

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return data.id
  } catch (error: any) {
    throw new Error(`Failed to create Facebook campaign: ${error.message}`)
  }
}

export async function createFacebookAdSet(
  accessToken: string,
  accountId: string,
  campaignId: string,
  adSet: {
    name: string
    targeting: AdTargeting
    dailyBudget?: number
    lifetimeBudget?: number
    optimizationGoal: string
    billingEvent: string
  }
): Promise<string> {
  try {
    const targeting: any = {
      age_min: adSet.targeting.ageMin || 18,
      age_max: adSet.targeting.ageMax || 65,
    }

    if (adSet.targeting.genders && adSet.targeting.genders.length > 0) {
      targeting.genders = adSet.targeting.genders.map((g) => (g === 'male' ? 1 : 2))
    }

    if (adSet.targeting.locations && adSet.targeting.locations.length > 0) {
      targeting.geo_locations = {
        countries: adSet.targeting.locations,
      }
    }

    const response = await fetch(
      `${API_BASE}/${accountId}/adsets?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: adSet.name,
          campaign_id: campaignId,
          targeting,
          optimization_goal: adSet.optimizationGoal,
          billing_event: adSet.billingEvent,
          ...(adSet.dailyBudget && {
            daily_budget: adSet.dailyBudget * 100,
          }),
          ...(adSet.lifetimeBudget && {
            lifetime_budget: adSet.lifetimeBudget * 100,
          }),
        }),
      }
    )

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return data.id
  } catch (error: any) {
    throw new Error(`Failed to create Facebook ad set: ${error.message}`)
  }
}

export async function createFacebookAdCreative(
  accessToken: string,
  accountId: string,
  creative: {
    name: string
    message: string
    imageUrl?: string
    videoId?: string
    linkUrl: string
    headline?: string
    description?: string
    callToAction?: string
  }
): Promise<string> {
  try {
    // First, upload image if provided
    let imageHash = null
    if (creative.imageUrl) {
      const imageResponse = await fetch(
        `${API_BASE}/${accountId}/adimages?access_token=${accessToken}`,
        {
          method: 'POST',
          body: JSON.stringify({
            url: creative.imageUrl,
          }),
        }
      )
      const imageData = await imageResponse.json()
      imageHash = imageData.images?.[creative.imageUrl]?.hash
    }

    const creativeData: any = {
      name: creative.name,
      object_story_spec: {
        page_id: accountId, // You'd need to get the actual page ID
        link_data: {
          link: creative.linkUrl,
          message: creative.message,
          ...(imageHash && { image_hash: imageHash }),
          ...(creative.headline && { name: creative.headline }),
          ...(creative.description && { description: creative.description }),
          ...(creative.callToAction && {
            call_to_action: {
              type: creative.callToAction,
            },
          }),
        },
      },
    }

    const response = await fetch(
      `${API_BASE}/${accountId}/adcreatives?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creativeData),
      }
    )

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return data.id
  } catch (error: any) {
    throw new Error(`Failed to create Facebook ad creative: ${error.message}`)
  }
}

export async function createFacebookAd(
  accessToken: string,
  accountId: string,
  adSetId: string,
  creativeId: string,
  name: string,
  status: 'PAUSED' | 'ACTIVE' = 'PAUSED'
): Promise<string> {
  try {
    const response = await fetch(
      `${API_BASE}/${accountId}/ads?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          adset_id: adSetId,
          creative: { creative_id: creativeId },
          status,
        }),
      }
    )

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return data.id
  } catch (error: any) {
    throw new Error(`Failed to create Facebook ad: ${error.message}`)
  }
}
