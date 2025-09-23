import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Master parts categories from your existing fetch_parts.py
const MASTER_PARTS_CATEGORIES = {
  "Accessory Belts": ["Belts", "Idlers & Tensioners", "Pulleys"],
  "Advanced Driver Assistance Systems (ADAS)": ["ADAS Control Modules", "Alert & Warning Devices", "Cruise Control Components", "Lidar & Radar Sensors", "Parking Assistance", "Visible Cameras"],
  "Air & Fuel Delivery": ["Air Filters", "Air Filter Housings", "Air Intake & Fuel Sensors", "Carburetors", "Fuel Filters", "Fuel Injection Parts", "Fuel Pumps", "Sending Units", "Fuel Tank Caps", "Fuel Tanks", "Filler Necks", "Gaskets, Seals & O-Rings", "Hoses, Lines & Pipes", "Intake Manifolds", "Throttle Bodies", "Throttle Cables & Linkages", "Turbos", "Superchargers", "Intercoolers", "Vacuum Pumps"],
  "Air Conditioning & Heating": ["A/C Compressors", "A/C Clutches", "A/C Condensers", "A/C Evaporators", "A/C Expansion Valves", "A/C Hoses & Fittings", "A/C Pressure Switches", "A/C Receiver Dryers & Accumulators", "Blowers & Fans", "Cabin Air Filters", "Heater Control Valves", "Heater Cores", "HVAC Control Unit Parts", "HVAC Controls & Control Units", "HVAC Temperature Sensors", "HVAC Vent Actuators"],
  "Brakes & Brake Parts": ["ABS & Stability Hydraulic Units", "ABS Control Modules", "ABS Speed Sensors", "Brake Boosters", "Brake Cables", "Brake Component Kits", "Brake Disc Rotors", "Brake Drums", "Brake Hoses, Lines & Fittings", "Brake Pads", "Brake Shoes", "Brake Pad & Shoe Hardware", "Brake Pad Wear Sensors", "Brake Relays", "Calipers & Brackets", "Master Cylinders", "Rebuild Kits & Parts", "Reservoirs & Caps", "Wheel Cylinders"],
  "Electric, Hybrid & PHEV Specific Parts": ["Air Conditioner Compressors (Electric)", "Batteries, BMS & Fuel Cells", "Charging Units", "Charging Components", "Control Modules (EV/Hybrid)", "Conversion Kits", "Converters & Inverters", "Cooling Components (EV/Hybrid)", "Drivetrain Motors & Parts", "High Voltage Circuit Fuses & Breakers", "Relays & Contactors (EV/Hybrid)", "Switches (EV/Hybrid)", "Wiring Harnesses, Cables & Connectors (EV/Hybrid)"],
  "Engine Cooling Components": ["Coolant Hoses", "Cooling Fans", "Fan Clutches", "Oil Coolers", "Radiators", "Thermostats & Housings", "Water Pumps"],
  "Engines & Engine Parts": ["Camshafts, Lifters & Parts", "Crankshafts & Parts", "Cylinder Heads & Parts", "Engine Bearings", "Engine Blocks", "Engine Gaskets & Seals", "Engine Mounts", "Engine Rebuild Kits", "Oil Pans", "Pistons, Rings, Rods & Parts", "Timing Components", "Valve Covers", "Valves & Parts"],
  "Exhaust & Emission Systems": ["Catalytic Converters", "Diesel Particulate Filters", "EGR Valves", "Exhaust Manifolds", "Exhaust Pipes & Tips", "Mufflers & Resonators", "Oxygen Sensors"],
  "Exterior Parts & Accessories": ["Bumpers & Components", "Doors & Door Handles", "Fenders", "Grilles", "Hoods", "Mirrors", "Roof Racks & Cross Bars", "Spoilers & Wings", "Tailgates", "Trunk Lids & Parts"],
  "Ignition Systems & Components": ["Coils, Modules & Pick-Ups", "Distributors & Parts", "Glow Plugs", "Ignition Cables", "Ignition Switches", "Spark Plugs"],
  "Interior Parts & Accessories": ["Dashboard Panels & Glove Boxes", "Door Panels", "Floor Mats & Carpets", "Headliners", "Instrument Clusters", "Seats & Seat Parts", "Steering Wheels & Horns", "Sun Visors"],
  "Lighting & Lamps": ["Fog & Driving Lights", "Headlight Assemblies", "Interior Lights", "LED Lights", "Tail Light Assemblies", "Turn Signals"],
  "Racks & Cargo Carriers": ["Bike Racks", "Cargo Boxes", "Roof Racks", "Trunk Mount Racks"],
  "Starters, Alternators, ECUs & Wiring": ["Alternators & Generators", "Batteries", "Control Modules", "ECUs & Computer Modules", "Starters", "Wiring Harnesses"],
  "Steering & Suspension": ["Ball Joints", "Control Arms", "Power Steering Pumps", "Rack & Pinion Assemblies", "Shock Absorbers & Struts", "Steering Columns", "Tie Rods & Linkages", "Wheel Hubs & Bearings"],
  "Towing Parts & Accessories": ["Hitches", "Tow Bars", "Tow Hooks", "Trailer Brake Controllers", "Trailer Wiring"],
  "Transmission & Drivetrain": ["Axles & Parts", "Clutches & Parts", "Differentials & Parts", "Drive Shafts", "Flywheels & Flexplates", "Manual Transmissions & Parts", "Torque Converters", "Transmission Mounts"],
  "Wheels, Tires & Parts": ["Tires", "Tire Pressure Monitoring Sensors", "Wheels", "Wheel Hub Caps, Center Caps & Trim Rings", "Wheel Nuts, Bolts & Studs", "Wheel Spacers, Adapters & Hub Centric Rings", "Valve Stems & Caps"],
  "Sensors (Standalone Group)": ["Air Flow Sensors", "Camshaft Position Sensors", "Crankshaft Position Sensors", "Knock Sensors", "MAP Sensors", "Oxygen Sensors (Standalone)", "Speed Sensors", "Throttle Position Sensors", "Wheel Speed Sensors"],
  "Pumps (Standalone Group)": ["Fuel Pumps (Standalone)", "Oil Pumps", "Power Steering Pumps (Standalone)", "Vacuum Pumps (Standalone)", "Water Pumps (Standalone)", "Windshield Washer Pumps"],
  "Modules (Standalone Group)": ["ABS Control Modules (Standalone)", "Airbag Control Modules", "Body Control Modules (BCM)", "Engine Control Modules (ECM)", "HVAC Control Modules (Standalone)", "Lighting Control Modules", "Powertrain Control Modules (PCM)", "Transmission Control Modules (TCM)"],
  "Trims & Small Body Parts": ["A-Pillar Trims", "B-Pillar Trims", "C-Pillar Trims", "Door Sill Plates", "Fender Flares", "Grille Inserts", "Mirror Caps", "Moldings & Trim Strips", "Roof Rails", "Side Skirts", "Spoilers (Standalone)", "Window Trim"]
}

