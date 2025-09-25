import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    
    console.log('Price research history request for vehicleId:', vehicleId)
    
    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Get price research history for this vehicle
    console.log('Querying price research history...')
    const priceHistory = await prisma.priceResearch.findMany({
      where: {
        partsMaster: {
          partsInventory: {
            some: {
              vehicleId: vehicleId
            }
          }
        }
      },
      include: {
        partsMaster: true
      },
      orderBy: {
        researchDate: 'desc'
      }
    })
    
    console.log('Found price history records:', priceHistory.length)

    // Transform the data for the frontend
    const transformedHistory = priceHistory.map(item => ({
      id: item.id,
      partsMasterId: item.partsMaster.id, // Add this critical field
      partName: item.partsMaster.partName,
      category: item.partsMaster.category,
      subCategory: item.partsMaster.subCategory,
      make: item.make || 'Unknown',
      model: item.model || 'Unknown',
      year: item.year || 0,
      averagePrice: item.averagePrice || item.price,
      minPrice: item.minPrice || item.price,
      maxPrice: item.maxPrice || item.price,
      medianPrice: item.medianPrice || item.price,
      marketTrend: item.marketTrend || 'stable',
      confidence: item.confidence || 75,
      sources: item.sources || 1,
      researchDate: item.researchDate,
      isActive: item.isActive,
      marketAnalysis: item.marketAnalysis
    }))

    return NextResponse.json({
      success: true,
      history: transformedHistory,
      total: transformedHistory.length
    })

  } catch (error) {
    console.error('Error fetching price history:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch price history',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
