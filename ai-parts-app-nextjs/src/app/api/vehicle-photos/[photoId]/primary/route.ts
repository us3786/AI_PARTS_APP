import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    const photoId = params.photoId

    // Get photo details
    const photo = await prisma.vehiclePhoto.findUnique({
      where: { id: photoId }
    })

    if (!photo) {
      return NextResponse.json(
        { success: false, message: 'Photo not found' },
        { status: 404 }
      )
    }

    // Remove primary status from all other photos of this vehicle
    await prisma.vehiclePhoto.updateMany({
      where: { 
        vehicleId: photo.vehicleId,
        isPrimary: true
      },
      data: { isPrimary: false }
    })

    // Set this photo as primary
    await prisma.vehiclePhoto.update({
      where: { id: photoId },
      data: { isPrimary: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Primary photo updated successfully'
    })

  } catch (error) {
    console.error('Error updating primary photo:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update primary photo',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
