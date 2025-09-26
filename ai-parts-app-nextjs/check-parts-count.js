const { PrismaClient } = require('@prisma/client')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env.local') })

const prisma = new PrismaClient()

async function checkPartsCount() {
  try {
    console.log('🔍 Checking database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Count parts master records
    const partsCount = await prisma.partsMaster.count()
    console.log(`📊 Total parts in database: ${partsCount}`)
    
    // Count inventory records
    const inventoryCount = await prisma.partsInventory.count()
    console.log(`📦 Total inventory records: ${inventoryCount}`)
    
    // Get sample parts
    const sampleParts = await prisma.partsMaster.findMany({
      take: 5,
      select: {
        partName: true,
        category: true,
        oemPartNumber: true
      }
    })
    
    console.log('📋 Sample parts:')
    sampleParts.forEach(part => {
      console.log(`  - ${part.partName} (${part.category}) - ${part.oemPartNumber}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkPartsCount()
