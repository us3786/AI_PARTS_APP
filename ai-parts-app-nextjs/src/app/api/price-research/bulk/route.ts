import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { vehicleId, partIds, forceRefresh = false } = await request.json()
    
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
    const cachedResults = []
    let processedCount = 0

    // Check for existing price research data if not forcing refresh
    if (!forceRefresh) {
      console.log('🔍 Checking for existing price research data...')
      
      for (const part of parts) {
        const existingResearch = await prisma.priceResearch.findFirst({
          where: {
            partsMasterId: part.partsMasterId,
            isActive: true
          },
          orderBy: { researchDate: 'desc' }
        })

        if (existingResearch) {
          // Check if research is recent (within last 7 days)
          const researchAge = Date.now() - new Date(existingResearch.researchDate).getTime()
          const isRecent = researchAge < (7 * 24 * 60 * 60 * 1000) // 7 days
          
          if (isRecent) {
            console.log(`✅ Using cached data for: ${part.partsMaster.partName}`)
            cachedResults.push({
              partId: part.partsMasterId,
              partsInventoryId: part.id,
              partsMasterId: part.partsMasterId,
              partName: part.partsMaster.partName,
              success: true,
              cached: true,
              marketAnalysis: existingResearch.marketAnalysis,
              researchDate: existingResearch.researchDate
            })
            continue
          } else {
            console.log(`⏰ Research data is stale for: ${part.partsMaster.partName}, refreshing...`)
          }
        }
      }
    }

    const partsToResearch = forceRefresh ? parts : parts.filter(part => 
      !cachedResults.some(cached => cached.partsMasterId === part.partsMasterId)
    )

    console.log(`📊 Research summary: ${cachedResults.length} cached, ${partsToResearch.length} to research`)

    // Process parts that need research
    for (const part of partsToResearch) {
      try {
        processedCount++
        console.log(`Processing part ${processedCount}/${partsToResearch.length}: ${part.partsMaster.partName}`)
        
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
            cached: false,
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

    // Combine cached and new results
    const allResults = [...cachedResults, ...results]

    return NextResponse.json({
      success: true,
      message: `Bulk price research completed. ${allResults.length} total results (${cachedResults.length} cached, ${results.length} new), ${errors.length} failed.`,
      results: allResults,
      cachedResults,
      newResults: results,
      errors,
      totalProcessed: parts.length,
      totalSuccessful: allResults.length,
      cachedCount: cachedResults.length,
      newCount: results.length,
      failed: errors.length,
      progress: {
        total: parts.length,
        processed: processedCount,
        cached: cachedResults.length,
        remaining: partsToResearch.length - processedCount
      }
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