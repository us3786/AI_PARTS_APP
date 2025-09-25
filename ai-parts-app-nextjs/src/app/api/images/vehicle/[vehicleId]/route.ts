import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const { vehicleId } = await params

    console.log(`📸 Fetching all images for vehicle: ${vehicleId}`)

    // Get all vehicle photos
    const vehiclePhotos = await prisma.vehiclePhoto.findMany({
      where: { vehicleId },
      orderBy: { uploadedAt: 'desc' }
    })

    // Get all parts with images for this vehicle
    const partsWithImages = await prisma.partsInventory.findMany({
      where: { vehicleId },
      include: {
        partsMaster: {
          select: {
            id: true,
            partName: true,
            images: true
          }
        }
      }
    })

    // Transform vehicle photos to ImageData format
    const vehicleImageData = vehiclePhotos.map(photo => ({
      id: photo.id,
      url: photo.url,
      source: 'vehicle_upload',
      title: photo.originalName || 'Vehicle Photo',
      quality: 95, // Assume high quality for uploaded photos
      dimensions: photo.width && photo.height ? `${photo.width}x${photo.height}` : 'Unknown',
      addedDate: photo.uploadedAt.toISOString(),
      isCustom: true,
      vehicleId: photo.vehicleId
    }))

    // Transform parts images to ImageData format
    const partsImageData: any[] = []
    partsWithImages.forEach(inventoryItem => {
      if (inventoryItem.partsMaster?.images && Array.isArray(inventoryItem.partsMaster.images)) {
        inventoryItem.partsMaster.images.forEach((image: any, index: number) => {
          if (typeof image === 'object' && image.url && !image.url.includes('placeholder')) {
            partsImageData.push({
              id: `${inventoryItem.partsMaster.id}_${index}`,
              url: image.url,
              source: image.source || 'hunted',
              title: image.title || inventoryItem.partsMaster.partName,
              quality: image.quality || 80,
              dimensions: image.dimensions || 'Unknown',
              listingUrl: image.listingUrl,
              addedDate: image.addedDate || new Date().toISOString(),
              isCustom: false,
              partId: inventoryItem.partsMaster.id,
              partName: inventoryItem.partsMaster.partName,
              vehicleId: vehicleId
            })
          }
        })
      }
    })

    // Combine all images
    const allImages = [...vehicleImageData, ...partsImageData]

    console.log(`✅ Found ${vehiclePhotos.length} vehicle photos and ${partsImageData.length} part images`)

    return NextResponse.json({
      success: true,
      images: allImages,
      counts: {
        vehiclePhotos: vehiclePhotos.length,
        partImages: partsImageData.length,
        total: allImages.length
      }
    })

  } catch (error) {
    console.error('❌ Error fetching vehicle images:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch images' },
      { status: 500 }
    )
  }
}
