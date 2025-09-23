import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface EbaySearchParams {
  keywords: string
  categoryId?: string
  limit?: number
  sort?: string
  aspectFilters?: Record<string, string[]>
  marketplaceId?: string
}

export async function POST(request: NextRequest) {
  try {
    const { keywords, categoryId, limit = 50, sort, aspectFilters, marketplaceId = "EBAY_US" }: EbaySearchParams = await request.json()
    
    if (!keywords) {
      return NextResponse.json(
        { success: false, message: 'Keywords are required' },
        { status: 400 }
      )
    }

    // Get current access token from database
    const tokens = await prisma.ebayTokens.findFirst({
      where: { id: 'default' }
    })

    if (!tokens || !tokens.accessToken) {
      return NextResponse.json(
        { success: false, message: 'No eBay access token available. Please connect to eBay first.' },
        { status: 401 }
      )
    }

    // Check if token is expired
    if (new Date() >= tokens.expiresAt) {
      return NextResponse.json(
        { success: false, message: 'eBay access token expired. Please refresh your connection.' },
        { status: 401 }
      )
    }

    // Prepare eBay API request
    const headers = {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': marketplaceId
    }

    const url = 'https://api.ebay.com/buy/browse/v1/item_summary/search'
    const params = new URLSearchParams({
      'q': keywords,
      'limit': limit.toString()
    })

    if (categoryId) params.append('category_ids', categoryId)
    if (sort) params.append('sort', sort)

    // Handle aspect filters
    if (aspectFilters && Object.keys(aspectFilters).length > 0) {
      const filterStrings = Object.entries(aspectFilters).map(([aspectName, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          return `${aspectName}:{${values.join('|')}}`
        }
        return null
      }).filter(Boolean)

      if (filterStrings.length > 0) {
        params.append('aspect_filter', filterStrings.join(','))
      }
    }

    // Make request to eBay API
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('eBay API error:', response.status, errorData)
      return NextResponse.json(
        { 
          success: false, 
          message: 'eBay API request failed',
          error: `HTTP ${response.status}`,
          details: errorData
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Process and format the response
    const processedItems = data.itemSummaries?.map((item: any) => ({
      itemId: item.itemId,
      title: item.title,
      price: item.price?.value ? parseFloat(item.price.value) : null,
      currency: item.price?.currency || 'USD',
      condition: item.condition,
      imageUrl: item.image?.imageUrl,
      itemUrl: item.itemWebUrl,
      seller: item.seller?.username,
      location: item.itemLocation?.city + ', ' + item.itemLocation?.stateOrProvince,
      shippingCost: item.shippingOptions?.[0]?.shippingCost?.value ? parseFloat(item.shippingOptions[0].shippingCost.value) : null,
      category: item.categories?.[0]?.categoryName,
      conditionId: item.conditionId,
      topRatedBuyingExperience: item.topRatedBuyingExperience || false,
      buyItNowAvailable: item.buyItNowAvailable || false,
      bestOfferEnabled: item.bestOfferEnabled || false
    })) || []

    return NextResponse.json({
      success: true,
      items: processedItems,
      totalItems: data.total,
      searchKeywords: keywords,
      searchTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('eBay search error:', error)
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
