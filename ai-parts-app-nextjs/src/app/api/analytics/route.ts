import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get basic counts
    const totalVehicles = await prisma.vehicle.count()
    const totalParts = await prisma.part.count()
    
    // Get total value
    const partsWithPrices = await prisma.part.findMany({
      where: { price: { not: null } },
      select: { price: true }
    })
    const totalValue = partsWithPrices.reduce((sum, part) => sum + (part.price || 0), 0)
    
    // Calculate average parts per vehicle
    const averagePartsPerVehicle = totalVehicles > 0 ? totalParts / totalVehicles : 0

    // Get category breakdown
    const categoryData = await prisma.part.groupBy({
      by: ['category'],
      _count: { category: true },
      _sum: { price: true }
    })

    const categoryBreakdown = categoryData.map(item => ({
      category: item.category,
      count: item._count.category,
      value: item._sum.price || 0
    }))

    // Get priority breakdown
    const priorityData = await prisma.part.groupBy({
      by: ['priority'],
      _count: { priority: true },
      _sum: { price: true }
    })

    const priorityBreakdown = priorityData.map(item => ({
      priority: item.priority,
      count: item._count.priority,
      value: item._sum.price || 0
    }))

    // Get top categories by count
    const topCategories = categoryData
      .sort((a, b) => b._count.category - a._count.category)
      .map(item => ({
        category: item.category,
        count: item._count.category
      }))

    // Get recent activity (recent parts and reports)
    const recentParts = await prisma.part.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { vehicle: true }
    })

    const recentReports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { vehicle: true }
    })

    // Combine and format recent activity
    const recentActivity = [
      ...recentParts.map(part => ({
        type: 'Part Added',
        description: `Added ${part.description} for ${part.vehicle.year} ${part.vehicle.make} ${part.vehicle.model}`,
        timestamp: part.createdAt.toISOString()
      })),
      ...recentReports.map(report => ({
        type: 'Report Generated',
        description: `Generated report: ${report.title}`,
        timestamp: report.createdAt.toISOString()
      }))
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    const analytics = {
      totalVehicles,
      totalParts,
      totalValue,
      averagePartsPerVehicle,
      categoryBreakdown,
      priorityBreakdown,
      recentActivity,
      topCategories
    }

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
