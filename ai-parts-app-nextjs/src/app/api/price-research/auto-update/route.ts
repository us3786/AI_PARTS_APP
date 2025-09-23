import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { vehicleId, updateInterval = 'daily', categories = [] } = await request.json()
    
    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Starting automated price update for vehicle: ${vehicleId}`)

    // Get parts that need price updates
    const whereClause: any = {
      vehicleId: vehicleId,
      status: { in: ['available', 'listed'] } // Only update prices for available/listed parts
    }

    if (categories.length > 0) {
      whereClause.partsMaster = {
        category: { in: categories }
      }
    }

    const partsToUpdate = await prisma.partsInventory.findMany({
      where: whereClause,
      include: {
        partsMaster: true,
        priceResearch: {
          where: { isActive: true },
          orderBy: { researchDate: 'desc' },
          take: 1
        }
      }
    })

    console.log(`Found ${partsToUpdate.length} parts to update`)

    const updateResults = []
    const errors = []

    // Process parts in batches
    const batchSize = 10
    const batches = []
    for (let i = 0; i < partsToUpdate.length; i += batchSize) {
      batches.push(partsToUpdate.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (part) => {
        try {
          // Check if part needs price update based on interval
          const lastUpdate = part.priceResearch[0]?.researchDate
          const needsUpdate = shouldUpdatePrice(lastUpdate, updateInterval)

          if (!needsUpdate) {
            return {
              partId: part.id,
              partName: part.partsMaster.partName,
              skipped: true,
              reason: 'Recent update available'
            }
          }

          console.log(`Updating price for: ${part.partsMaster.partName}`)

          // Perform price research
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000'}/api/price-research`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              partId: part.partsMasterId,
              partName: part.partsMaster.partName,
              make: part.vehicle.make,
              model: part.vehicle.model,
              year: part.vehicle.year,
              category: part.partsMaster.category,
              subCategory: part.partsMaster.subCategory
            })
          })

          const data = await response.json()

          if (data.success && data.marketAnalysis) {
            // Update part price if significant change
            const currentPrice = part.currentValue || 0
            const newPrice = data.marketAnalysis.recommendedPrice
            const priceChange = Math.abs(newPrice - currentPrice) / currentPrice

            // Only update if price changed by more than 10%
            if (priceChange > 0.1 || currentPrice === 0) {
              await prisma.partsInventory.update({
                where: { id: part.id },
                data: { 
                  currentValue: newPrice,
                  updatedAt: new Date()
                }
              })
            }

            return {
              partId: part.id,
              partName: part.partsMaster.partName,
              success: true,
              oldPrice: currentPrice,
              newPrice: newPrice,
              priceChange: priceChange,
              sources: data.totalSources,
              marketTrend: data.marketAnalysis.marketTrend
            }
          } else {
            throw new Error(data.message || 'Price research failed')
          }

        } catch (error) {
          console.error(`Error updating ${part.partsMaster.partName}:`, error)
          return {
            partId: part.id,
            partName: part.partsMaster.partName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      updateResults.push(...batchResults)

      // Delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Separate successful and failed updates
    const successfulUpdates = updateResults.filter(r => r.success)
    const failedUpdates = updateResults.filter(r => !r.success && !r.skipped)
    const skippedUpdates = updateResults.filter(r => r.skipped)

    // Calculate summary statistics
    const totalUpdated = successfulUpdates.length
    const totalFailed = failedUpdates.length
    const totalSkipped = skippedUpdates.length
    const totalValueChange = successfulUpdates.reduce((sum, r) => {
      return sum + (r.newPrice - r.oldPrice)
    }, 0)

    // Log update summary to database
    await prisma.settings.upsert({
      where: { key: `last_price_update_${vehicleId}` },
      update: {
        value: new Date().toISOString(),
        description: `Last automated price update for vehicle ${vehicleId}`
      },
      create: {
        key: `last_price_update_${vehicleId}`,
        value: new Date().toISOString(),
        description: `Last automated price update for vehicle ${vehicleId}`
      }
    })

    return NextResponse.json({
      success: true,
      message: `Automated price update completed: ${totalUpdated} updated, ${totalFailed} failed, ${totalSkipped} skipped`,
      summary: {
        totalParts: partsToUpdate.length,
        totalUpdated,
        totalFailed,
        totalSkipped,
        totalValueChange,
        updateInterval
      },
      updates: successfulUpdates,
      errors: failedUpdates,
      skipped: skippedUpdates
    })

  } catch (error) {
    console.error('Automated price update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to complete automated price update',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Determine if a part needs price update based on interval
function shouldUpdatePrice(lastUpdate: Date | undefined, interval: string): boolean {
  if (!lastUpdate) return true // No previous update

  const now = new Date()
  const timeDiff = now.getTime() - lastUpdate.getTime()
  
  switch (interval.toLowerCase()) {
    case 'hourly':
      return timeDiff > 60 * 60 * 1000 // 1 hour
    case 'daily':
      return timeDiff > 24 * 60 * 60 * 1000 // 1 day
    case 'weekly':
      return timeDiff > 7 * 24 * 60 * 60 * 1000 // 1 week
    case 'monthly':
      return timeDiff > 30 * 24 * 60 * 60 * 1000 // 1 month
    default:
      return timeDiff > 24 * 60 * 60 * 1000 // Default to daily
  }
}

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

    // Get last update information
    const lastUpdate = await prisma.settings.findUnique({
      where: { key: `last_price_update_${vehicleId}` }
    })

    // Get recent price research activity
    const recentActivity = await prisma.priceResearch.findMany({
      where: {
        partsMaster: {
          partsInventory: {
            some: {
              vehicleId: vehicleId
            }
          }
        },
        isActive: true
      },
      include: {
        partsMaster: true
      },
      orderBy: { researchDate: 'desc' },
      take: 20
    })

    // Group by date for activity summary
    const activityByDate = recentActivity.reduce((acc, research) => {
      const date = research.researchDate.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          parts: new Set()
        }
      }
      acc[date].count++
      acc[date].parts.add(research.partsMasterId)
      return acc
    }, {} as any)

    const activitySummary = Object.values(activityByDate).map((activity: any) => ({
      date: activity.date,
      researchCount: activity.count,
      uniqueParts: activity.parts.size
    }))

    return NextResponse.json({
      success: true,
      lastUpdate: lastUpdate?.value || null,
      recentActivity: activitySummary,
      totalRecentResearch: recentActivity.length
    })

  } catch (error) {
    console.error('Error fetching auto-update status:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch auto-update status',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
