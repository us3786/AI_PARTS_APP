import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { imageProcessor } from '@/lib/imageProcessor'
import { readdir, stat, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const { vehicleId } = await request.json()

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    const vehicleDir = join(process.cwd(), 'public', 'uploads', 'vehicles', vehicleId)
    
    if (!existsSync(vehicleDir)) {
      return NextResponse.json(
        { success: false, message: 'Vehicle directory not found' },
        { status: 404 }
      )
    }

    // Get all image files
    const files = await readdir(vehicleDir, { withFileTypes: true })
    const imageFiles = files.filter(f => f.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(f.name))

    let optimizedFiles = 0
    let spaceSaved = 0
    const errors: string[] = []

    // Process each image file
    for (const file of imageFiles) {
      try {
        const filePath = join(vehicleDir, file.name)
        const originalStats = await stat(filePath)
        const originalSize = originalStats.size

        // Skip if file is already optimized (has size suffix)
        if (file.name.includes('_ebay') || file.name.includes('_medium') || file.name.includes('_thumbnail')) {
          continue
        }

        // Validate image
        const validation = await imageProcessor.validateImage(filePath)
        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.error}`)
          continue
        }

        // Get metadata
        const metadata = await imageProcessor.getImageMetadata(filePath)
        if (!metadata) {
          errors.push(`${file.name}: Could not read metadata`)
          continue
        }

        // Skip if already small enough
        if (originalSize < 100 * 1024) { // Less than 100KB
          continue
        }

        // Create optimized version
        const optimizedBuffer = await imageProcessor.optimizeForEbay(filePath)
        const optimizedSize = optimizedBuffer.length

        // Only replace if we saved space
        if (optimizedSize < originalSize * 0.9) { // At least 10% reduction
          const optimizedPath = filePath.replace(/\.(jpg|jpeg|png|webp)$/i, '_optimized.jpg')
          await import('fs').then(fs => fs.promises.writeFile(optimizedPath, optimizedBuffer))
          
          // Update database if this is a tracked image
          const vehiclePhoto = await prisma.vehiclePhoto.findFirst({
            where: {
              vehicleId,
              filename: file.name
            }
          })

          if (vehiclePhoto) {
            await prisma.vehiclePhoto.update({
              where: { id: vehiclePhoto.id },
              data: {
                fileSize: optimizedSize,
                url: vehiclePhoto.url.replace(file.name, file.name.replace(/\.(jpg|jpeg|png|webp)$/i, '_optimized.jpg')),
                processedAt: new Date()
              }
            })
          }

          // Remove original file
          await unlink(filePath)
          
          // Rename optimized file to original name
          await import('fs').then(fs => fs.promises.rename(optimizedPath, filePath))

          optimizedFiles++
          spaceSaved += originalSize - optimizedSize
        }

      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Optimization complete. ${optimizedFiles} files optimized, ${Math.round(spaceSaved / 1024 / 1024)}MB saved`,
      optimizedFiles,
      spaceSaved: Math.round(spaceSaved / 1024 / 1024),
      errors: errors.slice(0, 10) // Limit error messages
    })

  } catch (error) {
    console.error('Error optimizing images:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to optimize images',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
