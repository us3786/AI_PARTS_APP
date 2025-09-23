import { NextRequest, NextResponse } from 'next/server'
import { refreshEbayToken } from '@/lib/api'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Get current tokens from database
    const currentTokens = await prisma.ebayTokens.findFirst({
      where: { id: 'default' }
    })

    if (!currentTokens || !currentTokens.refreshToken) {
      return NextResponse.json(
        { success: false, message: 'No refresh token available' },
        { status: 400 }
      )
    }

    // Check if token is expired or expires soon (within 5 minutes)
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
    if (currentTokens.expiresAt > fiveMinutesFromNow) {
      return NextResponse.json({
        success: true,
        message: 'Token is still valid',
        token: currentTokens.accessToken,
        expiresAt: currentTokens.expiresAt
      })
    }

    // Refresh the token
    const newTokenData = await refreshEbayToken(currentTokens.refreshToken)
    
    if (!newTokenData) {
      return NextResponse.json(
        { success: false, message: 'Failed to refresh token' },
        { status: 500 }
      )
    }

    // Calculate new expiration time
    const expiresAt = new Date(Date.now() + (newTokenData.expires_in * 1000))

    // Update tokens in database
    await prisma.ebayTokens.update({
      where: { id: 'default' },
      data: {
        accessToken: newTokenData.access_token,
        refreshToken: newTokenData.refresh_token || currentTokens.refreshToken,
        expiresAt: expiresAt,
        tokenType: newTokenData.token_type,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newTokenData.access_token,
      expiresAt: expiresAt
    })
  } catch (error) {
    console.error('eBay token refresh error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
