import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Get all image processing jobs for this vehicle
    const processingJobs = await prisma.imageProcessingQueue.findMany({
      where: {
        vehicleId,
        imageType: 'vehicle'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to recent 50 jobs
    })

    // Get parts inventory for this vehicle to check for parts with image processing needs
    const partsInventory = await prisma.partsInventory.findMany({
      where: {
        vehicleId
      },
      include: {
        partsMaster: {
          select: {
            id: true,
            partName: true,
            images: true
          }
        }
      }
    })

    // Check which parts need image processing
    const partsNeedingImages = partsInventory.filter(part => {
      const images = part.partsMaster?.images
      return !images || (Array.isArray(images) && images.length === 0)
    })

    // Format the response
    const jobs = processingJobs.map(job => ({
      id: job.id,
      status: job.status,
      progress: job.progress || 0,
      message: job.message || 'Processing image...',
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      type: job.imageType,
      priority: job.priority || 'normal'
    }))

    const summary = {
      totalJobs: processingJobs.length,
      pendingJobs: processingJobs.filter(job => job.status === 'pending').length,
      processingJobs: processingJobs.filter(job => job.status === 'processing').length,
      completedJobs: processingJobs.filter(job => job.status === 'completed').length,
      failedJobs: processingJobs.filter(job => job.status === 'failed').length,
      partsNeedingImages: partsNeedingImages.length
    }

    return NextResponse.json({
      success: true,
      jobs,
      summary,
      partsNeedingImages: partsNeedingImages.map(part => ({
        id: part.id,
        partName: part.partsMaster?.partName || 'Unknown Part',
        needsImages: true
      }))
    })

  } catch (error) {
    console.error('Error fetching processing jobs:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch processing jobs',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Create a new processing job
export async function POST(request: NextRequest) {
  try {
    const { vehicleId, partId, imageType = 'vehicle', priority = 'normal' } = await request.json()

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Create a new processing job
    const job = await prisma.imageProcessingQueue.create({
      data: {
        vehicleId,
        partId,
        imageType,
        status: 'pending',
        progress: 0,
        priority,
        message: 'Job queued for processing'
      }
    })

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        message: job.message,
        createdAt: job.createdAt,
        type: job.imageType,
        priority: job.priority
      }
    })

  } catch (error) {
    console.error('Error creating processing job:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create processing job',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
