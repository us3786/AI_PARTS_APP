const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkImages() {
  try {
    console.log('🔍 Checking real images in database...\n')
    
    // Check partsMaster images
    const partsMaster = await prisma.partsMaster.findMany({
      select: {
        id: true,
        partName: true,
        images: true
      }
    })
    
    console.log('📦 PartsMaster records:', partsMaster.length)
    
    let totalImages = 0
    let partsWithImages = 0
    let realImages = 0
    let placeholderImages = 0
    let sampleRealImages = []
    
    partsMaster.forEach(part => {
      if (part.images && Array.isArray(part.images)) {
        partsWithImages++
        totalImages += part.images.length
        
        part.images.forEach(img => {
          if (typeof img === 'object' && img.url) {
            if (img.url.includes('via.placeholder.com') || 
                img.url.includes('placeholder.com') ||
                img.url.includes('data:image/svg') ||
                img.url.includes('/api/placeholder')) {
              placeholderImages++
            } else {
              realImages++
              if (sampleRealImages.length < 5) {
                sampleRealImages.push({
                  partName: part.partName,
                  url: img.url.substring(0, 100) + '...',
                  source: img.source || 'Unknown'
                })
              }
            }
          }
        })
      }
    })
    
    console.log('\n📊 Image Statistics:')
    console.log('- Total parts:', partsMaster.length)
    console.log('- Parts with images:', partsWithImages)
    console.log('- Total images:', totalImages)
    console.log('- Real images:', realImages)
    console.log('- Placeholder/SVG images:', placeholderImages)
    
    if (sampleRealImages.length > 0) {
      console.log('\n✅ Sample Real Images:')
      sampleRealImages.forEach(img => {
        console.log(`  - ${img.partName}: ${img.url} (${img.source})`)
      })
    }
    
    // Check ImageProcessingQueue
    console.log('\n🔍 Checking ImageProcessingQueue...')
    const imageQueue = await prisma.imageProcessingQueue.findMany({
      select: {
        id: true,
        imageUrl: true,
        status: true
      }
    })
    
    console.log('ImageProcessingQueue records:', imageQueue.length)
    
    let queueRealImages = 0
    let queuePlaceholders = 0
    
    imageQueue.forEach(item => {
      if (item.imageUrl) {
        if (item.imageUrl.includes('via.placeholder.com') || 
            item.imageUrl.includes('placeholder.com')) {
          queuePlaceholders++
        } else {
          queueRealImages++
        }
      }
    })
    
    console.log('- Queue real images:', queueRealImages)
    console.log('- Queue placeholders:', queuePlaceholders)
    
    // Check VehiclePhotos
    console.log('\n🔍 Checking VehiclePhotos...')
    const vehiclePhotos = await prisma.vehiclePhoto.findMany({
      select: {
        id: true,
        imageUrl: true,
        partName: true
      }
    })
    
    console.log('VehiclePhotos records:', vehiclePhotos.length)
    
    let vehicleRealImages = 0
    let vehiclePlaceholders = 0
    
    vehiclePhotos.forEach(photo => {
      if (photo.imageUrl) {
        if (photo.imageUrl.includes('via.placeholder.com') || 
            photo.imageUrl.includes('placeholder.com')) {
          vehiclePlaceholders++
        } else {
          vehicleRealImages++
        }
      }
    })
    
    console.log('- Vehicle real images:', vehicleRealImages)
    console.log('- Vehicle placeholders:', vehiclePlaceholders)
    
    console.log('\n📈 Summary:')
    console.log(`Total real images across all tables: ${realImages + queueRealImages + vehicleRealImages}`)
    console.log(`Total placeholder images: ${placeholderImages + queuePlaceholders + vehiclePlaceholders}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkImages()
