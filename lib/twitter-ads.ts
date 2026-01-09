/**
 * Twitter/X Ads API Integration
 */

import { AdAccount, AdCampaign, AdCreative, AdSet, Ad, AdTargeting } from './ad-platforms'

const API_BASE = 'https://ads-api.twitter.com/12'

export async function connectTwitterAccount(
  accessToken: string,
  accessTokenSecret: string
): Promise<AdAccount> {
  try {
    // Twitter Ads requires OAuth 1.0a
    // This is simplified - in production you'd use proper OAuth signing
    const response = await fetch(`${API_BASE}/accounts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return {
      platform: 'twitter',
      accountId: data.data[0]?.id || '',
      name: data.data[0]?.name || 'Twitter Ads Account',
      accessToken,
      connected: true,
      connectedAt: new Date().toISOString(),
    }
  } catch (error: any) {
    throw new Error(`Twitter connection failed: ${error.message}`)
  }
}

export async function createTwitterCampaign(
  accessToken: string,
  accountId: string,
  campaign: {
    name: string
    objective: string
    dailyBudget?: number
    totalBudget?: number
  }
): Promise<string> {
  try {
    const response = await fetch(
      `${API_BASE}/accounts/${accountId}/campaigns`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaign.name,
          funding_instrument_id: accountId,
          daily_budget_amount_local_micro: campaign.dailyBudget
            ? campaign.dailyBudget * 1000000
            : undefined,
          total_budget_amount_local_micro: campaign.totalBudget
            ? campaign.totalBudget * 1000000
            : undefined,
          entity_status: 'PAUSED',
        }),
      }
    )

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return data.data.id
  } catch (error: any) {
    throw new Error(`Failed to create Twitter campaign: ${error.message}`)
  }
}
