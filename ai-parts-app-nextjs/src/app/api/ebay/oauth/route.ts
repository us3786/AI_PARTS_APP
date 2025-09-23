import { NextRequest, NextResponse } from 'next/server'
import { generateEbayAuthUrl } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    // Generate the eBay OAuth authorization URL
    const authUrl = generateEbayAuthUrl()
    
    // Redirect user to eBay for authorization
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('eBay OAuth authorization error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate eBay authorization URL',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
