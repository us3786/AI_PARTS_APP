import { NextRequest, NextResponse } from 'next/server'

// AI-powered image analysis for consistency and quality
export async function POST(request: NextRequest) {
  try {
    const { images, partName, category, subCategory } = await request.json()
    
    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { success: false, message: 'Images array is required' },
        { status: 400 }
      )
    }

    console.log(`🤖 Starting AI image analysis for ${partName} (${images.length} images)`)

    const analysisResults = []

    for (const image of images) {
      try {
        const analysis = await analyzeImageWithAI(image, partName, category, subCategory)
        analysisResults.push({
          url: image.url,
          ...analysis
        })
      } catch (error) {
        console.error('Error analyzing image:', error)
        analysisResults.push({
          url: image.url,
          error: 'Analysis failed',
          quality: 0,
          consistency: 0,
          isRelevant: false
        })
      }
    }

    // Calculate overall consistency score
    const validAnalyses = analysisResults.filter(a => !a.error)
    const overallConsistency = calculateOverallConsistency(validAnalyses)
    const recommendedImages = getRecommendedImages(analysisResults)

    return NextResponse.json({
      success: true,
      message: `AI analysis completed for ${partName}`,
      analysisResults,
      overallConsistency,
      recommendedImages,
      totalAnalyzed: analysisResults.length,
      validAnalyses: validAnalyses.length
    })

  } catch (error) {
    console.error('AI image analysis error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to complete AI image analysis',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Analyze individual image with AI
async function analyzeImageWithAI(image: any, partName: string, category: string, subCategory: string) {
  // Simulate AI analysis - in production, this would call a real AI service
  const analysis = {
    quality: 0,
    consistency: 0,
    isRelevant: false,
    confidence: 0,
    issues: [] as string[],
    recommendations: [] as string[],
    aiScore: 0
  }

  // 1. Quality Analysis
  analysis.quality = analyzeImageQuality(image)
  
  // 2. Relevance Analysis
  const relevance = analyzeRelevance(image, partName, category, subCategory)
  analysis.isRelevant = relevance.isRelevant
  analysis.confidence = relevance.confidence
  
  // 3. Consistency Analysis
  analysis.consistency = analyzeConsistency(image, partName, category)
  
  // 4. Issue Detection
  analysis.issues = detectImageIssues(image)
  
  // 5. Generate Recommendations
  analysis.recommendations = generateRecommendations(analysis, image)
  
  // 6. Overall AI Score
  analysis.aiScore = calculateAIScore(analysis)

  return analysis
}

// Analyze image quality based on various factors
function analyzeImageQuality(image: any): number {
  let quality = 50 // Base score

  // Check image dimensions
  if (image.dimensions) {
    const { width, height } = image.dimensions
    if (width >= 800 && height >= 600) quality += 20
    else if (width >= 400 && height >= 300) quality += 10
    else if (width < 200 || height < 150) quality -= 20
  }

  // Check if image has good aspect ratio
  if (image.dimensions) {
    const { width, height } = image.dimensions
    const aspectRatio = width / height
    if (aspectRatio >= 0.8 && aspectRatio <= 1.2) quality += 10 // Square-ish is good
    else if (aspectRatio < 0.5 || aspectRatio > 2) quality -= 15 // Too wide or tall
  }

  // Check source reliability
  switch (image.source) {
    case 'eBay': quality += 15; break
    case 'Google': quality += 10; break
    case 'LKQ': quality += 12; break
    case 'Car-Parts.com': quality += 8; break
    default: quality += 5; break
  }

  // Check if image has good title/description
  if (image.title && image.title.length > 10) quality += 5
  if (image.title && image.title.toLowerCase().includes(image.partName?.toLowerCase())) quality += 10

  return Math.min(100, Math.max(0, quality))
}

// Analyze if image is relevant to the part
function analyzeRelevance(image: any, partName: string, category: string, subCategory: string) {
  let relevanceScore = 0
  let confidence = 0

  // Check title relevance
  if (image.title) {
    const title = image.title.toLowerCase()
    const part = partName.toLowerCase()
    
    if (title.includes(part)) {
      relevanceScore += 40
      confidence += 30
    }
    
    // Check for category keywords
    const categoryKeywords = getCategoryKeywords(category, subCategory)
    for (const keyword of categoryKeywords) {
      if (title.includes(keyword.toLowerCase())) {
        relevanceScore += 10
        confidence += 5
      }
    }
  }

  // Check URL relevance
  if (image.url) {
    const url = image.url.toLowerCase()
    if (url.includes(partName.toLowerCase())) {
      relevanceScore += 20
      confidence += 15
    }
  }

  // Check source relevance
  if (image.source === 'eBay' || image.source === 'LKQ' || image.source === 'Car-Parts.com') {
    relevanceScore += 15
    confidence += 10
  }

  return {
    isRelevant: relevanceScore >= 30,
    confidence: Math.min(100, confidence),
    score: relevanceScore
  }
}

// Analyze consistency with other images
function analyzeConsistency(image: any, partName: string, category: string): number {
  let consistency = 50 // Base score

  // Check if image follows naming conventions
  if (image.title && image.title.includes(partName)) consistency += 20
  
  // Check if image has proper metadata
  if (image.source && image.quality && image.dimensions) consistency += 15
  
  // Check if image is from reliable source
  const reliableSources = ['eBay', 'LKQ', 'Car-Parts.com']
  if (reliableSources.includes(image.source)) consistency += 15
  
  // Check image quality consistency
  if (image.quality >= 70) consistency += 10

  return Math.min(100, consistency)
}

// Detect common image issues
function detectImageIssues(image: any): string[] {
  const issues = []

  // Check for missing metadata
  if (!image.title || image.title.length < 5) {
    issues.push('Missing or poor title')
  }

  if (!image.dimensions || (image.dimensions.width < 200 || image.dimensions.height < 150)) {
    issues.push('Low resolution image')
  }

  if (!image.source || image.source === 'Unknown') {
    issues.push('Unknown source')
  }

  if (image.quality < 50) {
    issues.push('Poor quality score')
  }

  // Check for suspicious URLs
  if (image.url && (image.url.includes('placeholder') || image.url.includes('no-image'))) {
    issues.push('Placeholder or broken image')
  }

  return issues
}

// Generate recommendations for image improvement
function generateRecommendations(analysis: any, image: any): string[] {
  const recommendations = []

  if (analysis.quality < 70) {
    recommendations.push('Consider finding higher quality image')
  }

  if (!analysis.isRelevant) {
    recommendations.push('Image may not be relevant to this part')
  }

  if (analysis.consistency < 60) {
    recommendations.push('Image lacks consistency with part specifications')
  }

  if (analysis.issues.length > 0) {
    recommendations.push('Address detected issues: ' + analysis.issues.join(', '))
  }

  if (image.source === 'Google' && analysis.quality < 80) {
    recommendations.push('Consider using more reliable source like eBay or LKQ')
  }

  return recommendations
}

// Calculate overall AI score
function calculateAIScore(analysis: any): number {
  const weights = {
    quality: 0.3,
    relevance: 0.4,
    consistency: 0.2,
    issues: 0.1
  }

  let score = 0
  score += analysis.quality * weights.quality
  score += (analysis.isRelevant ? 100 : 0) * weights.relevance
  score += analysis.consistency * weights.consistency
  score += Math.max(0, 100 - (analysis.issues.length * 20)) * weights.issues

  return Math.round(score)
}

// Calculate overall consistency across all images
function calculateOverallConsistency(analyses: any[]): number {
  if (analyses.length === 0) return 0

  const avgQuality = analyses.reduce((sum, a) => sum + a.quality, 0) / analyses.length
  const avgConsistency = analyses.reduce((sum, a) => sum + a.consistency, 0) / analyses.length
  const relevanceRate = analyses.filter(a => a.isRelevant).length / analyses.length

  return Math.round((avgQuality * 0.4 + avgConsistency * 0.3 + relevanceRate * 100 * 0.3))
}

// Get recommended images based on AI analysis
function getRecommendedImages(analyses: any[]): any[] {
  return analyses
    .filter(a => !a.error && a.isRelevant && a.quality >= 60)
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 5) // Top 5 recommended images
}

// Get category-specific keywords for relevance checking
function getCategoryKeywords(category: string, subCategory: string): string[] {
  const keywords = []

  // Add category keywords
  if (category) {
    keywords.push(category)
  }

  // Add subcategory keywords
  if (subCategory) {
    keywords.push(subCategory)
  }

  // Add common automotive part keywords
  const commonKeywords = [
    'part', 'component', 'replacement', 'oem', 'aftermarket',
    'used', 'salvage', 'junkyard', 'auto', 'car', 'truck',
    'engine', 'transmission', 'brake', 'suspension', 'electrical'
  ]

  keywords.push(...commonKeywords)

  return keywords
}
