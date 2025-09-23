import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    console.log('eBay OAuth callback received:', { code: code ? 'present' : 'missing', state, error })

    // Handle OAuth errors
    if (error) {
      console.error('eBay OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    // Validate required parameters
    if (!code) {
      console.error('No authorization code received')
      return NextResponse.redirect(
        new URL('/?error=no_code', request.url)
      )
    }

    // Exchange authorization code for tokens
    const tokenData = await exchangeCodeForTokens(code)
    
    if (!tokenData) {
      console.error('Failed to exchange code for tokens')
      return NextResponse.redirect(
        new URL('/?error=token_exchange_failed', request.url)
      )
    }

    console.log('Token exchange successful:', { 
      access_token: tokenData.access_token ? 'present' : 'missing',
      refresh_token: tokenData.refresh_token ? 'present' : 'missing',
      expires_in: tokenData.expires_in
    })

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))

    // Save tokens to database
    try {
      await prisma.ebayTokens.upsert({
        where: { id: 'default' }, // Using a single token record for simplicity
        update: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          expiresAt: expiresAt,
          tokenType: tokenData.token_type,
          scope: process.env.EBAY_SCOPES || null,
          updatedAt: new Date(),
        },
        create: {
          id: 'default',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          expiresAt: expiresAt,
          tokenType: tokenData.token_type,
          scope: process.env.EBAY_SCOPES || null,
        },
      })

      console.log('eBay tokens saved successfully')
      
      // Redirect to success page
      return NextResponse.redirect(
        new URL('/?success=ebay_connected', request.url)
      )
    } catch (dbError) {
      console.error('Database error saving tokens:', dbError)
      return NextResponse.redirect(
        new URL('/?error=database_error', request.url)
      )
    }
  } catch (error) {
    console.error('eBay OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent('callback_error')}`, request.url)
    )
  }
}
