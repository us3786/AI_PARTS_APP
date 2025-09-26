import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Vehicle } from '@/types'

// Global guard to prevent duplicate API calls
const activeRequests = new Set<string>()

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

    console.log(`📖 Reading inventory for vehicle ${vehicleId} (read-only)`)

    // Get existing inventory without creating new parts
    const inventoryWithParts = await prisma.partsInventory.findMany({
      where: { vehicleId },
      include: {
        partsMaster: true
      },
      orderBy: [
        { partsMaster: { category: 'asc' } },
        { partsMaster: { partName: 'asc' } }
      ]
    })

    // Get available parts master data for categories
    const availableParts = await prisma.partsMaster.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { partName: 'asc' }
      ]
    })

    const categories = [...new Set(availableParts.map(part => part.category))]

    return NextResponse.json({
      success: true,
      message: `Found ${inventoryWithParts.length} existing parts for vehicle ${vehicleId}`,
      inventory: inventoryWithParts,
      availableParts,
      categories,
      totalParts: inventoryWithParts.length,
      totalAvailable: availableParts.length,
      readOnly: true
    })

  } catch (error) {
    console.error('Error reading inventory:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to read inventory',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { vehicleId, selectedCategories } = await request.json()
    
    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Check if this vehicle is already being processed
    const requestKey = `populate-${vehicleId}`
    if (activeRequests.has(requestKey)) {
      console.log(`⏳ Vehicle ${vehicleId} is already being populated, skipping duplicate request`)
      return NextResponse.json({
        success: false,
        message: 'Vehicle is already being populated',
        isDuplicate: true
      }, { status: 409 })
    }

    // Mark this vehicle as being processed
    activeRequests.add(requestKey)
    console.log(`🚀 Starting population for vehicle ${vehicleId}`)

    // Get vehicle information
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    })

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Get parts master data based on categories or all parts
    const whereClause = selectedCategories && selectedCategories.length > 0
      ? { 
          category: { in: selectedCategories },
          isActive: true 
        }
      : { isActive: true }

    const partsMaster = await prisma.partsMaster.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { subCategory: 'asc' },
        { partName: 'asc' }
      ]
    })

    console.log(`Found ${partsMaster.length} parts master records for vehicle ${vehicleId}`)

    // Check if inventory already exists for this vehicle
    const existingInventory = await prisma.partsInventory.findMany({
      where: { vehicleId: vehicleId },
      select: { partsMasterId: true }
    })

    const existingPartIds = new Set(existingInventory.map(item => item.partsMasterId))

    // Only create inventory entries for parts that don't already exist
    const newInventoryEntries = partsMaster
      .filter(part => !existingPartIds.has(part.id))
      .map(part => ({
        vehicleId: vehicleId,
        partsMasterId: part.id,
        condition: 'good', // Default condition
        status: 'available',
        currentValue: part.resaleValue || part.estimatedValue || 0,
        notes: `Auto-populated for ${vehicle.year} ${vehicle.make} ${vehicle.model}`
      }))

    let createdInventory = { count: 0 }
    
    if (newInventoryEntries.length > 0) {
      // Batch create only new inventory entries
      createdInventory = await prisma.partsInventory.createMany({
        data: newInventoryEntries
      })
    }

    console.log(`Created ${createdInventory.count} inventory entries`)

    // Get the created inventory with part details
    const inventoryWithParts = await prisma.partsInventory.findMany({
      where: { vehicleId },
      include: {
        partsMaster: true
      },
      orderBy: [
        { partsMaster: { category: 'asc' } },
        { partsMaster: { partName: 'asc' } }
      ]
    })

    return NextResponse.json({
      success: true,
      message: `Successfully populated ${createdInventory.count} parts for ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      inventory: inventoryWithParts,
      totalParts: inventoryWithParts.length,
      categories: [...new Set(inventoryWithParts.map(item => item.partsMaster.category))]
    })

  } catch (error) {
    console.error('Error populating parts inventory:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to populate parts inventory',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    // Always remove the request from active requests
    const requestKey = `populate-${vehicleId}`
    activeRequests.delete(requestKey)
    console.log(`✅ Completed population for vehicle ${vehicleId}`)
  }
}

