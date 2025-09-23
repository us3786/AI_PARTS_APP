import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get current tokens from database
    const tokens = await prisma.ebayTokens.findFirst({
      where: { id: 'default' }
    })

    if (!tokens) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'No eBay tokens found'
      })
    }

    // Check if token is expired
    const now = new Date()
    const isExpired = tokens.expiresAt <= now
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
    const isExpiringSoon = tokens.expiresAt <= fiveMinutesFromNow

    return NextResponse.json({
      success: true,
      connected: true,
      tokens: {
        id: tokens.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        tokenType: tokens.tokenType,
        scope: tokens.scope,
        createdAt: tokens.createdAt,
        updatedAt: tokens.updatedAt
      },
      status: {
        expired: isExpired,
        expiringSoon: isExpiringSoon,
        valid: !isExpired
      }
    })
  } catch (error) {
    console.error('eBay status check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        connected: false,
        message: 'Failed to check eBay connection status',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
