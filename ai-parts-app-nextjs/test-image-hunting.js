const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testImageHunting() {
  try {
    console.log('🔍 Testing image hunting functionality...\n')
    
    // Check if we have any parts in the database
    const partsCount = await prisma.partsMaster.count()
    console.log('📦 Total parts in database:', partsCount)
    
    if (partsCount === 0) {
      console.log('❌ No parts found in database. Please populate parts first.')
      return
    }
    
    // Get a sample part to test with
    const samplePart = await prisma.partsMaster.findFirst({
      select: {
        id: true,
        partName: true,
        images: true
      }
    })
    
    if (!samplePart) {
      console.log('❌ No sample part found.')
      return
    }
    
    console.log('🎯 Testing with sample part:', samplePart.partName)
    console.log('📸 Current images for this part:', Array.isArray(samplePart.images) ? samplePart.images.length : 0)
    
    // Test the image hunting API
    console.log('\n🚀 Testing image hunting API...')
    
    const response = await fetch('http://localhost:3000/api/image-hunting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        partId: samplePart.id,
        partName: samplePart.partName,
        make: 'MITSUBISHI',
        model: 'Mirage',
        year: 2014,
        category: 'Engine',
        subCategory: 'Engine Components',
        maxImages: 3
      })
    })
    
    if (!response.ok) {
      console.log('❌ Image hunting API failed:', response.status, response.statusText)
      return
    }
    
    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Image hunting successful!')
      console.log('📊 Results:')
      console.log('  - Total found:', data.totalFound)
      console.log('  - Total saved:', data.totalSaved)
      console.log('  - Sources:', data.sources?.join(', ') || 'None')
      console.log('  - Images:', data.images?.length || 0)
      
      if (data.images && data.images.length > 0) {
        console.log('\n🖼️ Sample images found:')
        data.images.slice(0, 3).forEach((img, index) => {
          console.log(`  ${index + 1}. ${img.title || 'Untitled'}`)
          console.log(`     Source: ${img.source}`)
          console.log(`     URL: ${img.url?.substring(0, 80)}...`)
          console.log(`     Quality: ${img.quality}/100`)
        })
      }
    } else {
      console.log('❌ Image hunting failed:', data.message)
    }
    
    // Check if images were saved to database
    console.log('\n🔍 Checking if images were saved to database...')
    const updatedPart = await prisma.partsMaster.findUnique({
      where: { id: samplePart.id },
      select: { images: true }
    })
    
    if (updatedPart && Array.isArray(updatedPart.images)) {
      console.log('✅ Images saved to database:', updatedPart.images.length)
      
      updatedPart.images.forEach((img, index) => {
        if (typeof img === 'object' && img.url) {
          console.log(`  ${index + 1}. ${img.title || 'Untitled'} (${img.source})`)
        }
      })
    } else {
      console.log('❌ No images found in database after hunting')
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testImageHunting()
