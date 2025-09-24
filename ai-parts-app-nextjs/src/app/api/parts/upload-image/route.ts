import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const partId = formData.get('partId') as string
    const file = formData.get('file') as File
    
    if (!partId || !file) {
      return NextResponse.json(
        { success: false, message: 'Part ID and file are required' },
        { status: 400 }
      )
    }

    console.log(`📸 Uploading image for part: ${partId}`)

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Only JPEG, PNG, and WebP images are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Find the part
    let partsMaster = await prisma.partsMaster.findUnique({
      where: { id: partId }
    })

    if (!partsMaster) {
      const partsInventory = await prisma.partsInventory.findUnique({
        where: { id: partId },
        include: { partsMaster: true }
      })
      
      if (partsInventory?.partsMaster) {
        partsMaster = partsInventory.partsMaster
      }
    }

    if (!partsMaster) {
      return NextResponse.json(
        { success: false, message: 'Part not found' },
        { status: 404 }
      )
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'parts')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${partId}-${timestamp}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create public URL
    const imageUrl = `/uploads/parts/${fileName}`

    // Save image info to database
    const existingImages = Array.isArray(partsMaster.images) ? partsMaster.images : []
    const newImages = [...existingImages, {
      url: imageUrl,
      source: 'User Upload',
      title: `Uploaded image for ${partsMaster.partName}`,
      quality: 95,
      dimensions: { width: 0, height: 0 }, // Will be updated by image processing
      listingUrl: '',
      addedDate: new Date().toISOString(),
      originalName: file.name,
      fileSize: file.size,
      uploadedBy: 'user'
    }]

    await prisma.partsMaster.update({
      where: { id: partsMaster.id },
      data: { images: newImages }
    })

    console.log(`✅ Image uploaded successfully: ${imageUrl}`)

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
      imageInfo: {
        url: imageUrl,
        source: 'User Upload',
        title: `Uploaded image for ${partsMaster.partName}`,
        quality: 95,
        originalName: file.name,
        fileSize: file.size
      }
    })

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to upload image',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { partId, imageUrl } = await request.json()
    
    if (!partId || !imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Part ID and image URL are required' },
        { status: 400 }
      )
    }

    // Find the part
    let partsMaster = await prisma.partsMaster.findUnique({
      where: { id: partId }
    })

    if (!partsMaster) {
      const partsInventory = await prisma.partsInventory.findUnique({
        where: { id: partId },
        include: { partsMaster: true }
      })
      
      if (partsInventory?.partsMaster) {
        partsMaster = partsInventory.partsMaster
      }
    }

    if (!partsMaster) {
      return NextResponse.json(
        { success: false, message: 'Part not found' },
        { status: 404 }
      )
    }

    // Remove image from database
    const existingImages = Array.isArray(partsMaster.images) ? partsMaster.images : []
    const updatedImages = existingImages.filter((img: any) => img.url !== imageUrl)

    await prisma.partsMaster.update({
      where: { id: partsMaster.id },
      data: { images: updatedImages }
    })

    // TODO: Delete physical file from server
    // const fileName = imageUrl.split('/').pop()
    // const filePath = join(process.cwd(), 'public', 'uploads', 'parts', fileName)
    // await unlink(filePath)

    return NextResponse.json({
      success: true,
      message: 'Image removed successfully'
    })

  } catch (error) {
    console.error('Image deletion error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to remove image',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
