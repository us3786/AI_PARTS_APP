import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params

    // Get photo details
    const photo = await prisma.vehiclePhoto.findUnique({
      where: { id: photoId }
    })

    if (!photo) {
      return NextResponse.json(
        { success: false, message: 'Photo not found' },
        { status: 404 }
      )
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), 'public', photo.url)
      await unlink(filePath)
      
      if (photo.thumbnailUrl) {
        const thumbnailPath = join(process.cwd(), 'public', photo.thumbnailUrl)
        await unlink(thumbnailPath)
      }
    } catch (fileError) {
      console.warn('Could not delete file:', fileError)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.vehiclePhoto.delete({
      where: { id: photoId }
    })

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete photo',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
