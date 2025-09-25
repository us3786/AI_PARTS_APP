import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { partId, vehicleId } = await request.json()
    
    if (!partId || !vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Part ID and Vehicle ID are required' },
        { status: 400 }
      )
    }

    console.log('🖼️ Mapping images for eBay upload - PartId:', partId, 'VehicleId:', vehicleId)

    // Find the part and its images
    let part = null
    
    // First try to find directly in partsMaster
    part = await prisma.partsMaster.findUnique({
      where: { id: partId },
      select: {
        id: true,
        partName: true,
        images: true,
        partsInventory: {
          where: { vehicleId },
          select: { id: true, vehicleId: true }
        }
      }
    })

    // If not found directly, try via partsInventory
    if (!part) {
      const partsInventory = await prisma.partsInventory.findUnique({
        where: { id: partId },
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

      if (partsInventory?.partsMaster) {
        part = {
          ...partsInventory.partsMaster,
          partsInventory: [{ id: partsInventory.id, vehicleId: partsInventory.vehicleId }]
        }
      }
    }

    if (!part) {
      return NextResponse.json(
        { success: false, message: 'Part not found' },
        { status: 404 }
      )
    }

    // Process images for eBay upload
    let ebayImages = []
    if (part.images && Array.isArray(part.images)) {
      ebayImages = part.images
        .filter(img => 
          typeof img === 'object' && 
          img.url && 
          !img.url.includes('via.placeholder.com') && 
          !img.url.includes('placeholder.com') &&
          !img.url.includes('data:image/svg') // Filter out SVG placeholders
        )
        .map((img, index) => ({
          id: `img_${index + 1}`,
          url: img.url,
          title: img.title || `${part.partName} - Image ${index + 1}`,
          source: img.source || 'database',
          isPrimary: index === 0, // First real image is primary
          ebayReady: true,
          metadata: {
            partId: part.id,
            partName: part.partName,
            vehicleId: vehicleId,
            uploadedAt: new Date().toISOString()
          }
        }))
    }

    // Add vehicle photos if available
    const vehiclePhotos = await prisma.vehiclePhoto.findMany({
      where: { vehicleId },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true
      },
      orderBy: { uploadedAt: 'desc' },
      take: 3 // Limit to 3 vehicle photos
    })

    // Add vehicle photos as additional images
    vehiclePhotos.forEach((photo, index) => {
      ebayImages.push({
        id: `vehicle_photo_${photo.id}`,
        url: `/api/vehicle-photos/${photo.id}`, // This would be your vehicle photo API endpoint
        title: `Vehicle Photo - ${photo.fileName}`,
        source: 'vehicle_upload',
        isPrimary: false,
        ebayReady: true,
        metadata: {
          type: 'vehicle_photo',
          photoId: photo.id,
          fileName: photo.fileName,
          fileSize: photo.fileSize,
          mimeType: photo.mimeType,
          uploadedAt: photo.uploadedAt.toISOString()
        }
      })
    })

    console.log(`✅ Mapped ${ebayImages.length} images for eBay upload (${part.images?.length || 0} part images + ${vehiclePhotos.length} vehicle photos)`)

    return NextResponse.json({
      success: true,
      partId: part.id,
      partName: part.partName,
      vehicleId: vehicleId,
      images: ebayImages,
      imageCount: ebayImages.length,
      primaryImage: ebayImages.find(img => img.isPrimary) || ebayImages[0] || null,
      summary: {
        partImages: part.images?.length || 0,
        vehiclePhotos: vehiclePhotos.length,
        totalEbayReady: ebayImages.length
      }
    })

  } catch (error) {
    console.error('❌ Error mapping images for eBay:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to map images for eBay upload',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
