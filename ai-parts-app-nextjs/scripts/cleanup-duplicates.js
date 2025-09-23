const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupDuplicates() {
  try {
    console.log('Starting duplicate cleanup...')
    
    // Get all vehicles
    const vehicles = await prisma.vehicle.findMany()
    console.log(`Found ${vehicles.length} vehicles`)
    
    let totalRemoved = 0
    
    for (const vehicle of vehicles) {
      console.log(`\nProcessing vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin})`)
      
      // Find duplicate parts for this vehicle
      const duplicates = await prisma.partsInventory.groupBy({
        by: ['vehicleId', 'partsMasterId'],
        where: { vehicleId: vehicle.id },
        _count: {
          id: true
        },
        having: {
          id: {
            _count: {
              gt: 1
            }
          }
        }
      })
      
      console.log(`  Found ${duplicates.length} duplicate part groups`)
      
      let vehicleRemoved = 0
      
      // Remove duplicates, keeping only the first one
      for (const duplicate of duplicates) {
        const partsToRemove = await prisma.partsInventory.findMany({
          where: {
            vehicleId: duplicate.vehicleId,
            partsMasterId: duplicate.partsMasterId
          },
          orderBy: {
            createdAt: 'asc'
          },
          skip: 1 // Skip the first one (keep it)
        })
        
        if (partsToRemove.length > 0) {
          const idsToRemove = partsToRemove.map(part => part.id)
          await prisma.partsInventory.deleteMany({
            where: {
              id: { in: idsToRemove }
            }
          })
          vehicleRemoved += partsToRemove.length
        }
      }
      
      console.log(`  Removed ${vehicleRemoved} duplicate parts`)
      totalRemoved += vehicleRemoved
    }
    
    console.log(`\nCleanup complete! Removed ${totalRemoved} duplicate parts total`)
    
    // Get final statistics
    const totalParts = await prisma.partsInventory.count()
    const uniqueVehicles = await prisma.vehicle.count()
    
    console.log(`\nFinal statistics:`)
    console.log(`  Total vehicles: ${uniqueVehicles}`)
    console.log(`  Total parts: ${totalParts}`)
    
  } catch (error) {
    console.error('Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDuplicates()
