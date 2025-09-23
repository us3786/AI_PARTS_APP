import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { operation, partIds, vehicleId, additionalData } = await request.json()
    
    if (!operation || !partIds || !Array.isArray(partIds) || partIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Operation, part IDs, and vehicle ID are required' },
        { status: 400 }
      )
    }

    let result

    switch (operation) {
      case 'updateStatus':
        const { status } = additionalData
        if (!status) {
          return NextResponse.json(
            { success: false, message: 'Status is required for updateStatus operation' },
            { status: 400 }
          )
        }
        
        result = await prisma.partsInventory.updateMany({
          where: {
            id: { in: partIds },
            vehicleId: vehicleId
          },
          data: { status }
        })
        
        return NextResponse.json({
          success: true,
          message: `Updated ${result.count} parts to ${status} status`,
          updatedCount: result.count
        })

      case 'updateCondition':
        const { condition } = additionalData
        if (!condition) {
          return NextResponse.json(
            { success: false, message: 'Condition is required for updateCondition operation' },
            { status: 400 }
          )
        }
        
        result = await prisma.partsInventory.updateMany({
          where: {
            id: { in: partIds },
            vehicleId: vehicleId
          },
          data: { condition }
        })
        
        return NextResponse.json({
          success: true,
          message: `Updated ${result.count} parts to ${condition} condition`,
          updatedCount: result.count
        })

      case 'updateValue':
        const { value } = additionalData
        if (value === undefined || value === null) {
          return NextResponse.json(
            { success: false, message: 'Value is required for updateValue operation' },
            { status: 400 }
          )
        }
        
        result = await prisma.partsInventory.updateMany({
          where: {
            id: { in: partIds },
            vehicleId: vehicleId
          },
          data: { currentValue: parseFloat(value) }
        })
        
        return NextResponse.json({
          success: true,
          message: `Updated ${result.count} parts value to $${value}`,
          updatedCount: result.count
        })

      case 'update':
        const updateData: any = {}
        if (additionalData.condition) updateData.condition = additionalData.condition
        if (additionalData.status) updateData.status = additionalData.status
        if (additionalData.currentValue !== undefined) updateData.currentValue = additionalData.currentValue
        if (additionalData.location !== undefined) updateData.location = additionalData.location
        if (additionalData.notes !== undefined) updateData.notes = additionalData.notes
        
        result = await prisma.partsInventory.updateMany({
          where: {
            id: { in: partIds },
            vehicleId: vehicleId
          },
          data: updateData
        })
        
        return NextResponse.json({
          success: true,
          message: `Updated ${result.count} parts`,
          updatedCount: result.count
        })

      case 'delete':
        result = await prisma.partsInventory.deleteMany({
          where: {
            id: { in: partIds },
            vehicleId: vehicleId
          }
        })
        
        return NextResponse.json({
          success: true,
          message: `Deleted ${result.count} parts from inventory`,
          deletedCount: result.count
        })

      case 'createBulkListing':
        const { listingTemplate, pricingStrategy } = additionalData
        
        // Create a bulk operation record
        const bulkOperation = await prisma.bulkOperation.create({
          data: {
            operationName: `Bulk Listing - ${new Date().toLocaleString()}`,
            selectedParts: partIds,
            listingTemplate: listingTemplate || {},
            pricingStrategy: pricingStrategy || {},
            status: 'pending',
            totalParts: partIds.length,
            processedParts: 0,
            successfulListings: 0,
            failedListings: 0
          }
        })

        // Update parts status to 'listed'
        await prisma.partsInventory.updateMany({
          where: {
            id: { in: partIds },
            vehicleId: vehicleId
          },
          data: { 
            status: 'listed',
            bulkOperationId: bulkOperation.id
          }
        })

        return NextResponse.json({
          success: true,
          message: `Created bulk listing operation for ${partIds.length} parts`,
          bulkOperationId: bulkOperation.id,
          totalParts: partIds.length
        })

      default:
        return NextResponse.json(
          { success: false, message: `Unknown operation: ${operation}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to perform bulk operation',
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
              partsMaster: true,
              partsInventory: true
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
            array_contains: vehicleId
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
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
