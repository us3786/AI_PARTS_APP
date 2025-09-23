import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    
    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Get all eBay listings for this vehicle
    const listings = await prisma.ebayListing.findMany({
      where: {
        partsInventory: {
          vehicleId: vehicleId
        }
      },
      include: {
        partsInventory: {
          include: {
            partsMaster: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data for the preview component
    const transformedListings = listings.map(listing => ({
      id: listing.id,
      partName: listing.partsInventory.partsMaster.partName,
      category: listing.partsInventory.partsMaster.category,
      subCategory: listing.partsInventory.partsMaster.subCategory,
      condition: listing.partsInventory.condition,
      price: listing.price,
      title: listing.title,
      description: listing.description || '',
      categoryId: listing.categoryId || '',
      images: listing.images || [],
      status: listing.status,
      listingDate: listing.listingDate,
      ebayItemId: listing.ebayItemId,
      ebayUrl: listing.ebayItemId ? `https://www.ebay.com/itm/${listing.ebayItemId}` : undefined,
      performanceData: listing.performanceData
    }))

    return NextResponse.json({
      success: true,
      listings: transformedListings,
      total: transformedListings.length
    })

  } catch (error) {
    console.error('Error fetching eBay listings:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch eBay listings',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      listingId, 
      action, 
      data 
    } = await request.json()
    
    if (!listingId || !action) {
      return NextResponse.json(
        { success: false, message: 'Listing ID and action are required' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'updateStatus':
        result = await prisma.ebayListing.update({
          where: { id: listingId },
          data: {
            status: data.status,
            title: data.title,
            description: data.description,
            price: data.price
          }
        })
        
        return NextResponse.json({
          success: true,
          message: 'Listing updated successfully',
          listing: result
        })

      case 'endListing':
        result = await prisma.ebayListing.update({
          where: { id: listingId },
          data: { 
            status: 'ended',
            endDate: new Date()
          }
        })
        
        return NextResponse.json({
          success: true,
          message: 'Listing ended successfully',
          listing: result
        })

      case 'createDraft':
        // Create a draft listing for a part
        const { partId, vehicleId, listingData } = data
        
        const part = await prisma.partsInventory.findUnique({
          where: { id: partId },
          include: {
            partsMaster: true
          }
        })

        if (!part) {
          return NextResponse.json(
            { success: false, message: 'Part not found' },
            { status: 404 }
          )
        }

        // Generate listing data
        const title = `${part.partsMaster.partName} for ${part.vehicle?.year} ${part.vehicle?.make} ${part.vehicle?.model}`
        const description = generateListingDescription(part, listingData)
        
        const draftListing = await prisma.ebayListing.create({
          data: {
            partsInventoryId: partId,
            partsMasterId: part.partsMasterId,
            title: title,
            description: description,
            price: listingData.price || part.currentValue || part.partsMaster.estimatedValue || 0,
            currency: 'USD',
            status: 'draft',
            images: listingData.images || part.partsMaster.images || [],
            categoryId: getEbayCategoryId(part.partsMaster.category, part.partsMaster.subCategory)
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Draft listing created successfully',
          listing: draftListing
        })

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error updating eBay listing:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update eBay listing',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to generate listing description
function generateListingDescription(part: any, listingData: any) {
  const baseDescription = `
    <h3>${part.partsMaster.partName}</h3>
    <p><strong>Condition:</strong> ${part.condition}</p>
    <p><strong>Category:</strong> ${part.partsMaster.category}</p>
    ${part.partsMaster.subCategory ? `<p><strong>Subcategory:</strong> ${part.partsMaster.subCategory}</p>` : ''}
    
    <h4>Description</h4>
    <p>${part.notes || `High-quality ${part.partsMaster.partName} in ${part.condition} condition.`}</p>
    
    <h4>Vehicle Compatibility</h4>
    <p>This part is compatible with ${part.vehicle?.year} ${part.vehicle?.make} ${part.vehicle?.model}.</p>
    
    <h4>Shipping & Returns</h4>
    <p>• Fast and secure shipping<br>
    • 30-day return policy<br>
    • Professional packaging</p>
    
    <p><strong>Questions?</strong> Feel free to contact us with any questions about this part.</p>
  `
  
  return baseDescription
}

// Helper function to get eBay category ID
function getEbayCategoryId(category: string, subCategory?: string) {
  // This is a simplified mapping - in a real app, you'd have a comprehensive category mapping
  const categoryMap: { [key: string]: string } = {
    'Engine': '33615',
    'Transmission': '33730',
    'Body': '33632',
    'Interior': '33730',
    'Exterior': '33632',
    'Electrical': '33730',
    'Suspension': '33582',
    'Brakes': '33582',
    'Exhaust': '33615',
    'Cooling': '33615'
  }
  
  return categoryMap[category] || '33615' // Default to automotive parts
}
