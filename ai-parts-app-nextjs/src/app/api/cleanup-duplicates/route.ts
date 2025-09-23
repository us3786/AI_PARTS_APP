import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { vehicleId } = await request.json()
    
    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Find duplicate parts for this vehicle
    const duplicates = await prisma.partsInventory.groupBy({
      by: ['vehicleId', 'partsMasterId'],
      where: { vehicleId },
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      }
    })

    console.log(`Found ${duplicates.length} duplicate part groups for vehicle ${vehicleId}`)

    let removedCount = 0

    // Remove duplicates, keeping only the first one
    for (const duplicate of duplicates) {
      const partsToRemove = await prisma.partsInventory.findMany({
        where: {
          vehicleId: duplicate.vehicleId,
          partsMasterId: duplicate.partsMasterId
        },
        orderBy: {
          createdAt: 'asc'
        },
        skip: 1 // Skip the first one (keep it)
      })

      if (partsToRemove.length > 0) {
        const idsToRemove = partsToRemove.map(part => part.id)
        await prisma.partsInventory.deleteMany({
          where: {
            id: { in: idsToRemove }
          }
        })
        removedCount += partsToRemove.length
      }
    }

    // Get final count
    const finalCount = await prisma.partsInventory.count({
      where: { vehicleId }
    })

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${removedCount} duplicate parts`,
      duplicatesRemoved: removedCount,
      finalPartCount: finalCount
    })

  } catch (error) {
    console.error('Error cleaning up duplicates:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to clean up duplicates',
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

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Get duplicate analysis
    const duplicates = await prisma.partsInventory.groupBy({
      by: ['vehicleId', 'partsMasterId'],
      where: { vehicleId },
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      }
    })

    const totalParts = await prisma.partsInventory.count({
      where: { vehicleId }
    })

    const uniqueParts = await prisma.partsInventory.groupBy({
      by: ['partsMasterId'],
      where: { vehicleId }
    })

    return NextResponse.json({
      success: true,
      totalParts,
      uniqueParts: uniqueParts.length,
      duplicateGroups: duplicates.length,
      duplicates: duplicates.map(d => ({
        partsMasterId: d.partsMasterId,
        count: d._count.id
      }))
    })

  } catch (error) {
    console.error('Error analyzing duplicates:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to analyze duplicates',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
