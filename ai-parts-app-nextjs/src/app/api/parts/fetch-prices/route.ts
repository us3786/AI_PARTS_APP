import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { partIds } = await request.json()
    
    if (!partIds || !Array.isArray(partIds)) {
      return NextResponse.json(
        { success: false, message: 'Part IDs array is required' },
        { status: 400 }
      )
    }

    // Get parts from database
    const parts = await prisma.part.findMany({
      where: { id: { in: partIds } }
    })

    if (parts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No parts found' },
        { status: 404 }
      )
    }

    // Get eBay access token
    const tokens = await prisma.ebayTokens.findFirst({
      where: { id: 'default' }
    })

    if (!tokens || !tokens.accessToken) {
      return NextResponse.json(
        { success: false, message: 'No eBay access token available' },
        { status: 401 }
      )
    }

    // Fetch prices for each part
    const priceResults = []
    
    for (const part of parts) {
      try {
        // Create search keywords from part description
        const keywords = `${part.description} ${part.partNumber}`.trim()
        
        // Search eBay for this part
        const searchResponse = await fetch('/api/ebay/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keywords: keywords,
            limit: 10,
            sort: 'price'
          })
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          
          if (searchData.success && searchData.items && searchData.items.length > 0) {
            // Get the lowest price item
            const lowestPriceItem = searchData.items
              .filter((item: any) => item.price && item.price > 0)
              .sort((a: any, b: any) => a.price - b.price)[0]

            if (lowestPriceItem) {
              // Update part with real eBay data
              await prisma.part.update({
                where: { id: part.id },
                data: {
                  price: lowestPriceItem.price,
                  ebayListingId: lowestPriceItem.itemId,
                  ebayUrl: lowestPriceItem.itemUrl,
                  imageUrl: lowestPriceItem.imageUrl
                }
              })

              priceResults.push({
                partId: part.id,
                success: true,
                price: lowestPriceItem.price,
                currency: lowestPriceItem.currency,
                ebayListingId: lowestPriceItem.itemId,
                ebayUrl: lowestPriceItem.itemUrl,
                imageUrl: lowestPriceItem.imageUrl,
                seller: lowestPriceItem.seller,
                condition: lowestPriceItem.condition
              })
            } else {
              priceResults.push({
                partId: part.id,
                success: false,
                message: 'No pricing found on eBay'
              })
            }
          } else {
            priceResults.push({
              partId: part.id,
              success: false,
              message: 'No items found on eBay'
            })
          }
        } else {
          priceResults.push({
            partId: part.id,
            success: false,
            message: 'eBay search failed'
          })
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Error fetching price for part ${part.id}:`, error)
        priceResults.push({
          partId: part.id,
          success: false,
          message: 'Internal error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      results: priceResults,
      totalProcessed: priceResults.length,
      successfulFetches: priceResults.filter(r => r.success).length
    })

  } catch (error) {
    console.error('Parts price fetching error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch prices',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
