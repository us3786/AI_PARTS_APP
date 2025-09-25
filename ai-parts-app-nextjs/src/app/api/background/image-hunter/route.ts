import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { vehicleId, batchSize = 20 } = await request.json() // Increased from 5 to 20
    
    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Starting background image hunting for vehicle: ${vehicleId}`)

    // Get vehicle information first
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { make: true, model: true, year: true, engine: true, driveType: true }
    })

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found' },
        { status: 404 }
      )
    }

    console.log(`📋 Vehicle info: ${vehicle.year} ${vehicle.make} ${vehicle.model}`)

    // Get parts that need images (no images or only placeholder images)
    const partsNeedingImages = await prisma.partsInventory.findMany({
      where: {
        vehicleId: vehicleId
      },
      include: {
        partsMaster: true
      },
      take: batchSize * 2 // Get more parts to filter client-side
    })

    // Filter parts that need images (client-side filtering for better reliability)
    const partsNeedingImagesFiltered = partsNeedingImages.filter(part => {
      const images = part.partsMaster.images
      
      // No images at all
      if (!images || !Array.isArray(images) || images.length === 0) {
        return true
      }
      
      // Only placeholder images
      const hasOnlyPlaceholders = images.every((img: any) => 
        typeof img === 'object' && 
        img.url && 
        (img.url.includes('via.placeholder.com') || img.url.includes('placeholder.com'))
      )
      
      return hasOnlyPlaceholders
    }).slice(0, batchSize) // Take only the batch size we need

    console.log(`Found ${partsNeedingImagesFiltered.length} parts needing images`)

    if (partsNeedingImagesFiltered.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No parts need image hunting',
        processed: 0
      })
    }

    const results = []
    
    // Process each part
    for (const part of partsNeedingImagesFiltered) {
      try {
        console.log(`🖼️ Hunting images for: ${part.partsMaster.partName}`)
        
        // Call the image hunting API to get images from web
        const huntResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/image-hunting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partId: part.partsMaster.id,
            partName: part.partsMaster.partName,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            engine: vehicle.engine,
            drivetrain: vehicle.driveType, // Use driveType from schema
            maxImages: 12 // Increased from 8 to 12
          })
        })

        if (huntResponse.ok) {
          const huntData = await huntResponse.json()
          
          if (huntData.success && huntData.images && huntData.images.length > 0) {
            // Store images in database
            await prisma.partsMaster.update({
              where: { id: part.partsMaster.id },
              data: {
                images: huntData.images.map((img: any) => ({
                  url: img.url,
                  title: img.title || part.partsMaster.partName,
                  source: img.source || 'web',
                  quality: img.quality || 75,
                  width: img.width || 800,
                  height: img.height || 600,
                  fetchedAt: new Date().toISOString()
                }))
              }
            })

            results.push({
              partId: part.partsMaster.id,
              partName: part.partsMaster.partName,
              imagesFound: huntData.images.length,
              success: true
            })

            console.log(`✅ Stored ${huntData.images.length} images for ${part.partsMaster.partName}`)
          } else {
            results.push({
              partId: part.partsMaster.id,
              partName: part.partsMaster.partName,
              imagesFound: 0,
              success: false,
              error: 'No images found'
            })
          }
        } else {
          results.push({
            partId: part.partsMaster.id,
            partName: part.partsMaster.partName,
            imagesFound: 0,
            success: false,
            error: 'Hunt API failed'
          })
        }

        // Small delay between parts to avoid overwhelming APIs (reduced from 2000ms to 500ms)
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`❌ Error hunting images for ${part.partsMaster.partName}:`, error)
        results.push({
          partId: part.partsMaster.id,
          partName: part.partsMaster.partName,
          imagesFound: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalImages = results.reduce((sum, r) => sum + r.imagesFound, 0)

    console.log(`🎉 Background image hunting complete: ${successCount}/${partsNeedingImagesFiltered.length} parts processed, ${totalImages} images stored`)

    return NextResponse.json({
      success: true,
      message: `Background image hunting complete`,
      processed: results.length,
      successful: successCount,
      totalImages: totalImages,
      results: results
    })

  } catch (error) {
    console.error('❌ Background image hunting error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Background image hunting failed',
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

    // Get status of image hunting for this vehicle
    const totalParts = await prisma.partsInventory.count({
      where: { vehicleId: vehicleId }
    })

    // Get all parts for this vehicle
    const allParts = await prisma.partsInventory.findMany({
      where: {
        vehicleId: vehicleId
      },
      include: {
        partsMaster: true
      }
    })

    // Count parts with real images (client-side filtering)
    const partsWithImages = allParts.filter(part => {
      const images = part.partsMaster.images
      return images && Array.isArray(images) && images.length > 0 && 
        images.some((img: any) => 
          typeof img === 'object' && 
          img.url && 
          !img.url.includes('via.placeholder.com') && 
          !img.url.includes('placeholder.com')
        )
    }).length

    const partsNeedingImages = totalParts - partsWithImages

    return NextResponse.json({
      success: true,
      vehicleId: vehicleId,
      totalParts: totalParts,
      partsWithImages: partsWithImages,
      partsNeedingImages: partsNeedingImages,
      completionPercentage: totalParts > 0 ? Math.round((partsWithImages / totalParts) * 100) : 0
    })

  } catch (error) {
    console.error('❌ Error getting image hunting status:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to get image hunting status',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
