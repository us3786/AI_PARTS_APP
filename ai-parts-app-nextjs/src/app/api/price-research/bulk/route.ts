import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { vehicleId, partIds } = await request.json()
    
    if (!vehicleId || !Array.isArray(partIds)) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID and part IDs array are required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Starting bulk price research for vehicle ${vehicleId} with ${partIds.length} parts`)

    // Get vehicle details including trim level, engine size, and drive type
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { make: true, model: true, year: true, trimLevel: true, engine: true, driveType: true }
    })

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Get parts details - if partIds is empty, get all parts for the vehicle
    const parts = await prisma.partsInventory.findMany({
      where: {
        ...(partIds.length > 0 ? { id: { in: partIds } } : {}),
        vehicleId: vehicleId
      },
      include: {
        partsMaster: true
      }
    })

    if (parts.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No parts found for this vehicle' },
        { status: 404 }
      )
    }

    const results = []
    const errors = []

    // Process each part individually
    for (const part of parts) {
      try {
        console.log(`Processing part: ${part.partsMaster.partName}`)
        
        // Call the individual price research API with trim level, engine size, and drive type
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/price-research`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partId: part.partsMasterId,
            partName: part.partsMaster.partName,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            trimLevel: vehicle.trimLevel,
            engineSize: vehicle.engine,
            driveType: vehicle.driveType,
            category: part.partsMaster.category,
            subCategory: part.partsMaster.subCategory
          })
        })

        const data = await response.json()
        
        if (data.success) {
          results.push({
            partId: part.partsMasterId, // Use partsMasterId for image hunting
            partsInventoryId: part.id, // Keep inventory ID for reference
            partsMasterId: part.partsMasterId,
            partName: part.partsMaster.partName,
            success: true,
            marketAnalysis: data.marketAnalysis,
            researchResults: data.researchResults
          })
        } else {
          errors.push({
            partId: part.id,
            partName: part.partsMaster.partName,
            error: data.message
          })
        }
      } catch (error) {
        console.error(`Error processing part ${part.partsMaster.partName}:`, error)
        errors.push({
          partId: part.id,
          partName: part.partsMaster.partName,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk price research completed. ${results.length} successful, ${errors.length} failed.`,
      results,
      errors,
      totalProcessed: parts.length,
      successful: results.length,
      failed: errors.length
    })

  } catch (error) {
    console.error('Bulk price research error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to complete bulk price research',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}