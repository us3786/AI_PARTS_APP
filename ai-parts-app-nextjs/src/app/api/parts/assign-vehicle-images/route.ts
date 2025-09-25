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

    console.log(`🖼️ Assigning vehicle photos to all parts for vehicle: ${vehicleId}`)

    // Get all vehicle photos for this vehicle
    const vehiclePhotos = await prisma.vehiclePhoto.findMany({
      where: { vehicleId },
      select: {
        id: true,
        filename: true,
        filePath: true,
        fileSize: true,
        mimeType: true,
        width: true,
        height: true,
        uploadedAt: true,
        description: true
      }
    })

    if (vehiclePhotos.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No vehicle photos found for this vehicle'
      })
    }

    // Get all parts for this vehicle
    const parts = await prisma.partsInventory.findMany({
      where: { vehicleId },
      include: {
        partsMaster: true
      }
    })

    if (parts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No parts found for this vehicle'
      })
    }

    console.log(`📸 Found ${vehiclePhotos.length} vehicle photos and ${parts.length} parts`)

    // Convert vehicle photos to image format for parts
    const vehicleImages = vehiclePhotos.map(photo => ({
      url: photo.filePath || `/uploads/vehicles/${vehicleId}/${photo.filename}`,
      source: 'Vehicle Photo',
      title: photo.description || `Vehicle Photo - ${photo.filename}`,
      quality: 95,
      dimensions: `${photo.width}x${photo.height}`,
      addedDate: photo.uploadedAt.toISOString(),
      isCustom: true,
      vehiclePhotoId: photo.id
    }))

    // Update each part with vehicle images
    let updatedParts = 0
    for (const part of parts) {
      try {
        // Get existing images for this part
        const existingImages = Array.isArray(part.partsMaster.images) ? part.partsMaster.images : []
        
        // Filter out existing vehicle photos to avoid duplicates
        const existingVehiclePhotoIds = existingImages
          .filter((img: any) => img.vehiclePhotoId)
          .map((img: any) => img.vehiclePhotoId)
        
        // Add only new vehicle photos
        const newVehicleImages = vehicleImages.filter(img => 
          !existingVehiclePhotoIds.includes(img.vehiclePhotoId)
        )
        
        if (newVehicleImages.length > 0) {
          const updatedImages = [...existingImages, ...newVehicleImages]
          
          // Limit to 6 images for eBay compatibility
          const limitedImages = updatedImages.slice(0, 6)
          
          await prisma.partsMaster.update({
            where: { id: part.partsMasterId },
            data: {
              images: limitedImages
            }
          })
          
          updatedParts++
          console.log(`✅ Updated ${part.partsMaster.partName} with ${newVehicleImages.length} vehicle photos`)
        }
      } catch (error) {
        console.error(`❌ Error updating part ${part.partsMaster.partName}:`, error)
      }
    }

    console.log(`🎉 Successfully assigned vehicle photos to ${updatedParts} parts`)

    return NextResponse.json({
      success: true,
      message: `Successfully assigned vehicle photos to ${updatedParts} parts`,
      vehiclePhotos: vehiclePhotos.length,
      partsUpdated: updatedParts,
      totalParts: parts.length
    })

  } catch (error) {
    console.error('❌ Error assigning vehicle photos to parts:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to assign vehicle photos to parts',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
