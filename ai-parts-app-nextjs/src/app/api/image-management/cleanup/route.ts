import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readdir, stat, unlink, rmdir } from 'fs/promises'
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

    // Get all tracked images from database
    const trackedPhotos = await prisma.vehiclePhoto.findMany({
      where: { vehicleId },
      select: { filename: true, url: true }
    })

    const trackedFilenames = new Set(trackedPhotos.map(photo => photo.filename))

    // Get all files in directory
    const files = await readdir(vehicleDir, { withFileTypes: true, recursive: true })
    const allFiles: string[] = []

    // Recursively collect all files
    const collectFiles = async (dir: string, relativePath: string = '') => {
      const items = await readdir(dir, { withFileTypes: true })
      
      for (const item of items) {
        const itemPath = join(dir, item.name)
        const relativeItemPath = join(relativePath, item.name)
        
        if (item.isDirectory()) {
          await collectFiles(itemPath, relativeItemPath)
        } else if (item.isFile()) {
          allFiles.push(relativeItemPath)
        }
      }
    }

    await collectFiles(vehicleDir)

    let deletedFiles = 0
    let freedSpace = 0
    const errors: string[] = []

    // Check each file
    for (const file of allFiles) {
      try {
        const filePath = join(vehicleDir, file)
        const fileName = file.split('/').pop() || file

        // Skip if file is tracked in database
        if (trackedFilenames.has(fileName)) {
          continue
        }

        // Get file size before deletion
        const fileStats = await stat(filePath)
        const fileSize = fileStats.size

        // Delete orphaned file
        await unlink(filePath)
        
        deletedFiles++
        freedSpace += fileSize

      } catch (error) {
        errors.push(`${file}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Clean up empty directories
    try {
      const dirs = await readdir(vehicleDir, { withFileTypes: true })
      for (const dir of dirs.filter(d => d.isDirectory())) {
        const dirPath = join(vehicleDir, dir.name)
        try {
          const dirContents = await readdir(dirPath)
          if (dirContents.length === 0) {
            await rmdir(dirPath)
          }
        } catch (error) {
          // Directory not empty or other error, skip
        }
      }
    } catch (error) {
      // Ignore directory cleanup errors
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup complete. ${deletedFiles} orphaned files deleted, ${Math.round(freedSpace / 1024 / 1024)}MB freed`,
      deletedFiles,
      freedSpace: Math.round(freedSpace / 1024 / 1024),
      errors: errors.slice(0, 10) // Limit error messages
    })

  } catch (error) {
    console.error('Error cleaning up images:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to cleanup images',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
