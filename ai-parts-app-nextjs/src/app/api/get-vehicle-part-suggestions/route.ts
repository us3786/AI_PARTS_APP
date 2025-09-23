import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Master parts categories from the original app
const MASTER_PARTS_CATEGORIES = {
  "Accessory Belts": ["Belts", "Idlers & Tensioners", "Pulleys"],
  "Advanced Driver Assistance Systems (ADAS)": ["ADAS Control Modules", "Alert & Warning Devices", "Cruise Control Components", "Lidar & Radar Sensors", "Parking Assistance", "Visible Cameras"],
  "Air Conditioning": ["AC Compressors", "AC Condensers", "AC Evaporators", "AC Expansion Valves", "AC Hoses & Lines", "AC Receivers & Dryers", "AC Switches & Controls", "AC Temperature Sensors", "Blower Motors & Fans", "Heater Cores", "HVAC Control Modules"],
  "Brake System": ["Anti-lock Brake Systems", "Brake Boosters", "Brake Calipers", "Brake Discs & Rotors", "Brake Drums", "Brake Hoses & Lines", "Brake Master Cylinders", "Brake Pads & Shoes", "Brake Pedals & Linkage", "Brake Proportioning Valves", "Electronic Brake Systems", "Parking Brake Systems", "Wheel Cylinders"],
  "Climate Control": ["Climate Control Modules", "HVAC Actuators", "Temperature Sensors", "Ventilation Systems"],
  "Electrical System": ["Alternators", "Battery Cables & Terminals", "Charging Systems", "Fuses & Circuit Breakers", "Ignition Systems", "Starters", "Wiring Harnesses"],
  "Engine": ["Air Intake Systems", "Camshafts & Timing", "Crankshafts & Pistons", "Engine Blocks & Heads", "Exhaust Systems", "Fuel Injection Systems", "Ignition Components", "Lubrication Systems", "Turbochargers & Superchargers", "Valve Train Components"],
  "Exhaust System": ["Catalytic Converters", "Exhaust Manifolds", "Exhaust Pipes & Mufflers", "Oxygen Sensors", "Exhaust Hangers & Mounts"],
  "Fuel System": ["Fuel Filters", "Fuel Injectors", "Fuel Pumps", "Fuel Rails & Lines", "Fuel Tanks", "Throttle Bodies"],
  "Lighting": ["Headlights", "Taillights", "Turn Signals", "Interior Lighting", "Fog Lights", "LED Lighting"],
  "Suspension & Steering": ["Ball Joints", "Control Arms", "Coil Springs", "Shock Absorbers", "Strut Assemblies", "Sway Bars", "Tie Rods", "Wheel Bearings"],
  "Transmission": ["Automatic Transmissions", "Manual Transmissions", "CVT Transmissions", "Transmission Filters", "Torque Converters", "Clutch Components"],
  "Wheels & Tires": ["Alloy Wheels", "Steel Wheels", "Tire Pressure Monitoring", "Wheel Covers", "Hubcaps", "Lug Nuts"]
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('Received request data:', data)
    
    const { make, model, year, vin } = data

    console.log('Extracted values:', { make, model, year, vin })

    if (!make || !model || !year) {
      console.error('Missing required fields:', { make, model, year, vin })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing make, model, or year',
          received: { make, model, year, vin }
        },
        { status: 400 }
      )
    }

    console.log(`AI Suggestions: Starting for ${year} ${make} ${model}, VIN: ${vin || 'N/A'}`)

    // Get or create vehicle
    let vehicleId = null
    if (vin && vin !== 'MANUAL_ENTRY') {
      vehicleId = await getOrCreateVehicle(vin, make, model, year)
    }

    // Get all available parts from master data
    const partsMaster = await prisma.partsMaster.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { subCategory: 'asc' },
        { partName: 'asc' }
      ]
    })

    console.log(`Found ${partsMaster.length} parts master records`)

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
        notes: `Auto-populated for ${year} ${make} ${model}`
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

    // Group parts by category for response
    const categories = [...new Set(inventoryWithParts.map(item => item.partsMaster.category))]
    const categorizedParts = categories.map(category => ({
      name: category,
      id: generateCategoryId(category),
      parts: inventoryWithParts
        .filter(item => item.partsMaster.category === category)
        .map(item => ({
          id: item.id,
          name: item.partsMaster.partName,
          description: item.partsMaster.partName,
          category: item.partsMaster.category,
          subCategory: item.partsMaster.subCategory,
          priority: getPriorityForCategory(category),
          estimatedPrice: item.currentValue || item.partsMaster.estimatedValue || 0,
          condition: item.condition,
          status: item.status,
          specifications: item.partsMaster.specifications
        }))
    }))

    return NextResponse.json({
      success: true,
      message: `Successfully populated ${createdInventory.count} parts for ${year} ${make} ${model}`,
      categories: categorizedParts,
      parts: inventoryWithParts,
      totalParts: inventoryWithParts.length,
      vehicleId: vehicleId
    })

  } catch (error) {
    console.error('AI part suggestions error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate part suggestions',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper functions
function getPriorityForCategory(categoryName: string): string {
  const highPriority = ['Brake System', 'Engine', 'Transmission', 'Electrical System']
  const mediumPriority = ['Suspension & Steering', 'Fuel System', 'Exhaust System']
  
  if (highPriority.includes(categoryName)) return 'high'
  if (mediumPriority.includes(categoryName)) return 'medium'
  return 'low'
}

function generateEstimatedPrice(partType: string): number {
  // Generate realistic price estimates based on part type
  const priceRanges: { [key: string]: [number, number] } = {
    'Brake': [50, 300],
    'Engine': [200, 2000],
    'Transmission': [500, 3000],
    'Electrical': [30, 500],
    'Suspension': [100, 800],
    'Fuel': [50, 400],
    'Exhaust': [80, 600],
    'AC': [100, 800],
    'Lighting': [25, 300]
  }
  
  for (const [key, range] of Object.entries(priceRanges)) {
    if (partType.toLowerCase().includes(key.toLowerCase())) {
      return Math.floor(Math.random() * (range[1] - range[0]) + range[0])
    }
  }
  
  return Math.floor(Math.random() * 200 + 50) // Default range
}

function generateCategoryId(categoryName: string): string {
  return categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_')
}

function generatePartNumber(partName: string): string {
  const prefix = partName.split(' ')[0].substring(0, 3).toUpperCase()
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${suffix}`
}

async function getOrCreateVehicle(vin: string, make: string, model: string, year: number | string) {
  try {
    const vehicle = await prisma.vehicle.upsert({
      where: { vin },
      update: { make, model, year: typeof year === 'string' ? parseInt(year) : year },
      create: { vin, make, model, year: typeof year === 'string' ? parseInt(year) : year }
    })
    return vehicle.id
  } catch (error) {
    console.error('Error getting/creating vehicle:', error)
    return null
  }
}
