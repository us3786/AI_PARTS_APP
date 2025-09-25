import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partId = searchParams.get('partId')
    const vehicleId = searchParams.get('vehicleId')

    console.log('🔍 Fetching images for partId:', partId, 'vehicleId:', vehicleId)

    if (!partId) {
      return NextResponse.json(
        { success: false, message: 'Part ID is required' },
        { status: 400 }
      )
    }

    // Find the part and its images
    const part = await prisma.partsMaster.findUnique({
      where: { id: partId },
      select: {
        id: true,
        partName: true,
        images: true
      }
    })

    if (!part) {
      return NextResponse.json(
        { success: false, message: 'Part not found' },
        { status: 404 }
      )
    }

    // Extract images from the part
    let images = []
    if (part.images && Array.isArray(part.images)) {
      images = part.images.filter(img => 
        typeof img === 'object' && 
        img.url && 
        !img.url.includes('via.placeholder.com') && 
        !img.url.includes('placeholder.com')
      )
    }

    console.log(`✅ Found ${images.length} real images for part: ${part.partName}`)

    return NextResponse.json({
      success: true,
      partId: part.id,
      partName: part.partName,
      images: images,
      totalImages: images.length
    })

  } catch (error) {
    console.error('❌ Error fetching part images:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch part images',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}