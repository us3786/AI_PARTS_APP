import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Image sources for used car parts
const IMAGE_SOURCES = {
  ebay: {
    name: 'eBay Images',
    description: 'High-quality images from eBay listings'
  },
  google: {
    name: 'Google Images',
    description: 'Web search results for part images'
  },
  lkq: {
    name: 'LKQ Images',
    description: 'Images from LKQ used parts inventory'
  },
  carParts: {
    name: 'Car-Parts.com Images',
    description: 'Images from Car-Parts.com listings'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { partId, partName, make, model, year, category, subCategory, maxImages = 10 } = await request.json()
    
    if (!partId || !partName) {
      return NextResponse.json(
        { success: false, message: 'Part ID and name are required' },
        { status: 400 }
      )
    }

    console.log(`🖼️ Starting image hunting for: ${partName} (${year} ${make} ${model})`)

    const vehicleQuery = `${year} ${make} ${model}`.trim()
    const imageResults = []

    // 1. eBay Image Hunting
    try {
      const ebayImages = await huntEbayImages(partName, vehicleQuery, maxImages)
      if (ebayImages.length > 0) {
        imageResults.push(...ebayImages)
      }
    } catch (error) {
      console.error('eBay image hunting error:', error)
    }

    // 2. Google Images Search
    try {
      const googleImages = await huntGoogleImages(partName, vehicleQuery, maxImages)
      if (googleImages.length > 0) {
        imageResults.push(...googleImages)
      }
    } catch (error) {
      console.error('Google image hunting error:', error)
    }

    // 3. LKQ Image Hunting (simulated)
    try {
      const lkqImages = await huntLKQImages(partName, vehicleQuery, maxImages)
      if (lkqImages.length > 0) {
        imageResults.push(...lkqImages)
      }
    } catch (error) {
      console.error('LKQ image hunting error:', error)
    }

    // 4. Car-Parts.com Image Hunting (simulated)
    try {
      const carPartsImages = await huntCarPartsImages(partName, vehicleQuery, maxImages)
      if (carPartsImages.length > 0) {
        imageResults.push(...carPartsImages)
      }
    } catch (error) {
      console.error('Car-Parts.com image hunting error:', error)
    }

    // Rank and filter images by quality
    const rankedImages = rankImagesByQuality(imageResults)
    
    // Use AI analysis to improve image selection
    let aiAnalyzedImages = []
    try {
      console.log(`🤖 Running AI analysis on ${rankedImages.length} images`)
      const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-image-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: rankedImages,
          partName,
          category,
          subCategory
        })
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        if (aiData.success) {
          // Filter and sort by AI recommendations
          aiAnalyzedImages = aiData.recommendedImages || []
          console.log(`✅ AI analysis completed: ${aiAnalyzedImages.length} recommended images`)
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      // Fallback to original ranking if AI fails
      aiAnalyzedImages = rankedImages.slice(0, maxImages)
    }

    // Use AI recommendations or fallback to quality ranking
    const topImages = aiAnalyzedImages.length > 0 ? aiAnalyzedImages : rankedImages.slice(0, maxImages)

    // Save images to database
    const savedImages = await savePartImages(partId, topImages)

    return NextResponse.json({
      success: true,
      message: `Image hunting completed for ${partName}`,
      images: topImages,
      totalFound: imageResults.length,
      totalSaved: savedImages.length,
      sources: [...new Set(topImages.map(img => img.source))]
    })

  } catch (error) {
    console.error('Image hunting error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to complete image hunting',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Hunt for images on eBay
async function huntEbayImages(partName: string, vehicleQuery: string, maxImages: number) {
  try {
    const searchKeywords = `${vehicleQuery} ${partName} used`
    
    // Use existing eBay search API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000'}/api/ebay/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: searchKeywords,
        condition: 'used',
        category: '6030', // Cars & Trucks
        sort: 'price_asc',
        limit: maxImages
      })
    })

    const data = await response.json()
    const images = []

    if (data.success && data.items) {
      for (const item of data.items) {
        if (item.galleryURL && item.galleryURL.length > 0) {
          images.push({
            url: item.galleryURL[0],
            source: 'eBay',
            title: item.title?.[0] || '',
            quality: calculateImageQuality(item.galleryURL[0], item.title?.[0] || ''),
            dimensions: { width: 225, height: 225 }, // eBay thumbnail size
            listingUrl: item.viewItemURL?.[0] || '',
            price: parseFloat(item.sellingStatus?.currentPrice?.__value__ || '0')
          })
        }
      }
    }

    return images
  } catch (error) {
    console.error('eBay image hunting error:', error)
    return []
  }
}

