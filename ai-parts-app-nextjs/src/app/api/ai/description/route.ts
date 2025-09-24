import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      partName, 
      make, 
      model, 
      year, 
      engine, 
      drivetrain, 
      condition = 'used',
      category,
      subCategory 
    } = await request.json()

    if (!partName || !make || !model || !year) {
      return NextResponse.json(
        { success: false, message: 'Part name, make, model, and year are required' },
        { status: 400 }
      )
    }

    console.log(`🤖 Generating AI description for: ${partName} (${year} ${make} ${model})`)

    // Generate professional eBay listing description
    const description = generateListingDescription({
      partName,
      make,
      model,
      year,
      engine,
      drivetrain,
      condition,
      category,
      subCategory
    })

    return NextResponse.json({
      success: true,
      description,
      title: generateListingTitle(partName, make, model, year, condition),
      keywords: generateKeywords(partName, make, model, year, engine, drivetrain)
    })

  } catch (error) {
    console.error('AI description generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate description',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function generateListingDescription({
  partName,
  make,
  model,
  year,
  engine,
  drivetrain,
  condition,
  category,
  subCategory
}: any) {
  const conditionText = condition === 'new' ? 'New' : 'Used'
  const vehicleInfo = `${year} ${make} ${model}`
  
  let description = `**${conditionText} ${partName} for ${vehicleInfo}**\n\n`
  
  // Add vehicle specifications
  if (engine) {
    description += `**Engine:** ${engine}\n`
  }
  if (drivetrain) {
    description += `**Drivetrain:** ${drivetrain}\n`
  }
  
  description += `\n`
  
  // Add condition details
  if (condition === 'used') {
    description += `**Condition:** Used part in good working condition. Shows normal wear consistent with age and mileage. Fully functional unless otherwise stated. Please examine photos carefully for condition details.\n\n`
  } else if (condition === 'new') {
    description += `**Condition:** Brand new, never installed part. Still in original packaging.\n\n`
  } else if (condition === 'refurbished') {
    description += `**Condition:** Professionally refurbished part. Tested and guaranteed to work properly.\n\n`
  }
  
  // Add fitment information
  description += `**Fitment:** This part is compatible with ${vehicleInfo}`
  if (engine) {
    description += ` with ${engine}`
  }
  if (drivetrain) {
    description += ` (${drivetrain})`
  }
  description += `. Please verify compatibility with your specific vehicle before purchasing.\n\n`
  
  // Add category-specific information
  if (category) {
    description += `**Category:** ${category}`
    if (subCategory) {
      description += ` - ${subCategory}`
    }
    description += `\n\n`
  }
  
  // Add standard disclaimers
  description += `**Important Notes:**\n`
  description += `• Part was removed from a donor vehicle\n`
  description += `• Photos show actual item condition\n`
  description += `• Professional installation recommended\n`
  description += `• 30-day return policy applies\n`
  description += `• Fast shipping available\n\n`
  
  description += `**Questions?** Feel free to message me with any questions about this part or its compatibility with your vehicle.\n\n`
  
  description += `Thank you for your business!`
  
  return description
}

function generateListingTitle(partName: string, make: string, model: string, year: number, condition: string) {
  const conditionText = condition === 'new' ? 'NEW' : condition === 'used' ? 'USED' : condition.toUpperCase()
  const vehicleInfo = `${year} ${make} ${model}`
  
  // Create title with optimal length for eBay (80 character limit)
  let title = `${conditionText} ${partName} ${vehicleInfo}`
  
  // Truncate if too long
  if (title.length > 80) {
    title = `${conditionText} ${partName} ${year} ${make} ${model.substring(0, 15)}`
  }
  
  if (title.length > 80) {
    title = `${conditionText} ${partName.substring(0, 20)} ${year} ${make}`
  }
  
  return title
}

function generateKeywords(partName: string, make: string, model: string, year: number, engine?: string, drivetrain?: string) {
  const keywords = [
    partName.toLowerCase(),
    make.toLowerCase(),
    model.toLowerCase(),
    year.toString(),
    'auto parts',
    'car parts',
    'automotive',
    'replacement'
  ]
  
  if (engine) {
    keywords.push(engine.toLowerCase())
  }
  
  if (drivetrain) {
    keywords.push(drivetrain.toLowerCase())
  }
  
  return keywords.join(', ')
}