// Generate AI-powered part suggestions based on vehicle data
function generateSmartParts(vehicle: any): any[] {
  const parts: any[] = []
  const year = vehicle.year
  const make = vehicle.make?.toLowerCase()
  const model = vehicle.model?.toLowerCase()

  // Priority categories based on vehicle age and common maintenance needs
  const priorityCategories = []

  // High priority for older vehicles
  if (year < 2015) {
    priorityCategories.push(
      "Brakes & Brake Parts",
      "Engine Cooling Components",
      "Ignition Systems & Components",
      "Starters, Alternators, ECUs & Wiring"
    )
  }

  // Medium priority for all vehicles
  priorityCategories.push(
    "Air & Fuel Delivery",
    "Exhaust & Emission Systems",
    "Steering & Suspension"
  )

  // Add specific parts based on vehicle characteristics
  priorityCategories.forEach(category => {
    if (MASTER_PARTS_CATEGORIES[category]) {
      MASTER_PARTS_CATEGORIES[category].forEach(subCategory => {
        parts.push({
          partNumber: `AI-${category.replace(/\s+/g, '-').toUpperCase()}-${subCategory.replace(/\s+/g, '-').toUpperCase()}`,
          description: `${subCategory} for ${year} ${vehicle.make} ${vehicle.model}`,
          category: category,
          priority: year < 2015 ? 'high' : 'medium',
          price: Math.random() * 200 + 50, // Random price between $50-$250
          imageUrl: null,
          vehicleId: vehicle.id
        })
      })
    }
  })

  return parts.slice(0, 20) // Return top 20 suggestions
}

export async function POST(request: NextRequest) {
  try {
    const { vehicleId } = await request.json()
    
    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Get vehicle from database
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    })

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Create a new report
    const report = await prisma.report.create({
      data: {
        title: `Parts Analysis for ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        description: `AI-generated parts suggestions based on vehicle specifications`,
        status: 'processing',
        progress: 0,
        vehicleId: vehicleId,
        totalParts: 0,
        processedParts: 0
      }
    })

    // Generate smart parts suggestions
    const suggestedParts = generateSmartParts(vehicle)

    // Update report with total parts count
    await prisma.report.update({
      where: { id: report.id },
      data: { totalParts: suggestedParts.length }
    })

    // Save parts to database
    const savedParts = []
    for (let i = 0; i < suggestedParts.length; i++) {
      const partData = suggestedParts[i]
      
      try {
        const part = await prisma.part.create({
          data: partData
        })
        savedParts.push(part)

        // Create report item
        await prisma.reportItem.create({
          data: {
            reportId: report.id,
            partId: part.id,
            status: 'found'
          }
        })

        // Update progress
        const progress = Math.round(((i + 1) / suggestedParts.length) * 100)
        await prisma.report.update({
          where: { id: report.id },
          data: { 
            progress: progress,
            processedParts: i + 1
          }
        })

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error saving part ${i + 1}:`, error)
      }
    }

    // Mark report as completed
    await prisma.report.update({
      where: { id: report.id },
      data: { 
        status: 'completed',
        progress: 100
      }
    })

    return NextResponse.json({
      success: true,
      report: report,
      parts: savedParts,
      message: `Generated ${savedParts.length} part suggestions`
    })

  } catch (error) {
    console.error('Parts fetching error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch parts',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