// Hunt for images via Google Images (simulated)
async function huntGoogleImages(partName: string, vehicleQuery: string, maxImages: number) {
  try {
    // Simulate Google Images search results
    // In production, this would use Google Custom Search API with image search
    const searchQuery = `${vehicleQuery} ${partName} used parts images`
    
    const mockImages = [
      {
        url: `https://via.placeholder.com/400x300/cccccc/666666?text=${encodeURIComponent(partName)}`,
        source: 'Google Images',
        title: `${vehicleQuery} ${partName} - Used Parts`,
        quality: 85,
        dimensions: { width: 400, height: 300 },
        listingUrl: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=isch`,
        price: 0
      },
      {
        url: `https://via.placeholder.com/350x250/cccccc/666666?text=${encodeURIComponent(partName)}`,
        source: 'Google Images',
        title: `${partName} - Used Automotive Part`,
        quality: 80,
        dimensions: { width: 350, height: 250 },
        listingUrl: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=isch`,
        price: 0
      }
    ]

    return mockImages.slice(0, Math.min(maxImages, mockImages.length))
  } catch (error) {
    console.error('Google image hunting error:', error)
    return []
  }
}

// Hunt for images on LKQ (simulated web scraping)
async function huntLKQImages(partName: string, vehicleQuery: string, maxImages: number) {
  try {
    // Simulate LKQ web scraping for images
    const mockImages = [
      {
        url: `https://via.placeholder.com/300x300/ff6b6b/ffffff?text=LKQ+${encodeURIComponent(partName)}`,
        source: 'LKQ',
        title: `${vehicleQuery} ${partName} - LKQ Used Parts`,
        quality: 90,
        dimensions: { width: 300, height: 300 },
        listingUrl: `https://www.lkqonline.com/search?q=${encodeURIComponent(vehicleQuery + ' ' + partName)}`,
        price: 0
      }
    ]

    return mockImages.slice(0, Math.min(maxImages, mockImages.length))
  } catch (error) {
    console.error('LKQ image hunting error:', error)
    return []
  }
}

// Hunt for images on Car-Parts.com (simulated web scraping)
async function huntCarPartsImages(partName: string, vehicleQuery: string, maxImages: number) {
  try {
    // Simulate Car-Parts.com web scraping for images
    const mockImages = [
      {
        url: `https://via.placeholder.com/250x200/4ecdc4/ffffff?text=CarParts+${encodeURIComponent(partName)}`,
        source: 'Car-Parts.com',
        title: `${vehicleQuery} ${partName} - Car-Parts.com`,
        quality: 88,
        dimensions: { width: 250, height: 200 },
        listingUrl: `https://www.car-parts.com/search?q=${encodeURIComponent(vehicleQuery + ' ' + partName)}`,
        price: 0
      }
    ]

    return mockImages.slice(0, Math.min(maxImages, mockImages.length))
  } catch (error) {
    console.error('Car-Parts.com image hunting error:', error)
    return []
  }
}

// Calculate image quality score based on various factors
function calculateImageQuality(imageUrl: string, title: string): number {
  let quality = 50 // Base quality

  // Check image dimensions (larger is better)
  if (imageUrl.includes('400') || imageUrl.includes('500')) {
    quality += 20
  } else if (imageUrl.includes('300')) {
    quality += 15
  } else if (imageUrl.includes('225')) {
    quality += 10
  }

  // Check title relevance
  const titleLower = title.toLowerCase()
  if (titleLower.includes('used') || titleLower.includes('oem')) {
    quality += 15
  }
  if (titleLower.includes('genuine') || titleLower.includes('original')) {
    quality += 10
  }

  // Source preference
  if (imageUrl.includes('ebay')) {
    quality += 10 // eBay images are usually high quality
  }

  return Math.min(quality, 100) // Cap at 100
}

// Rank images by quality and relevance
function rankImagesByQuality(images: any[]): any[] {
  return images.sort((a, b) => {
    // Primary sort by quality score
    if (b.quality !== a.quality) {
      return b.quality - a.quality
    }
    
    // Secondary sort by source preference
    const sourcePriority = { 'eBay': 4, 'LKQ': 3, 'Car-Parts.com': 2, 'Google Images': 1 }
    const aPriority = sourcePriority[a.source as keyof typeof sourcePriority] || 0
    const bPriority = sourcePriority[b.source as keyof typeof sourcePriority] || 0
    
    return bPriority - aPriority
  })
}

