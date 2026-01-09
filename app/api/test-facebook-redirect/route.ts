import { NextResponse } from 'next/server'
import { getOAuthUrls } from '@/lib/vercel-url'

export async function GET(request: Request) {
  const { baseUrl, redirectUri } = getOAuthUrls(request, '/api/oauth/facebook/callback')
  
  // Build the exact URL that would be sent to Facebook
  const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID || 'NOT_SET'
  const authParams = new URLSearchParams({
    client_id: FACEBOOK_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    state: 'social_post',
  })
  
  const facebookOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?${authParams.toString()}`
  
  return NextResponse.json({
    message: 'Dit is de EXACTE redirect URI die naar Facebook wordt gestuurd',
    redirectUri: redirectUri,
    baseUrl: baseUrl,
    facebookOAuthUrl: facebookOAuthUrl,
    whatToCheckInFacebook: {
      step1: 'Ga naar: https://developers.facebook.com/apps/',
      step2: 'Selecteer je app',
      step3: 'Ga naar: Facebook Login → Settings',
      step4: 'Check "Valid OAuth Redirect URIs"',
      step5: `Zorg dat deze EXACTE URL er staat: ${redirectUri}`,
      step6: 'Als deze URL er NIET staat, voeg hem toe en klik "Save Changes"',
      step7: 'Wacht 5-10 minuten en test opnieuw'
    },
    troubleshooting: {
      ifStillNotWorking: [
        '1. Check of de redirectUri hierboven EXACT overeenkomt met Facebook',
        '2. Check of Client OAuth Login = Enabled',
        '3. Check of Web OAuth Login = Enabled',
        '4. Check of App Mode = Live (of je bent Tester)',
        '5. Wacht 5-10 minuten (Facebook cache)',
        '6. Test in incognito venster (browser cache)'
      ]
    }
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  })
}
