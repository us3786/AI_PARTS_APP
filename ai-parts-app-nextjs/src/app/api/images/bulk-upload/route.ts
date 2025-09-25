import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const vehicleId = formData.get('vehicleId') as string
    const source = formData.get('source') as string || 'bulk_upload'
    const files = formData.getAll('images') as File[]

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No files provided' },
        { status: 400 }
      )
    }

    console.log(`📤 Starting bulk upload of ${files.length} images for vehicle ${vehicleId}`)

    const uploadedImages = []
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'vehicles', vehicleId)

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.warn(`⚠️ Skipping non-image file: ${file.name}`)
        continue
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`⚠️ Skipping large file: ${file.name} (${file.size} bytes)`)
        continue
      }

      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Generate unique filename
        const timestamp = Date.now()
        const extension = file.name.split('.').pop() || 'jpg'
        const filename = `${timestamp}_${i}.${extension}`
        const filepath = join(uploadDir, filename)
        
        // Save file
        await writeFile(filepath, buffer)
        
        // Create URL
        const url = `/uploads/vehicles/${vehicleId}/${filename}`
        
        // Save to database
        const vehiclePhoto = await prisma.vehiclePhoto.create({
          data: {
            vehicleId,
            filename,
            originalName: file.name,
            url,
            fileSize: file.size,
            mimeType: file.type,
            tags: ['bulk_upload'],
            description: `Bulk uploaded image ${i + 1}`
          }
        })

        uploadedImages.push({
          id: vehiclePhoto.id,
          filename: vehiclePhoto.filename,
          url: vehiclePhoto.url,
          originalName: vehiclePhoto.originalName
        })

        console.log(`✅ Uploaded: ${file.name} -> ${filename}`)

      } catch (error) {
        console.error(`❌ Failed to upload ${file.name}:`, error)
      }
    }

    console.log(`🎉 Bulk upload completed: ${uploadedImages.length}/${files.length} images uploaded`)

    return NextResponse.json({
      success: true,
      uploadedCount: uploadedImages.length,
      totalFiles: files.length,
      images: uploadedImages
    })

  } catch (error) {
    console.error('❌ Bulk upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Bulk upload failed' },
      { status: 500 }
    )
  }
}
