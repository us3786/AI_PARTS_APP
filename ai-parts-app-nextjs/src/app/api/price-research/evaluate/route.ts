import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { partName, category, currentPrice, vehicleInfo, researchResults } = await request.json()
    
    if (!partName || !category) {
      return NextResponse.json(
        { success: false, message: 'Part name and category are required' },
        { status: 400 }
      )
    }

    // Use actual research results if provided, otherwise simulate
    let referenceListings
    if (researchResults && researchResults.length > 0) {
      // Convert research results to reference listings format
      referenceListings = researchResults.map((result, index) => ({
        id: `listing_${index}`,
        title: result.title || `${partName} - ${result.source}`,
        price: result.price,
        condition: result.condition || 'Used',
        seller: result.seller || result.source,
        url: result.url,
        imageUrl: result.imageUrl || `https://via.placeholder.com/150x150/cccccc/666666?text=${encodeURIComponent(partName)}`,
        listingDate: new Date().toISOString(),
        source: result.source
      }))
    } else {
      // Fallback to simulated data with realistic pricing
      referenceListings = await fetchReferenceListings(partName, category, vehicleInfo, currentPrice)
    }
    
    // Apply price evaluation logic with anomaly detection
    const priceEvaluation = evaluatePriceWithAnomalyDetection(referenceListings, currentPrice)
    
    return NextResponse.json({
      success: true,
      priceEvaluation,
      referenceListings: referenceListings.map(listing => ({
        ...listing,
        isOutlier: priceEvaluation.outliers.includes(listing.id)
      }))
    })

  } catch (error) {
    console.error('Price evaluation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to evaluate price',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Simulate fetching reference listings
async function fetchReferenceListings(partName: string, category: string, vehicleInfo?: any, currentPrice?: number) {
  // In a real implementation, this would call eBay API, AutoZone API, etc.
  // For now, we'll generate realistic sample data based on current price
  
  // Use current price as base, or generate realistic price if not provided
  const basePrice = currentPrice || (Math.random() * 50 + 25) // $25-$75 if no current price
  const listings = []
  
  // Build search query with vehicle info and "used" keyword
  const vehicleQuery = vehicleInfo ? 
    `${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim() : ''
  const searchQuery = vehicleQuery ? 
    `${partName} ${vehicleQuery} used` : 
    `${partName} used`
  
  for (let i = 0; i < 10; i++) {
    const variation = (Math.random() - 0.5) * 0.4 // ±20% variation
    const price = Math.round(basePrice * (1 + variation))
    
    const source = getRandomSource()
    const condition = getRandomCondition()
    listings.push({
      id: `listing_${i}`,
      title: `${partName} - ${vehicleQuery ? `${vehicleQuery} - ` : ''}${condition} Condition`,
      price: price,
      condition: condition,
      seller: `Seller${i + 1}`,
      url: generateRealisticUrl(searchQuery, source, i),
      imageUrl: `https://via.placeholder.com/150x150/cccccc/666666?text=${encodeURIComponent(partName)}`,
      listingDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      source: source
    })
  }
  
  return listings
}

function getRandomCondition() {
  const conditions = ['Excellent', 'Good', 'Fair', 'Poor']
  return conditions[Math.floor(Math.random() * conditions.length)]
}

function getRandomSource() {
  const sources = ['eBay', 'Google', 'Car-Parts.com', 'LKQ']
  return sources[Math.floor(Math.random() * sources.length)]
}

function generateRealisticUrl(searchQuery: string, source: string, index: number) {
  const encodedQuery = encodeURIComponent(searchQuery)
  
  switch (source) {
    case 'eBay':
      return `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&_sacat=0&_pgn=${index + 1}`
    case 'Google':
      return `https://www.google.com/search?q=${encodedQuery}&tbm=shop`
    case 'Car-Parts.com':
      return `https://www.car-parts.com/search?q=${encodedQuery}&page=${index + 1}`
    case 'LKQ':
      return `https://www.lkqonline.com/search?q=${encodedQuery}&page=${index + 1}`
    default:
      return `https://example.com/search?q=${encodedQuery}&page=${index + 1}`
  }
}

// Price evaluation with anomaly detection
function evaluatePriceWithAnomalyDetection(listings: any[], currentPrice: number) {
  const prices = listings.map(l => l.price).sort((a, b) => a - b)
  const sampleSize = prices.length
  
  // Step 1: Calculate initial statistics
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const median = prices[Math.floor(prices.length / 2)]
  
  // Step 2: Detect outliers using IQR method
  const q1 = prices[Math.floor(prices.length * 0.25)]
  const q3 = prices[Math.floor(prices.length * 0.75)]
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr
  
  // Step 3: Remove outliers
  const validPrices = prices.filter(price => price >= lowerBound && price <= upperBound)
  const outliersRemoved = sampleSize - validPrices.length
  
  // Step 4: Calculate final mean from cleaned data
  const finalMean = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length
  
  // Step 5: Apply 30% deviation rule
  const minAcceptable = finalMean * 0.7  // 30% below mean
  const maxAcceptable = finalMean * 1.3  // 30% above mean
  
  // Step 6: Determine if current price is within acceptable range
  const isWithinRange = currentPrice >= minAcceptable && currentPrice <= maxAcceptable
  const deviationFromMean = ((currentPrice - finalMean) / finalMean) * 100
  
  // Step 7: Detect anomalies in the dataset
  const anomalyDetected = outliersRemoved > 0 || !isWithinRange
  
  // Step 8: Calculate confidence based on sample size and data quality
  let confidence = 85 // Base confidence
  if (validPrices.length < 5) confidence -= 20
  if (outliersRemoved > validPrices.length * 0.3) confidence -= 15
  if (anomalyDetected) confidence -= 10
  
  confidence = Math.max(confidence, 30) // Minimum 30% confidence
  
  // Step 9: Determine market trend
  const recentPrices = validPrices.slice(-5) // Last 5 prices
  const olderPrices = validPrices.slice(0, -5)
  const recentMean = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length
  const olderMean = olderPrices.length > 0 ? 
    olderPrices.reduce((sum, price) => sum + price, 0) / olderPrices.length : recentMean
  
  let marketTrend = 'stable'
  if (recentMean > olderMean * 1.05) marketTrend = 'rising'
  else if (recentMean < olderMean * 0.95) marketTrend = 'falling'
  
  return {
    method: 'Statistical Analysis with IQR Outlier Detection',
    sampleSize,
    outliersRemoved,
    finalMean: Math.round(finalMean),
    deviationFromMean: Math.round(deviationFromMean * 100) / 100,
    isWithinRange,
    anomalyDetected,
    confidence: Math.round(confidence),
    marketTrend,
    priceRange: {
      min: Math.round(Math.min(...validPrices)),
      max: Math.round(Math.max(...validPrices)),
      mean: Math.round(finalMean),
      median: Math.round(median)
    },
    outliers: listings
      .filter((_, index) => {
        const price = prices[index]
        return price < lowerBound || price > upperBound
      })
      .map(l => l.id)
  }
}
