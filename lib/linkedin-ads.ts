/**
 * LinkedIn Ads API Integration
 */

import { AdAccount, AdCampaign, AdCreative, AdSet, Ad, AdTargeting } from './ad-platforms'

const API_BASE = 'https://api.linkedin.com/v2'

export async function connectLinkedInAccount(accessToken: string): Promise<AdAccount> {
  try {
    const response = await fetch(`${API_BASE}/adAccountsV2?q=search`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return {
      platform: 'linkedin',
      accountId: data.elements[0]?.id || '',
      name: data.elements[0]?.name || 'LinkedIn Ads Account',
      accessToken,
      connected: true,
      connectedAt: new Date().toISOString(),
    }
  } catch (error: any) {
    throw new Error(`LinkedIn connection failed: ${error.message}`)
  }
}

export async function createLinkedInCampaign(
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
      `${API_BASE}/adCampaignsV2?account=urn:li:sponsoredAccount:${accountId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaign.name,
          account: `urn:li:sponsoredAccount:${accountId}`,
          campaignStatus: 'DRAFT',
          objectiveType: campaign.objective,
          ...(campaign.dailyBudget && {
            dailyBudget: {
              amount: campaign.dailyBudget,
              currencyCode: 'USD',
            },
          }),
          ...(campaign.totalBudget && {
            totalBudget: {
              amount: campaign.totalBudget,
              currencyCode: 'USD',
            },
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
    throw new Error(`Failed to create LinkedIn campaign: ${error.message}`)
  }
}
