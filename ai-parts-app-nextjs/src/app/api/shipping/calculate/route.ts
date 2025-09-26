import { NextRequest, NextResponse } from 'next/server'
import { 
  calculateShippingCost, 
  getRecommendedShippingOption,
  calculateTotalListingCost,
  ShippingDestination,
  ShippingDimensions 
} from '@/lib/shipping-calculator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      partName, 
      partCategory, 
      destination, 
      customDimensions,
      partPrice,
      freeShippingThreshold 
    } = body

    if (!partName || !partCategory || !destination) {
      return NextResponse.json(
        { success: false, message: 'Part name, category, and destination are required' },
        { status: 400 }
      )
    }

    // Validate destination
    const shippingDestination: ShippingDestination = {
      zipCode: destination.zipCode || '90210', // Default to LA
      country: destination.country || 'US',
      state: destination.state,
      city: destination.city
    }

    // Calculate all shipping options
    const shippingOptions = calculateShippingCost(
      partName, 
      partCategory, 
      shippingDestination,
      customDimensions
    )

    // Get recommended option
    const recommendedOption = getRecommendedShippingOption(
      partName, 
      partCategory, 
      shippingDestination
    )

    // Calculate total cost if part price provided
    let totalCostInfo = null
    if (partPrice) {
      totalCostInfo = calculateTotalListingCost(
        partPrice,
        partName,
        partCategory,
        shippingDestination,
        freeShippingThreshold
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        partName,
        partCategory,
        destination: shippingDestination,
        shippingOptions,
        recommendedOption,
        totalCostInfo,
        calculatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to calculate shipping costs',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partName = searchParams.get('partName')
    const partCategory = searchParams.get('partCategory')
    const zipCode = searchParams.get('zipCode') || '90210'

    if (!partName || !partCategory) {
      return NextResponse.json(
        { success: false, message: 'Part name and category are required' },
        { status: 400 }
      )
    }

    const destination: ShippingDestination = {
      zipCode,
      country: 'US'
    }

    const shippingOptions = calculateShippingCost(partName, partCategory, destination)
    const recommendedOption = getRecommendedShippingOption(partName, partCategory, destination)

    return NextResponse.json({
      success: true,
      data: {
        partName,
        partCategory,
        destination,
        shippingOptions,
        recommendedOption,
        calculatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to calculate shipping costs',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
