const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupOldPlaceholderData() {
  try {
    console.log('🧹 Starting comprehensive cleanup of old placeholder data...')
    
    // 1. Delete price research records with old placeholder URLs
    const priceResearchRecords = await prisma.priceResearch.findMany({
      where: {
        OR: [
          { marketAnalysis: { contains: 'via.placeholder.com' } },
          { marketAnalysis: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    console.log(`Found ${priceResearchRecords.length} price research records with old placeholder URLs`)
    
    if (priceResearchRecords.length > 0) {
      const deletedPriceResearch = await prisma.priceResearch.deleteMany({
        where: {
          OR: [
            { marketAnalysis: { contains: 'via.placeholder.com' } },
            { marketAnalysis: { contains: 'placeholder.com' } }
          ]
        }
      })
      
      console.log(`✅ Deleted ${deletedPriceResearch.count} price research records with old placeholder URLs`)
    }
    
    // 2. Delete image processing records with old placeholder URLs
    const imageRecords = await prisma.imageProcessingQueue.findMany({
      where: {
        OR: [
          { imageUrl: { contains: 'via.placeholder.com' } },
          { imageUrl: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    console.log(`Found ${imageRecords.length} image processing records with old placeholder URLs`)
    
    if (imageRecords.length > 0) {
      const deletedImages = await prisma.imageProcessingQueue.deleteMany({
        where: {
          OR: [
            { imageUrl: { contains: 'via.placeholder.com' } },
            { imageUrl: { contains: 'placeholder.com' } }
          ]
        }
      })
      
      console.log(`✅ Deleted ${deletedImages.count} image processing records with old placeholder URLs`)
    }
    
    // 3. Clear images from parts master records that contain old placeholder URLs
    const partsMasterRecords = await prisma.partsMaster.findMany({
      where: {
        OR: [
          { images: { contains: 'via.placeholder.com' } },
          { images: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    console.log(`Found ${partsMasterRecords.length} parts master records with old placeholder URLs`)
    
    if (partsMasterRecords.length > 0) {
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
      
      console.log(`✅ Updated ${updatedPartsMaster.count} parts master records to remove old placeholder URLs`)
    }
    
    // 4. Delete vehicle photo records with old placeholder URLs
    const vehiclePhotoRecords = await prisma.vehiclePhoto.findMany({
      where: {
        OR: [
          { imageUrl: { contains: 'via.placeholder.com' } },
          { imageUrl: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    console.log(`Found ${vehiclePhotoRecords.length} vehicle photo records with old placeholder URLs`)
    
    if (vehiclePhotoRecords.length > 0) {
      const deletedVehiclePhotos = await prisma.vehiclePhoto.deleteMany({
        where: {
          OR: [
            { imageUrl: { contains: 'via.placeholder.com' } },
            { imageUrl: { contains: 'placeholder.com' } }
          ]
        }
      })
      
      console.log(`✅ Deleted ${deletedVehiclePhotos.count} vehicle photo records with old placeholder URLs`)
    }
    
    // 5. Check for any remaining records with old URLs
    const remainingPriceResearch = await prisma.priceResearch.count({
      where: {
        OR: [
          { marketAnalysis: { contains: 'via.placeholder.com' } },
          { marketAnalysis: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    const remainingImages = await prisma.imageProcessingQueue.count({
      where: {
        OR: [
          { imageUrl: { contains: 'via.placeholder.com' } },
          { imageUrl: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    const remainingPartsMaster = await prisma.partsMaster.count({
      where: {
        OR: [
          { images: { contains: 'via.placeholder.com' } },
          { images: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    const remainingVehiclePhotos = await prisma.vehiclePhoto.count({
      where: {
        OR: [
          { imageUrl: { contains: 'via.placeholder.com' } },
          { imageUrl: { contains: 'placeholder.com' } }
        ]
      }
    })
    
    console.log('\n📊 Final cleanup summary:')
    console.log(`Remaining price research records with old URLs: ${remainingPriceResearch}`)
    console.log(`Remaining image processing records with old URLs: ${remainingImages}`)
    console.log(`Remaining parts master records with old URLs: ${remainingPartsMaster}`)
    console.log(`Remaining vehicle photo records with old URLs: ${remainingVehiclePhotos}`)
    
    if (remainingPriceResearch === 0 && remainingImages === 0 && remainingPartsMaster === 0 && remainingVehiclePhotos === 0) {
      console.log('\n🎉 All old placeholder data has been successfully cleaned up!')
    } else {
      console.log('\n⚠️ Some old placeholder data may still remain. You may need to run this script again.')
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupOldPlaceholderData()
