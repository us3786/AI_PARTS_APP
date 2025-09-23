import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { imageStorage } from '@/lib/imageStorage'
import { imageProcessor } from '@/lib/imageProcessor'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const vehicleId = formData.get('vehicleId') as string
    
    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    })

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found' },
        { status: 404 }
      )
    }

    const photos = formData.getAll('photos') as File[]
    const descriptions = formData.getAll('descriptions') as string[]

    if (photos.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No photos provided' },
        { status: 400 }
      )
    }

    // Validate file sizes and types
    const maxSize = 10 * 1024 * 1024 // 10MB
    const validPhotos = photos.filter(photo => {
      if (!photo.type.startsWith('image/')) {
        console.warn(`Skipping non-image file: ${photo.name}`)
        return false
      }
      if (photo.size > maxSize) {
        console.warn(`Skipping oversized file: ${photo.name} (${photo.size} bytes)`)
        return false
      }
      return true
    })

    if (validPhotos.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid image files provided' },
        { status: 400 }
      )
    }

    // Process images using professional image storage
    const storedImages = await imageStorage.storeVehiclePhotos(
      vehicleId,
      validPhotos,
      descriptions
    )

    const uploadedPhotos = []

    // Save processed images to database
    for (let i = 0; i < storedImages.length; i++) {
      const storedImage = storedImages[i]
      const description = descriptions[i] || `Vehicle photo ${i + 1}`

      const vehiclePhoto = await prisma.vehiclePhoto.create({
        data: {
          vehicleId: vehicleId,
          filename: storedImage.id,
          originalName: validPhotos[i].name,
          url: storedImage.cdnUrls.original,
          thumbnailUrl: storedImage.cdnUrls.thumbnail,
          fileSize: storedImage.metadata.size,
          mimeType: `image/${storedImage.metadata.format}`,
          width: storedImage.metadata.width,
          height: storedImage.metadata.height,
          isPrimary: false,
          tags: ['vehicle', 'parts', 'professional'],
          description: description,
          processedAt: new Date()
        }
      })

      uploadedPhotos.push(vehiclePhoto)
    }

    // Set first photo as primary if no primary exists
    const existingPrimary = await prisma.vehiclePhoto.findFirst({
      where: { vehicleId, isPrimary: true }
    })

    if (!existingPrimary && uploadedPhotos.length > 0) {
      await prisma.vehiclePhoto.update({
        where: { id: uploadedPhotos[0].id },
        data: { isPrimary: true }
      })
      uploadedPhotos[0].isPrimary = true
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded and processed ${uploadedPhotos.length} photos`,
      uploadedPhotos,
      totalPhotos: uploadedPhotos.length,
      processedImages: storedImages.length,
      skippedFiles: photos.length - validPhotos.length
    })

  } catch (error) {
    console.error('Error uploading vehicle photos:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to upload photos',
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

    const photos = await prisma.vehiclePhoto.findMany({
      where: { vehicleId },
      orderBy: [
        { isPrimary: 'desc' },
        { uploadedAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      photos,
      totalPhotos: photos.length
    })

  } catch (error) {
    console.error('Error fetching vehicle photos:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch photos',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
