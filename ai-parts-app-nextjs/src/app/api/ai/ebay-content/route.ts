import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      partName, make, model, year, engine, drivetrain, condition, category, price,
      vin, trim, generateTitle = true, generateDescription = true 
    } = await request.json()
    
    if (!partName || !make || !model || !year) {
      return NextResponse.json(
        { success: false, message: 'Part name, make, model, and year are required' },
        { status: 400 }
      )
    }

    console.log(`🤖 Generating eBay content for: ${partName} (${year} ${make} ${model})`)

    let title = ''
    let description = ''
    let keywords = ''

    // Generate title only if requested
    if (generateTitle) {
      title = generateEbayTitle(partName, make, model, year, engine, drivetrain, condition)
    }
    
    // Generate description only if requested
    if (generateDescription) {
      description = generateEbayDescription(partName, make, model, year, engine, drivetrain, condition, category, price, vin, trim)
    }
    
    // Generate keywords for SEO
    keywords = generateKeywords(partName, make, model, year, engine, drivetrain, condition)

    return NextResponse.json({
      success: true,
      title,
      description,
      keywords,
      metadata: {
        partName,
        vehicle: `${year} ${make} ${model}`,
        condition,
        category,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error generating eBay content:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate eBay content',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function generateEbayTitle(partName: string, make: string, model: string, year: number, engine?: string, drivetrain?: string, condition: string = 'used') {
  // Clean and format part name
  const cleanPartName = partName.replace(/\s+/g, ' ').trim()
  
  // Build title components
  const vehicleInfo = `${year} ${make} ${model}`
  const conditionText = condition === 'used' ? 'Used' : condition === 'new' ? 'New' : condition.charAt(0).toUpperCase() + condition.slice(1)
  
  // Add engine info if available
  let engineInfo = ''
  if (engine && engine.trim()) {
    engineInfo = ` ${engine}`
  }
  
  // Add drivetrain info if available
  let drivetrainInfo = ''
  if (drivetrain && drivetrain.trim()) {
    drivetrainInfo = ` ${drivetrain}`
  }
  
  // Construct title with proper eBay format
  const title = `${conditionText} ${cleanPartName} for ${vehicleInfo}${engineInfo}${drivetrainInfo} - Auto Parts`
  
  // Ensure title is not too long (eBay limit is 80 characters)
  return title.length > 80 ? title.substring(0, 77) + '...' : title
}

function generateEbayDescription(partName: string, make: string, model: string, year: number, engine?: string, drivetrain?: string, condition: string = 'used', category?: string, price?: number, vin?: string, trim?: string) {
  const vehicleInfo = `${year} ${make} ${model}`
  const conditionText = condition === 'used' ? 'used' : condition === 'new' ? 'new' : condition.toLowerCase()
  
  let description = ``
  
  // Header with complete vehicle information
  let fullVehicleInfo = `${year} ${make} ${model}`
  if (trim) fullVehicleInfo += ` ${trim}`
  if (engine) fullVehicleInfo += ` ${engine}`
  if (drivetrain) fullVehicleInfo += ` ${drivetrain}`
  
  description += `<h2>${partName} for ${fullVehicleInfo}</h2>\n\n`
  
  // Condition and compatibility
  description += `<p><strong>Condition:</strong> ${conditionText.charAt(0).toUpperCase() + conditionText.slice(1)}</p>\n`
  description += `<p><strong>Vehicle Compatibility:</strong> ${fullVehicleInfo}</p>\n`
  
  // VIN Information
  if (vin) {
    description += `<p><strong>VIN Number:</strong> ${vin}</p>\n`
  }
  
  // Engine and Drivetrain details
  if (engine || drivetrain) {
    description += `<p><strong>Engine & Drivetrain:</strong>`
    if (engine) description += ` ${engine}`
    if (drivetrain) description += ` ${drivetrain}`
    description += `</p>\n`
  }
  
  // Category info
  if (category) {
    description += `<p><strong>Part Category:</strong> ${category}</p>\n`
  }
  
  // Price info if available
  if (price) {
    description += `<p><strong>Price:</strong> $${price.toFixed(2)}</p>\n\n`
  }
  
  // Detailed description
  description += `<h3>Description</h3>\n`
  description += `<p>This ${conditionText} ${partName.toLowerCase()} is specifically designed for the ${fullVehicleInfo}. `
  description += `It's a high-quality replacement part that maintains the original functionality and fit of your vehicle.</p>\n\n`
  
  // Car Pictures Information
  description += `<h3>Vehicle Pictures</h3>\n`
  description += `<p>This listing includes 6 detailed pictures of the donor vehicle showing:</p>\n`
  description += `<ul>\n`
  description += `<li>Front view of the ${fullVehicleInfo}</li>\n`
  description += `<li>Rear view showing overall condition</li>\n`
  description += `<li>Side profile view</li>\n`
  description += `<li>Engine bay showing the ${partName.toLowerCase()} location</li>\n`
  description += `<li>Interior condition</li>\n`
  description += `<li>VIN tag verification (VIN: ${vin || 'Available upon request'})</li>\n`
  description += `</ul>\n\n`
  
  // Features
  description += `<h3>Features</h3>\n`
  description += `<ul>\n`
  description += `<li>Direct fit for ${fullVehicleInfo}</li>\n`
  description += `<li>${conditionText.charAt(0).toUpperCase() + conditionText.slice(1)} condition</li>\n`
  description += `<li>Maintains original specifications</li>\n`
  description += `<li>Easy installation</li>\n`
  description += `<li>Quality guaranteed</li>\n`
  description += `<li>Includes 6 vehicle photos for verification</li>\n`
  description += `</ul>\n\n`
  
  // Installation note
  description += `<h3>Installation</h3>\n`
  description += `<p>This part is designed for direct replacement installation. `
  description += `We recommend having it installed by a qualified mechanic to ensure proper fit and function.</p>\n\n`
  
  // Condition details
  if (condition === 'used') {
    description += `<h3>Condition Details</h3>\n`
    description += `<p>This is a ${conditionText} part that has been inspected for functionality and fit. `
    description += `It may show signs of normal wear consistent with its age and usage. `
    description += `All critical functions are working properly.</p>\n\n`
  }
  
  // Shipping info
  description += `<h3>Shipping</h3>\n`
  description += `<p>Item will be carefully packaged and shipped within 1-2 business days. `
  description += `Tracking information will be provided upon shipment.</p>\n\n`
  
  // Return policy
  description += `<h3>Return Policy</h3>\n`
  description += `<p>30-day return policy for defective items. `
  description += `Buyer pays return shipping unless item is defective.</p>\n\n`
  
  // Contact info
  description += `<p><strong>Questions?</strong> Please contact us before purchasing if you have any questions about compatibility or condition.</p>`
  
  return description
}

function generateKeywords(partName: string, make: string, model: string, year: number, engine?: string, drivetrain?: string, condition: string = 'used') {
  const keywords = []
  
  // Basic keywords
  keywords.push(partName.toLowerCase())
  keywords.push(`${make} ${model}`.toLowerCase())
  keywords.push(`${year} ${make} ${model}`.toLowerCase())
  keywords.push(`${make} ${model} ${year}`.toLowerCase())
  
  // Part variations
  keywords.push(partName.toLowerCase().replace(/\s+/g, ''))
  keywords.push(partName.toLowerCase().replace(/\s+/g, '-'))
  
  // Condition keywords
  if (condition === 'used') {
    keywords.push('used', 'pre-owned', 'second hand')
  } else if (condition === 'new') {
    keywords.push('new', 'oem', 'original')
  }
  
  // Vehicle variations
  keywords.push(make.toLowerCase())
  keywords.push(model.toLowerCase())
  keywords.push(year.toString())
  
  // Engine and drivetrain
  if (engine) {
    keywords.push(engine.toLowerCase())
    keywords.push(`${year} ${make} ${model} ${engine}`.toLowerCase())
  }
  
  if (drivetrain) {
    keywords.push(drivetrain.toLowerCase())
  }
  
  // Auto parts keywords
  keywords.push('auto parts', 'car parts', 'automotive', 'replacement', 'oem', 'aftermarket')
  
  // Remove duplicates and return
  return [...new Set(keywords)].join(', ')
}
