import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const days = parseInt(searchParams.get('days') || '30')

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Get date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get listings for the vehicle within date range
    const listings = await prisma.ebayListing.findMany({
      where: {
        partsInventory: {
          vehicleId: vehicleId
        },
        listingDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        partsInventory: {
          include: {
            partsMaster: true
          }
        }
      },
      orderBy: { listingDate: 'desc' }
    })

    // Calculate performance metrics
    const totalListings = listings.length
    const activeListings = listings.filter(l => l.status === 'listed').length
    const soldListings = listings.filter(l => l.status === 'sold').length
    const endedListings = listings.filter(l => l.status === 'ended').length

    const totalListedValue = listings
      .filter(l => l.status === 'listed')
      .reduce((sum, l) => sum + l.price, 0)

    const totalSoldValue = listings
      .filter(l => l.status === 'sold')
      .reduce((sum, l) => sum + l.price, 0)

    const averageListingPrice = totalListings > 0 
      ? listings.reduce((sum, l) => sum + l.price, 0) / totalListings 
      : 0

    const sellThroughRate = totalListings > 0 
      ? (soldListings / totalListings) * 100 
      : 0

    // Category performance
    const categoryStats = listings.reduce((acc, listing) => {
      const category = listing.partsInventory.partsMaster.category
      if (!acc[category]) {
        acc[category] = {
          totalListings: 0,
          soldListings: 0,
          totalValue: 0,
          soldValue: 0
        }
      }
      
      acc[category].totalListings++
      acc[category].totalValue += listing.price
      
      if (listing.status === 'sold') {
        acc[category].soldListings++
        acc[category].soldValue += listing.price
      }
      
      return acc
    }, {} as any)

    // Convert to array and calculate rates
    const categoryPerformance = Object.entries(categoryStats).map(([category, stats]: [string, any]) => ({
      category,
      totalListings: stats.totalListings,
      soldListings: stats.soldListings,
      totalValue: stats.totalValue,
      soldValue: stats.soldValue,
      sellThroughRate: stats.totalListings > 0 ? (stats.soldListings / stats.totalListings) * 100 : 0,
      averagePrice: stats.totalListings > 0 ? stats.totalValue / stats.totalListings : 0
    })).sort((a, b) => b.totalValue - a.totalValue)

    // Recent activity (last 7 days)
    const recentStartDate = new Date()
    recentStartDate.setDate(recentStartDate.getDate() - 7)

    const recentListings = listings.filter(l => 
      l.listingDate >= recentStartDate
    )

    // Performance trends (weekly breakdown)
    const weeklyStats = []
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() - i * 7)

      const weekListings = listings.filter(l => 
        l.listingDate >= weekStart && l.listingDate < weekEnd
      )

      weeklyStats.push({
        week: weekStart.toISOString().split('T')[0],
        listings: weekListings.length,
        sold: weekListings.filter(l => l.status === 'sold').length,
        value: weekListings.reduce((sum, l) => sum + l.price, 0)
      })
    }

    // Top performing parts
    const partPerformance = listings.reduce((acc, listing) => {
      const partName = listing.partsInventory.partsMaster.partName
      if (!acc[partName]) {
        acc[partName] = {
          partName,
          totalListings: 0,
          soldListings: 0,
          totalValue: 0,
          averagePrice: 0
        }
      }
      
      acc[partName].totalListings++
      acc[partName].totalValue += listing.price
      acc[partName].averagePrice = acc[partName].totalValue / acc[partName].totalListings
      
      if (listing.status === 'sold') {
        acc[partName].soldListings++
      }
      
      return acc
    }, {} as any)

    const topPerformingParts = Object.values(partPerformance)
      .map((part: any) => ({
        ...part,
        sellThroughRate: part.totalListings > 0 ? (part.soldListings / part.totalListings) * 100 : 0
      }))
      .sort((a: any, b: any) => b.totalValue - a.totalValue)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      summary: {
        period: `${days} days`,
        totalListings,
        activeListings,
        soldListings,
        endedListings,
        totalListedValue,
        totalSoldValue,
        averageListingPrice: Math.round(averageListingPrice),
        sellThroughRate: Math.round(sellThroughRate * 100) / 100
      },
      categoryPerformance,
      recentActivity: {
        period: 'Last 7 days',
        newListings: recentListings.length,
        recentListings: recentListings.slice(0, 5)
      },
      weeklyTrends: weeklyStats,
      topPerformingParts
    })

  } catch (error) {
    console.error('Error fetching listing performance:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch listing performance',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { listingId, action, data } = await request.json()
    
    if (!listingId || !action) {
      return NextResponse.json(
        { success: false, message: 'Listing ID and action are required' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'updateStatus':
        const { status } = data
        result = await prisma.ebayListing.update({
          where: { id: listingId },
          data: { 
            status,
            updatedAt: new Date()
          }
        })
        break

      case 'updatePrice':
        const { price } = data
        result = await prisma.ebayListing.update({
          where: { id: listingId },
          data: { 
            price: parseFloat(price),
            updatedAt: new Date()
          }
        })
        break

      case 'endListing':
        result = await prisma.ebayListing.update({
          where: { id: listingId },
          data: { 
            status: 'ended',
            endDate: new Date(),
            updatedAt: new Date()
          }
        })
        break

      case 'relist':
        result = await prisma.ebayListing.update({
          where: { id: listingId },
          data: { 
            status: 'listed',
            listingDate: new Date(),
            endDate: null,
            updatedAt: new Date()
          }
        })
        break

      default:
        return NextResponse.json(
          { success: false, message: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action} for listing`,
      listing: result
    })

  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update listing',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
