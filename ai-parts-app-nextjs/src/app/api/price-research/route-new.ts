import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { partId, partName, make, model, year, category, vehicleId } = await request.json()
    
    if (!partId || !partName || !vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Part ID, name, and vehicle ID are required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Reading price research for: ${partName} (${year} ${make} ${model})`)

    // FIRST: Check if we already have recent price research data
    const existingResearch = await prisma.priceResearch.findFirst({
      where: {
        partsMasterId: partId,
        isActive: true,
        researchDate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        partsMaster: true
      }
    })

    if (existingResearch) {
      console.log(`✅ Using existing price research data for ${partName}`)
      return NextResponse.json({
        success: true,
        partId: partId,
        partName: partName,
        sources: existingResearch.sources || 1,
        marketAnalysis: existingResearch.marketAnalysis || {},
        recommendedPrice: existingResearch.recommendedPrice || 0,
        fromCache: true,
        researchDate: existingResearch.researchDate
      })
    }

    // SECOND: If no recent data, trigger background research and return any existing data
    console.log(`🔄 No recent data found, triggering background research for ${partName}`)
    
    // Trigger background price research (non-blocking)
    fetch(`${process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000'}/api/background/price-research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partId,
        partName,
        make,
        model,
        year,
        category,
        vehicleId
      })
    }).catch(err => console.error('Background price research trigger failed:', err))

    // Return any existing data or placeholder
    const fallbackResearch = await prisma.priceResearch.findFirst({
      where: {
        partsMasterId: partId,
        isActive: true
      },
      orderBy: { researchDate: 'desc' }
    })

    if (fallbackResearch) {
      return NextResponse.json({
        success: true,
        partId: partId,
        partName: partName,
        sources: fallbackResearch.sources || 1,
        marketAnalysis: fallbackResearch.marketAnalysis || {},
        recommendedPrice: fallbackResearch.recommendedPrice || 0,
        fromCache: true,
        researchDate: fallbackResearch.researchDate,
        note: 'Background research in progress'
      })
    }

    // No data available yet
    return NextResponse.json({
      success: false,
      message: 'No price research data available yet. Background research started.',
      partId: partId,
      partName: partName
    })

  } catch (error) {
    console.error('Price research error:', error)
    return NextResponse.json(
      { success: false, message: 'Price research failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const partId = searchParams.get('partId')

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Get all price research data for this vehicle
    const whereClause: any = {
      vehicleId: vehicleId,
      isActive: true
    }

    if (partId) {
      whereClause.partsMasterId = partId
    }

    const researchData = await prisma.priceResearch.findMany({
      where: whereClause,
      include: {
        partsMaster: {
          select: {
            id: true,
            partName: true,
            category: true
          }
        }
      },
      orderBy: { researchDate: 'desc' }
    })

    return NextResponse.json({
      success: true,
      vehicleId: vehicleId,
      researchData: researchData,
      totalRecords: researchData.length
    })

  } catch (error) {
    console.error('Error fetching price research data:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch price research data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
