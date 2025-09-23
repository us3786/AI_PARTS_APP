import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { partId, vehicleId, listingData } = await request.json()
    
    if (!partId || !vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Part ID and Vehicle ID are required' },
        { status: 400 }
      )
    }

    // Get part information
    const part = await prisma.partsInventory.findUnique({
      where: { id: partId },
      include: {
        partsMaster: true,
        vehicle: true
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
    const price = listingData?.price || part.currentValue || part.partsMaster.estimatedValue || 0
    
    // Create draft listing
    const draftListing = await prisma.ebayListing.create({
      data: {
        partsInventoryId: partId,
        partsMasterId: part.partsMasterId,
        title: title,
        description: description,
        price: price,
        currency: 'USD',
        status: 'draft',
        images: listingData?.images || part.partsMaster.images || [],
        categoryId: getEbayCategoryId(part.partsMaster.category, part.partsMaster.subCategory)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Draft listing created successfully',
      listing: draftListing
    })

  } catch (error) {
    console.error('Error creating draft listing:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create draft listing',
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
  
  return categoryMap[category] || '33615'
}
