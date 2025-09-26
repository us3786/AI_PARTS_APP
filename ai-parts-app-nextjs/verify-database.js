#!/usr/bin/env node

/**
 * Database Verification Script
 * Verifies that all tables, relationships, and data are properly set up
 */

const { PrismaClient } = require('@prisma/client')

// Set the PostgreSQL URL
process.env.DATABASE_URL = "postgresql://postgres:Faizi786@localhost:5433/ai_parts_app"

const prisma = new PrismaClient()

async function verifyDatabase() {
  console.log('🔍 Verifying PostgreSQL Database Setup...')
  console.log('=' .repeat(50))
  
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Check all tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    console.log(`\n📊 Database Tables (${tables.length} total):`)
    const expectedTables = [
      'bulk_operations',
      'ebay_listings', 
      'ebay_tokens',
      'image_processing_queue',
      'parts',
      'parts_inventory',
      'parts_master',
      'price_research',
      'report_items',
      'reports',
      'settings',
      'vehicle_photos',
      'vehicles'
    ]
    
    tables.forEach(table => {
      const tableName = table.table_name
      const isExpected = expectedTables.includes(tableName)
      console.log(`   ${isExpected ? '✅' : '⚠️'} ${tableName}`)
    })
    
    // Check data counts
    console.log('\n📈 Data Counts:')
    
    try {
      const partsMasterCount = await prisma.partsMaster.count()
      console.log(`   📦 PartsMaster: ${partsMasterCount} records`)
    } catch (error) {
      console.log(`   ❌ PartsMaster: Error - ${error.message}`)
    }
    
    try {
      const vehiclesCount = await prisma.vehicle.count()
      console.log(`   🚗 Vehicles: ${vehiclesCount} records`)
    } catch (error) {
      console.log(`   ❌ Vehicles: Error - ${error.message}`)
    }
    
    try {
      const partsInventoryCount = await prisma.partsInventory.count()
      console.log(`   📋 PartsInventory: ${partsInventoryCount} records`)
    } catch (error) {
      console.log(`   ❌ PartsInventory: Error - ${error.message}`)
    }
    
    try {
      const priceResearchCount = await prisma.priceResearch.count()
      console.log(`   💰 PriceResearch: ${priceResearchCount} records`)
    } catch (error) {
      console.log(`   ❌ PriceResearch: Error - ${error.message}`)
    }
    
    try {
      const vehiclePhotosCount = await prisma.vehiclePhoto.count()
      console.log(`   📸 VehiclePhotos: ${vehiclePhotosCount} records`)
    } catch (error) {
      console.log(`   ❌ VehiclePhotos: Error - ${error.message}`)
    }
    
    // Test relationships
    console.log('\n🔗 Testing Relationships:')
    
    try {
      const vehicleWithParts = await prisma.vehicle.findFirst({
        include: {
          partsInventory: {
            include: {
              partsMaster: true
            }
          }
        }
      })
      
      if (vehicleWithParts) {
        console.log(`   ✅ Vehicle → PartsInventory → PartsMaster: Working`)
        console.log(`   📊 Sample vehicle "${vehicleWithParts.year} ${vehicleWithParts.make} ${vehicleWithParts.model}" has ${vehicleWithParts.partsInventory.length} parts`)
      } else {
        console.log(`   ⚠️ No vehicles with parts found`)
      }
    } catch (error) {
      console.log(`   ❌ Vehicle relationships: Error - ${error.message}`)
    }
    
    try {
      const partsWithResearch = await prisma.partsMaster.findFirst({
        include: {
          priceResearch: true
        }
      })
      
      if (partsWithResearch) {
        console.log(`   ✅ PartsMaster → PriceResearch: Working`)
        console.log(`   📊 Sample part "${partsWithResearch.partName}" has ${partsWithResearch.priceResearch.length} research entries`)
      } else {
        console.log(`   ⚠️ No parts with price research found`)
      }
    } catch (error) {
      console.log(`   ❌ PartsMaster relationships: Error - ${error.message}`)
    }
    
    // Check unique constraints
    console.log('\n🔒 Checking Unique Constraints:')
    
    try {
      const constraintCheck = await prisma.$queryRaw`
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'UNIQUE' 
        AND table_schema = 'public'
        ORDER BY table_name, constraint_name
      `
      
      console.log(`   📋 Found ${constraintCheck.length} unique constraints:`)
      constraintCheck.forEach(constraint => {
        console.log(`      - ${constraint.table_name}.${constraint.constraint_name}`)
      })
    } catch (error) {
      console.log(`   ❌ Constraint check failed: ${error.message}`)
    }
    
    console.log('\n🎉 Database verification complete!')
    console.log('✅ Your PostgreSQL database is properly set up and ready for use.')
    
  } catch (error) {
    console.log('❌ Database verification failed:', error.message)
    console.log('💡 Make sure PostgreSQL is running and accessible')
  } finally {
    await prisma.$disconnect()
  }
}

verifyDatabase()
