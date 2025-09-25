import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { imageIds } = await request.json()

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Image IDs array is required' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Deleting ${imageIds.length} images`)

    let deletedCount = 0
    const errors = []

    for (const imageId of imageIds) {
      try {
        // Find the image in database
        const vehiclePhoto = await prisma.vehiclePhoto.findUnique({
          where: { id: imageId }
        })

        if (vehiclePhoto) {
          // Delete file from filesystem
          const filepath = join(process.cwd(), 'public', vehiclePhoto.url)
          try {
            await unlink(filepath)
          } catch (fileError) {
            console.warn(`⚠️ Could not delete file ${filepath}:`, fileError)
          }

          // Delete from database
          await prisma.vehiclePhoto.delete({
            where: { id: imageId }
          })

          deletedCount++
          console.log(`✅ Deleted image: ${vehiclePhoto.originalName}`)
        } else {
          // Try to delete from parts images (these are stored as JSON in partsMaster)
          const partsWithImages = await prisma.partsMaster.findMany({
            where: {
              images: {
                path: '$',
                array_contains: [{ id: imageId }]
              }
            }
          })

          for (const part of partsWithImages) {
            if (part.images && Array.isArray(part.images)) {
              const updatedImages = part.images.filter((img: any) => img.id !== imageId)
              
              await prisma.partsMaster.update({
                where: { id: part.id },
                data: { images: updatedImages }
              })

              deletedCount++
              console.log(`✅ Deleted part image: ${imageId}`)
              break
            }
          }
        }
      } catch (error) {
        console.error(`❌ Failed to delete image ${imageId}:`, error)
        errors.push({ imageId, error: error.message })
      }
    }

    console.log(`🎉 Bulk delete completed: ${deletedCount}/${imageIds.length} images deleted`)

    return NextResponse.json({
      success: true,
      deletedCount,
      totalRequested: imageIds.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ Bulk delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Bulk delete failed' },
      { status: 500 }
    )
  }
}
