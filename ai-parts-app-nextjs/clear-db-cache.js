const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearDatabaseCache() {
  try {
    console.log('Clearing database cache with old placeholder URLs...')
    
    // Check for any records with old URLs
    const priceResearchRecords = await prisma.priceResearch.findMany({
      where: {
        OR: [
          { marketAnalysis: { contains: 'via.placeholder.com' } },
          { marketAnalysis: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    console.log(`Found ${priceResearchRecords.length} price research records with old URLs`)
    
    // Delete price research records with old URLs
    const deletedPriceResearch = await prisma.priceResearch.deleteMany({
      where: {
        OR: [
          { marketAnalysis: { contains: 'via.placeholder.com' } },
          { marketAnalysis: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    console.log(`Deleted ${deletedPriceResearch.count} price research records with old URLs`)
    
    // Check for image processing records
    const imageRecords = await prisma.imageProcessingQueue.findMany({
      where: {
        OR: [
          { imageUrl: { contains: 'via.placeholder.com' } },
          { imageUrl: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    console.log(`Found ${imageRecords.length} image processing records with old URLs`)
    
    // Delete image processing records with old URLs
    const deletedImages = await prisma.imageProcessingQueue.deleteMany({
      where: {
        OR: [
          { imageUrl: { contains: 'via.placeholder.com' } },
          { imageUrl: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    console.log(`Deleted ${deletedImages.count} image processing records with old URLs`)
    
    // Check for parts master records
    const partsMasterRecords = await prisma.partsMaster.findMany({
      where: {
        OR: [
          { images: { contains: 'via.placeholder.com' } },
          { images: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    console.log(`Found ${partsMasterRecords.length} parts master records with old URLs`)
    
    // Clear images from parts master records
    const updatedPartsMaster = await prisma.partsMaster.updateMany({
      where: {
        OR: [
          { images: { contains: 'via.placeholder.com' } },
          { images: { contains: 'placeholder.com' } }
        ]
      },
      data: {
        images: []
      }
    })
    
    console.log(`Updated ${updatedPartsMaster.count} parts master records to remove old URLs`)
    
    // Check for vehicle photo records
    const vehiclePhotoRecords = await prisma.vehiclePhoto.findMany({
      where: {
        OR: [
          { imageUrl: { contains: 'via.placeholder.com' } },
          { imageUrl: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    console.log(`Found ${vehiclePhotoRecords.length} vehicle photo records with old URLs`)
    
    // Delete vehicle photo records with old URLs
    const deletedVehiclePhotos = await prisma.vehiclePhoto.deleteMany({
      where: {
        OR: [
          { imageUrl: { contains: 'via.placeholder.com' } },
          { imageUrl: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    console.log(`Deleted ${deletedVehiclePhotos.count} vehicle photo records with old URLs`)
    
    console.log('Database cache clearing completed!')
    
  } catch (error) {
    console.error('Error clearing database cache:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearDatabaseCache()
