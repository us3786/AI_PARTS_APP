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

    // Get database stats
    const vehiclePhotos = await prisma.vehiclePhoto.findMany({
      where: { vehicleId },
      select: {
        fileSize: true,
        mimeType: true,
        width: true,
        height: true
      }
    })

    // Calculate statistics
    const totalImages = vehiclePhotos.length
    const totalSize = vehiclePhotos.reduce((sum, photo) => sum + (photo.fileSize || 0), 0)
    const averageSize = totalImages > 0 ? totalSize / totalImages : 0

    // Count formats
    const formats: Record<string, number> = {}
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
      fileSystem: fileSystemStats
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
