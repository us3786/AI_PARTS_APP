import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stat, readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // Get database stats from multiple sources
    const vehiclePhotos = await prisma.vehiclePhoto.findMany({
      where: { vehicleId },
      select: {
        fileSize: true,
        mimeType: true,
        width: true,
        height: true
      }
    })

    // Get parts images from partsMaster (where real images are stored)
    const partsWithImages = await prisma.partsMaster.findMany({
      where: {
        partsInventory: {
          some: { vehicleId }
        }
      },
      select: {
        images: true,
        partName: true
      }
    })

    // Count images from partsMaster
    let partsImagesCount = 0
    let partsImagesSize = 0
    const formats: Record<string, number> = {}
    
    partsWithImages.forEach(part => {
      if (part.images && Array.isArray(part.images)) {
        partsImagesCount += part.images.length
        
        part.images.forEach(img => {
          if (typeof img === 'object' && img.url) {
            // Estimate size for external images (we don't have actual file size)
            partsImagesSize += 50000 // 50KB estimate for external images
            
            // Determine format from URL
            let format = 'unknown'
            if (img.url.includes('.jpg') || img.url.includes('.jpeg')) format = 'jpeg'
            else if (img.url.includes('.png')) format = 'png'
            else if (img.url.includes('.webp')) format = 'webp'
            else if (img.url.includes('data:image/svg')) format = 'svg'
            else if (img.url.includes('data:image/')) format = 'data'
            else format = 'external'
            
            formats[format] = (formats[format] || 0) + 1
          }
        })
      }
    })

    // Calculate statistics (combine both sources)
    const totalImages = vehiclePhotos.length + partsImagesCount
    const totalSize = vehiclePhotos.reduce((sum, photo) => sum + (photo.fileSize || 0), 0) + partsImagesSize
    const averageSize = totalImages > 0 ? totalSize / totalImages : 0

    // Count formats from vehicle photos
    vehiclePhotos.forEach(photo => {
      const format = photo.mimeType?.split('/')[1] || 'unknown'
      formats[format] = (formats[format] || 0) + 1
    })

    // Check processing queue
    const processingQueue = await prisma.imageProcessingQueue.count({
      where: {
        imageType: 'vehicle',
        status: { in: ['pending', 'processing'] }
      }
    })

    // Check CDN status
    const cdnEnabled = process.env.NODE_ENV === 'production' && !!process.env.CDN_DOMAIN

    // Get file system stats
    const vehicleDir = join(process.cwd(), 'public', 'uploads', 'vehicles', vehicleId)
    let fileSystemStats = {
      totalFiles: 0,
      totalSize: 0,
      directories: 0
    }

    if (existsSync(vehicleDir)) {
      try {
        const files = await readdir(vehicleDir, { withFileTypes: true })
        fileSystemStats.totalFiles = files.filter(f => f.isFile()).length
        fileSystemStats.directories = files.filter(f => f.isDirectory()).length

        // Calculate total size
        for (const file of files.filter(f => f.isFile())) {
          try {
            const filePath = join(vehicleDir, file.name)
            const fileStat = await stat(filePath)
            fileSystemStats.totalSize += fileStat.size
          } catch (error) {
            console.warn(`Could not stat file ${file.name}:`, error)
          }
        }
      } catch (error) {
        console.warn('Could not read vehicle directory:', error)
      }
    }

    const stats = {
      totalImages,
      totalSize,
      averageSize,
      formats,
      processingQueue,
      cdnEnabled,
      fileSystem: fileSystemStats,
      breakdown: {
        vehiclePhotos: vehiclePhotos.length,
        partsImages: partsImagesCount,
        partsWithImages: partsWithImages.length
      }
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Error fetching image stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch image statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
