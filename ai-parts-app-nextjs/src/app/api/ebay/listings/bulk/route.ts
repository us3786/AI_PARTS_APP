import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { 
      partIds, 
      vehicleId, 
      listingTemplate, 
      maxConcurrent = 3,
      schedulingOptions = {},
      pricingStrategy = {}
    } = await request.json()
    
    if (!partIds || !Array.isArray(partIds) || partIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Part IDs array is required' },
        { status: 400 }
      )
    }

    console.log(`🛒 Starting bulk eBay listing for ${partIds.length} parts`)

    // Get vehicle information
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    })

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Create bulk operation record
    const bulkOperation = await prisma.bulkOperation.create({
      data: {
        operationName: `Bulk eBay Listing - ${new Date().toLocaleString()}`,
        selectedParts: partIds,
        listingTemplate: listingTemplate || {},
        pricingStrategy: pricingStrategy || {},
        schedulingOptions: schedulingOptions || {},
        status: 'pending',
        totalParts: partIds.length,
        processedParts: 0,
        successfulListings: 0,
        failedListings: 0
      }
    })

    // Get parts information with price research and images
    const parts = await prisma.partsInventory.findMany({
      where: {
        id: { in: partIds },
        vehicleId: vehicleId,
        status: { in: ['available', 'listed'] } // Only list available parts
      },
      include: {
        partsMaster: {
          include: {
            priceResearch: {
              where: { isActive: true },
              orderBy: { researchDate: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    console.log(`Found ${parts.length} parts ready for listing`)

    // Update bulk operation status
    await prisma.bulkOperation.update({
      where: { id: bulkOperation.id },
      data: { 
        status: 'in_progress',
        progress: 0
      }
    })

    const listingResults = []
    const errors = []

    // Process parts in batches to avoid overwhelming eBay API
    const batches = []
    for (let i = 0; i < parts.length; i += maxConcurrent) {
      batches.push(parts.slice(i, i + maxConcurrent))
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (part) => {
        try {
          console.log(`Creating listing for: ${part.partsMaster.partName}`)
          
          // Determine pricing
          let listingPrice = part.currentValue || part.partsMaster.estimatedValue || 0
          
          // Apply pricing strategy
          if (pricingStrategy.discountPercentage) {
            listingPrice = listingPrice * (1 - pricingStrategy.discountPercentage / 100)
          }
          if (pricingStrategy.minimumPrice && listingPrice < pricingStrategy.minimumPrice) {
            listingPrice = pricingStrategy.minimumPrice
          }

          // Prepare listing data
          const listingData = {
            partId: part.id,
            partName: part.partsMaster.partName,
            category: part.partsMaster.category,
            subCategory: part.partsMaster.subCategory,
            price: listingPrice,
            condition: part.condition,
            description: part.notes || `${part.partsMaster.partName} for ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            images: part.partsMaster.images || [],
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            vehicleId: vehicleId,
            listingTemplate: listingTemplate,
            bulkOperationId: bulkOperation.id
          }

          // Create eBay listing
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000'}/api/ebay/listings/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listingData)
          })

          const data = await response.json()
          
          if (data.success) {
            return {
              partId: part.id,
              partName: part.partsMaster.partName,
              success: true,
              ebayItemId: data.ebayItemId,
              ebayUrl: data.ebayUrl,
              listingPrice: listingPrice,
              originalPrice: part.currentValue
            }
          } else {
            throw new Error(data.message || 'Listing creation failed')
          }

        } catch (error) {
          console.error(`Error listing ${part.partsMaster.partName}:`, error)
          return {
            partId: part.id,
            partName: part.partsMaster.partName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      listingResults.push(...batchResults)

      // Update progress
      const processedCount = listingResults.length
      const successfulCount = listingResults.filter(r => r.success).length
      const failedCount = listingResults.filter(r => !r.success).length

      await prisma.bulkOperation.update({
        where: { id: bulkOperation.id },
        data: {
          processedParts: processedCount,
          successfulListings: successfulCount,
          failedListings: failedCount,
          progress: (processedCount / parts.length) * 100
        }
      })

      // Add delay between batches to respect eBay API limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay
      }
    }

    // Update final status
    const successfulListings = listingResults.filter(r => r.success)
    const failedListings = listingResults.filter(r => !r.success)

    await prisma.bulkOperation.update({
      where: { id: bulkOperation.id },
      data: {
        status: 'completed',
        progress: 100,
        successfulListings: successfulListings.length,
        failedListings: failedListings.length
      }
    })

    // Calculate summary statistics
    const totalListings = listingResults.length
    const totalSuccessful = successfulListings.length
    const totalFailed = failedListings.length
    const totalValue = successfulListings.reduce((sum, r) => sum + (r.listingPrice || 0), 0)
    const averagePrice = totalSuccessful > 0 ? totalValue / totalSuccessful : 0

    return NextResponse.json({
      success: true,
      message: `Bulk listing completed: ${totalSuccessful}/${totalListings} listings created successfully`,
      bulkOperationId: bulkOperation.id,
      summary: {
        totalParts: parts.length,
        totalSuccessful,
        totalFailed,
        totalValue,
        averagePrice
      },
      listings: successfulListings,
      errors: failedListings,
      vehicleInfo: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin
      }
    })

  } catch (error) {
    console.error('Bulk listing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to complete bulk listing',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const operationId = searchParams.get('operationId')

    if (operationId) {
      // Get specific bulk operation details
      const operation = await prisma.bulkOperation.findUnique({
        where: { id: operationId },
        include: {
          ebayListings: {
            include: {
              partsInventory: {
                include: {
                  partsMaster: true
                }
              }
            }
          }
        }
      })

      if (!operation) {
        return NextResponse.json(
          { success: false, message: 'Bulk operation not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        operation
      })
    }

    if (vehicleId) {
      // Get all bulk operations for a vehicle
      const operations = await prisma.bulkOperation.findMany({
        where: {
          selectedParts: {
            path: '$',
            string_contains: vehicleId
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          ebayListings: {
            take: 5,
            orderBy: { listingDate: 'desc' }
          }
        }
      })

      return NextResponse.json({
        success: true,
        operations
      })
    }

    return NextResponse.json(
      { success: false, message: 'Vehicle ID or Operation ID is required' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error fetching bulk operations:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch bulk operations',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