// Save part images to database
async function savePartImages(partId: string, images: any[]) {
  const savedImages = []

  for (const image of images) {
    try {
      // Find the partsMaster - handle both partsMaster and partsInventory IDs
      let partsMaster = await prisma.partsMaster.findUnique({
        where: { id: partId }
      })

      // If not found, try to find via partsInventory
      if (!partsMaster) {
        const partsInventory = await prisma.partsInventory.findUnique({
          where: { id: partId },
          include: { partsMaster: true }
        })
        
        if (partsInventory?.partsMaster) {
          partsMaster = partsInventory.partsMaster
          console.log(`Found partsMaster via inventory: ${partsMaster.partName}`)
        }
      }

      if (partsMaster) {
        const existingImages = Array.isArray(partsMaster.images) ? partsMaster.images : []
        const newImages = [...existingImages, {
          url: image.url,
          source: image.source,
          title: image.title,
          quality: image.quality,
          dimensions: image.dimensions,
          listingUrl: image.listingUrl,
          addedDate: new Date().toISOString()
        }]

        await prisma.partsMaster.update({
          where: { id: partsMaster.id },
          data: { images: newImages }
        })

        savedImages.push({
          url: image.url,
          source: image.source,
          quality: image.quality
        })
        
        console.log(`Saved image for ${partsMaster.partName}`)
      } else {
        console.error(`Could not find partsMaster for partId: ${partId}`)
      }
    } catch (error) {
      console.error('Error saving image:', error)
    }
  }

  return savedImages
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partId = searchParams.get('partId')
    const source = searchParams.get('source')

    console.log('Image hunting GET request for partId:', partId, 'source:', source)

    if (!partId) {
      return NextResponse.json(
        { success: false, message: 'Part ID is required' },
        { status: 400 }
      )
    }

    // Debug: Check if there are any parts in the database
    const totalPartsMaster = await prisma.partsMaster.count()
    const totalPartsInventory = await prisma.partsInventory.count()
    console.log(`Database stats: ${totalPartsMaster} partsMaster, ${totalPartsInventory} partsInventory`)

    // Get part images from database - handle both partsMaster and partsInventory IDs
    let partsMaster = null
    let partsInventory = null
    
    // First, try to find directly in partsMaster
    partsMaster = await prisma.partsMaster.findUnique({
      where: { id: partId },
      select: { images: true, partName: true }
    })
    
    console.log('Direct partsMaster lookup:', partsMaster ? 'Found' : 'Not found')

    // If not found, try to find via partsInventory (most common case)
    if (!partsMaster) {
      partsInventory = await prisma.partsInventory.findUnique({
        where: { id: partId },
        include: {
          partsMaster: {
            select: { images: true, partName: true }
          }
        }
      })
      
      if (partsInventory?.partsMaster) {
        partsMaster = partsInventory.partsMaster
        console.log('Found via partsInventory:', partsMaster.partName, 'Inventory ID:', partsInventory.id)
      }
    }

    console.log('Final partsMaster result:', partsMaster ? `Found: ${partsMaster.partName}` : 'Not found')

    if (!partsMaster) {
      return NextResponse.json(
        { success: false, message: 'Part not found' },
        { status: 404 }
      )
    }

    let images = Array.isArray(partsMaster.images) ? partsMaster.images : []
    console.log('Images array length:', images.length)

    // If no images found, provide sample images for demonstration
    if (images.length === 0) {
      console.log('No images found, providing sample images for:', partsMaster.partName)
      images = [
        {
          url: `https://via.placeholder.com/400x300/4f46e5/ffffff?text=${encodeURIComponent(partsMaster.partName)}`,
          source: 'Sample Image',
          title: `${partsMaster.partName} - Sample Image`,
          quality: 85,
          dimensions: { width: 400, height: 300 },
          listingUrl: `https://www.google.com/search?q=${encodeURIComponent(partsMaster.partName + ' used parts')}`,
          addedDate: new Date().toISOString()
        },
        {
          url: `https://via.placeholder.com/350x250/059669/ffffff?text=${encodeURIComponent(partsMaster.partName)}`,
          source: 'Sample Image',
          title: `${partsMaster.partName} - Alternative View`,
          quality: 80,
          dimensions: { width: 350, height: 250 },
          listingUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(partsMaster.partName + ' used')}`,
          addedDate: new Date().toISOString()
        }
      ]
    }

    // Filter by source if specified
    if (source) {
      images = images.filter((img: any) => img.source === source)
    }

    // Sort by quality
    images.sort((a: any, b: any) => (b.quality || 0) - (a.quality || 0))

    return NextResponse.json({
      success: true,
      partName: partsMaster.partName,
      images,
      totalImages: images.length,
      sources: [...new Set(images.map((img: any) => img.source))]
    })

  } catch (error) {
    console.error('Error fetching part images:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch part images',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
