import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Remove a specific image from a part
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partId = searchParams.get('partId')
    const imageUrl = searchParams.get('imageUrl')
    
    if (!partId || !imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Part ID and image URL are required' },
        { status: 400 }
      )
    }

    // Get the current part
    const partsMaster = await prisma.partsMaster.findUnique({
      where: { id: partId }
    })

    if (!partsMaster) {
      return NextResponse.json(
        { success: false, message: 'Part not found' },
        { status: 404 }
      )
    }

    // Remove the specific image from the images array
    const currentImages = Array.isArray(partsMaster.images) ? partsMaster.images : []
    const updatedImages = currentImages.filter((img: any) => img.url !== imageUrl)

    // Update the part with the filtered images
    await prisma.partsMaster.update({
      where: { id: partId },
      data: { images: updatedImages }
    })

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      remainingImages: updatedImages.length
    })

  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete image',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - Update image properties (title, quality, etc.)
export async function PUT(request: NextRequest) {
  try {
    const { partId, imageUrl, updates } = await request.json()
    
    if (!partId || !imageUrl || !updates) {
      return NextResponse.json(
        { success: false, message: 'Part ID, image URL, and updates are required' },
        { status: 400 }
      )
    }

    // Get the current part
    const partsMaster = await prisma.partsMaster.findUnique({
      where: { id: partId }
    })

    if (!partsMaster) {
      return NextResponse.json(
        { success: false, message: 'Part not found' },
        { status: 404 }
      )
    }

    // Update the specific image in the images array
    const currentImages = Array.isArray(partsMaster.images) ? partsMaster.images : []
    const updatedImages = currentImages.map((img: any) => {
      if (img.url === imageUrl) {
        return {
          ...img,
          ...updates,
          updatedDate: new Date().toISOString()
        }
      }
      return img
    })

    // Update the part with the modified images
    await prisma.partsMaster.update({
      where: { id: partId },
      data: { images: updatedImages }
    })

    return NextResponse.json({
      success: true,
      message: 'Image updated successfully',
      updatedImage: updatedImages.find((img: any) => img.url === imageUrl)
    })

  } catch (error) {
    console.error('Error updating image:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update image',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Add a new custom image to a part
export async function POST(request: NextRequest) {
  try {
    const { partId, imageData } = await request.json()
    
    if (!partId || !imageData) {
      return NextResponse.json(
        { success: false, message: 'Part ID and image data are required' },
        { status: 400 }
      )
    }

    // Get the current part
    const partsMaster = await prisma.partsMaster.findUnique({
      where: { id: partId }
    })

    if (!partsMaster) {
      return NextResponse.json(
        { success: false, message: 'Part not found' },
        { status: 404 }
      )
    }

    // Add the new image to the images array
    const currentImages = Array.isArray(partsMaster.images) ? partsMaster.images : []
    const newImage = {
      url: imageData.url,
      source: imageData.source || 'Custom Upload',
      title: imageData.title || partsMaster.partName,
      quality: imageData.quality || 100,
      dimensions: imageData.dimensions || 'Unknown',
      listingUrl: imageData.listingUrl || '',
      addedDate: new Date().toISOString(),
      isCustom: true
    }

    const updatedImages = [...currentImages, newImage]

    // Update the part with the new images
    await prisma.partsMaster.update({
      where: { id: partId },
      data: { images: updatedImages }
    })

    return NextResponse.json({
      success: true,
      message: 'Image added successfully',
      newImage,
      totalImages: updatedImages.length
    })

  } catch (error) {
    console.error('Error adding image:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to add image',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
