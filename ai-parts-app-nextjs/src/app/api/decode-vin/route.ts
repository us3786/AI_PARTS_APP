import { NextRequest, NextResponse } from 'next/server'
import { decodeVIN } from '@/lib/api'
import { prisma } from '@/lib/prisma'

function generateTempId(): string {
  return 'temp_' + Math.random().toString(36).substr(2, 9)
}

export async function POST(request: NextRequest) {
  try {
    const { vin } = await request.json()
    
    if (!vin || typeof vin !== 'string') {
      return NextResponse.json(
        { success: false, message: 'VIN is required' },
        { status: 400 }
      )
    }

    // Decode VIN using NHTSA API
    const decodeResult = await decodeVIN(vin)
    
    if (!decodeResult.success) {
      return NextResponse.json(decodeResult, { status: 400 })
    }

    // Save or update vehicle in database
    try {
      const vehicle = await prisma.vehicle.upsert({
        where: { vin: vin },
        update: {
          make: decodeResult.make || '',
          model: decodeResult.model || '',
          year: parseInt(decodeResult.year || '0'),
          trimLevel: decodeResult.trimLevel || null,
          engine: decodeResult.engineSize || decodeResult.details?.['Engine Configuration'] || null,
          transmission: decodeResult.details?.['Transmission Style'] || null,
          driveType: decodeResult.details?.['Drive Type'] || null,
          fuelType: decodeResult.details?.['Fuel Type - Primary'] || null,
          bodyClass: decodeResult.details?.['Body Class'] || null,
          updatedAt: new Date(),
        },
        create: {
          vin: vin,
          make: decodeResult.make || '',
          model: decodeResult.model || '',
          year: parseInt(decodeResult.year || '0'),
          trimLevel: decodeResult.trimLevel || null,
          engine: decodeResult.engineSize || decodeResult.details?.['Engine Configuration'] || null,
          transmission: decodeResult.details?.['Transmission Style'] || null,
          driveType: decodeResult.details?.['Drive Type'] || null,
          fuelType: decodeResult.details?.['Fuel Type - Primary'] || null,
          bodyClass: decodeResult.details?.['Body Class'] || null,
        },
      })

      return NextResponse.json({
        success: true,
        vehicle: {
          id: vehicle.id,
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          trimLevel: vehicle.trimLevel,
          engine: vehicle.engine,
          transmission: vehicle.transmission,
          driveType: vehicle.driveType,
          fuelType: vehicle.fuelType,
          bodyClass: vehicle.bodyClass,
          createdAt: vehicle.createdAt,
          updatedAt: vehicle.updatedAt
        },
        decodeResult: decodeResult
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Return decode result even if database save fails
      // Create a temporary vehicle object even if database save failed
      const tempVehicle = {
        id: generateTempId(),
        vin: vin,
        make: decodeResult.make || '',
        model: decodeResult.model || '',
        year: parseInt(decodeResult.year || '0'),
        trimLevel: decodeResult.trimLevel || null,
        engine: decodeResult.engineSize || decodeResult.details?.['Engine Configuration'] || null,
        transmission: decodeResult.details?.['Transmission Style'] || null,
        driveType: decodeResult.details?.['Drive Type'] || null,
        fuelType: decodeResult.details?.['Fuel Type - Primary'] || null,
        bodyClass: decodeResult.details?.['Body Class'] || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      return NextResponse.json({
        success: true,
        vehicle: tempVehicle,
        decodeResult: decodeResult,
        message: 'VIN decoded but failed to save to database'
      })
    }
  } catch (error) {
    console.error('VIN decode API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
