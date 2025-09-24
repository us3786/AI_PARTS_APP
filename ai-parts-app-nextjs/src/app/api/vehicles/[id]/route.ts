import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vehicleId } = await params

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        partsInventory: {
          include: {
            partsMaster: true
          }
        }
      }
    })

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      vehicle
    })

  } catch (error) {
    console.error('Error fetching vehicle:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch vehicle',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vehicleId } = await params

    // Delete all related data
    await prisma.partsInventory.deleteMany({
      where: { vehicleId }
    })

    await prisma.priceResearch.deleteMany({
      where: {
        partsMaster: {
          partsInventory: {
            some: {
              vehicleId
            }
          }
        }
      }
    })

    await prisma.vehicle.delete({
      where: { id: vehicleId }
    })

    return NextResponse.json({
      success: true,
      message: 'Vehicle and all related data deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting vehicle:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete vehicle',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
