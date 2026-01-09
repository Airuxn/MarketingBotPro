/**
 * Instagram Ads API Integration
 * Instagram Ads use the Facebook Graph API (same as Facebook Ads)
 */

import { AdAccount, AdCampaign } from './ad-platforms'

const API_BASE = 'https://graph.facebook.com/v18.0'

export async function connectInstagramAccount(accessToken: string): Promise<AdAccount> {
  try {
    // Instagram Ads uses Facebook Graph API
    // Requires Facebook Business Manager and Instagram Business Account
    const response = await fetch(`${API_BASE}/me?access_token=${accessToken}&fields=id,name`)
    
    if (!response.ok) {
      throw new Error('Failed to connect Instagram account')
    }

    const data = await response.json()

    return {
      platform: 'instagram',
      accountId: data.id,
      name: data.name || 'Instagram Ads Account',
      accessToken,
      connected: true,
      connectedAt: new Date().toISOString(),
    }
  } catch (error: any) {
    throw new Error(`Instagram Ads connection failed: ${error.message}`)
  }
}

export async function createInstagramCampaign(
  accountId: string,
  accessToken: string,
  campaign: Omit<AdCampaign, 'id' | 'createdAt' | 'platform'>
): Promise<AdCampaign> {
  try {
    // Instagram Ads uses Facebook Graph API structure
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
          status: campaign.status === 'active' ? 'ACTIVE' : 'PAUSED',
          special_ad_categories: [],
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to create Instagram campaign')
    }

    const data = await response.json()

    return {
      ...campaign,
      id: data.id,
      platform: 'instagram',
      createdAt: new Date().toISOString(),
    }
  } catch (error: any) {
    throw new Error(`Failed to create Instagram Ads campaign: ${error.message}`)
  }
}
