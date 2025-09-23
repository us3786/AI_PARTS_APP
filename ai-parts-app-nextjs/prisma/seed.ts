import { PrismaClient } from '@prisma/client'
import { PARTS_MASTER_DATA } from './complete-parts-master-data'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing parts master data
  console.log('🧹 Clearing existing parts master data...')
  await prisma.partsMaster.deleteMany({})

  // Seed parts master data
  console.log('📦 Seeding parts master data...')
  
  for (const partData of PARTS_MASTER_DATA) {
    await prisma.partsMaster.create({
      data: {
        partName: partData.partName,
        category: partData.category,
        subCategory: partData.subCategory,
        oemPartNumber: partData.oemPartNumber,
        aftermarketNumbers: partData.aftermarketNumbers,
        vehicleSpecific: partData.vehicleSpecific,
        estimatedValue: partData.estimatedValue,
        resaleValue: partData.resaleValue,
        marketDemand: partData.marketDemand,
        weight: partData.weight,
        dimensions: partData.dimensions,
        specifications: partData.specifications,
        images: partData.images || [],
        notes: partData.notes,
        isActive: partData.isActive
      }
    })
  }

  console.log(`✅ Successfully seeded ${PARTS_MASTER_DATA.length} parts master records`)

  // Create some sample settings
  console.log('⚙️ Creating default settings...')
  await prisma.settings.upsert({
    where: { key: 'app_version' },
    update: {},
    create: {
      key: 'app_version',
      value: '1.0.0',
      description: 'Application version'
    }
  })

  await prisma.settings.upsert({
    where: { key: 'default_currency' },
    update: {},
    create: {
      key: 'default_currency',
      value: 'USD',
      description: 'Default currency for pricing'
    }
  })

  await prisma.settings.upsert({
    where: { key: 'ebay_default_category' },
    update: {},
    create: {
      key: 'ebay_default_category',
      value: '6030', // Car & Truck Parts
      description: 'Default eBay category for automotive parts'
    }
  })

  console.log('✅ Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
