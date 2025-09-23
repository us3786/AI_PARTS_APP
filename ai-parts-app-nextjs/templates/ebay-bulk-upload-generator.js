/**
 * eBay Bulk Upload Generator
 * Converts parts inventory data to eBay CSV format
 */

class EbayBulkUploadGenerator {
  constructor() {
    this.conditionCodes = {
      'New': '1000',
      'Used': '3000',
      'Refurbished': '2000'
    }
    
    this.categoryMapping = {
      'Engine': '6030',
      'Transmission': '6030', 
      'Brakes': '6030',
      'Suspension': '6030',
      'Electrical': '6030',
      'Body': '6030',
      'Interior': '6030',
      'Exterior': '6030'
    }
    
    this.shippingCosts = {
      'light': 4.99,    // < 1 lb
      'medium': 8.99,   // 1-5 lbs
      'heavy': 12.99,   // 5-15 lbs
      'oversized': 15.99 // 15+ lbs
    }
  }

  /**
   * Generate eBay listing title
   */
  generateTitle(part) {
    const { partName, make, model, year, trimLevel, brand, engineSize, driveType } = part
    
    // Build title components
    let title = `${year} ${make} ${model}`
    
    // Add trim level if different from base model
    if (trimLevel && trimLevel !== model) {
      title += ` ${trimLevel}`
    }
    
    // Add engine size for engine-related parts
    if (engineSize && (partName.toLowerCase().includes('engine') || partName.toLowerCase().includes('motor'))) {
      title += ` ${engineSize}`
    }
    
    // Add drive type for drive-related parts
    if (driveType && this.isDriveRelatedPart(partName)) {
      title += ` ${driveType}`
    }
    
    // Add part name
    title += ` ${partName}`
    
    // Add condition (Used)
    title += ' Used'
    
    // Add brand only if it's different from make
    if (brand && brand !== make) {
      title += ` ${brand}`
    }
    
    return title.trim().substring(0, 80) // eBay title limit
  }

  /**
   * Check if part is drive-related and needs drive type in title
   */
  isDriveRelatedPart(partName) {
    const driveRelatedKeywords = [
      'transmission', 'transaxle', 'differential', 'axle', 'driveshaft', 'cv joint',
      'transfer case', 'clutch', 'flywheel', 'torque converter', 'gearbox',
      'front axle', 'rear axle', 'half shaft', 'drive shaft', 'prop shaft'
    ]
    
    const partNameLower = partName.toLowerCase()
    return driveRelatedKeywords.some(keyword => partNameLower.includes(keyword))
  }

  /**
   * Generate eBay listing description
   */
  generateDescription(part) {
    const { partName, make, model, year, trimLevel, engineSize, category, brand } = part
    const brandName = brand || make
    
    return `Used ${brandName} ${partName} removed from ${year} ${make} ${model} ${trimLevel || ''}. 
Part shows normal wear from use but functions properly. 
Cleaned and inspected. Fits ${year} ${make} ${model} ${trimLevel || ''} models with ${engineSize || 'standard'} engine. 
Professional removal. Ready to install.`
  }

  /**
   * Generate item specifics
   */
  generateItemSpecifics(part) {
    const { category, subCategory, make, model, year, engineSize, driveType } = part
    const specifics = [
      `Part Type: ${category}`,
      'Condition: Used',
      `Compatibility: ${make} ${model} ${year}`
    ]
    
    if (engineSize) {
      specifics.push(`Engine Size: ${engineSize}`)
    }
    
    if (driveType) {
      specifics.push(`Drive Type: ${driveType}`)
    }
    
    if (subCategory) {
      specifics.push(`Position: ${subCategory}`)
    }
    
    return specifics.join('|')
  }

  /**
   * Calculate shipping cost based on part category
   */
  calculateShippingCost(category) {
    const weightMapping = {
      'Engine': 'oversized',
      'Transmission': 'oversized', 
      'Brakes': 'medium',
      'Suspension': 'heavy',
      'Electrical': 'light',
      'Body': 'heavy',
      'Interior': 'light',
      'Exterior': 'medium'
    }
    
    const weight = weightMapping[category] || 'medium'
    return this.shippingCosts[weight]
  }

  /**
   * Generate pricing based on market analysis
   */
  generatePricing(marketAnalysis) {
    const averagePrice = marketAnalysis.averagePrice || 0
    const recommendedPrice = marketAnalysis.recommendedPrice || averagePrice
    
    return {
      startPrice: (averagePrice * 0.8).toFixed(2), // 20% below average
      buyItNowPrice: (recommendedPrice * 1.1).toFixed(2) // 10% above recommended
    }
  }

  /**
   * Convert single part to eBay CSV row
   */
  convertPartToEbayRow(part, marketAnalysis, images = [], vehiclePhotos = []) {
    const pricing = this.generatePricing(marketAnalysis)
    const shippingCost = this.calculateShippingCost(part.category)
    
    // Combine part images with vehicle photos
    const allImages = [...images, ...vehiclePhotos]
    
    return {
      Action: 'Add',
      Title: this.generateTitle(part),
      Description: this.generateDescription(part),
      'Condition ID': this.conditionCodes['Used'],
      'Start Price': pricing.startPrice,
      'Buy It Now Price': pricing.buyItNowPrice,
      Quantity: '1',
      'Category ID': this.categoryMapping[part.category] || '6030',
      MPN: part.partNumber || '',
      Brand: part.brand || part.make,
      'Compatibility Year': part.year?.toString() || '',
      'Compatibility Make': part.make || '',
      'Compatibility Model': part.model || '',
      'Compatibility Trim': part.trimLevel || '',
      'Compatibility Engine': part.engineSize || '',
      'Item Specifics': this.generateItemSpecifics(part),
      'Shipping Service': 'USPS Priority Mail',
      'Shipping Cost': shippingCost.toFixed(2),
      'Handling Time': '1',
      'Return Policy': '30 Day Returns',
      'Image URL 1': allImages[0]?.url || '',
      'Image URL 2': allImages[1]?.url || '',
      'Image URL 3': allImages[2]?.url || '',
      'Image URL 4': allImages[3]?.url || '',
      'Image URL 5': allImages[4]?.url || '',
      'Image URL 6': allImages[5]?.url || '',
      'Image URL 7': allImages[6]?.url || '',
      'Image URL 8': allImages[7]?.url || '',
      'Image URL 9': allImages[8]?.url || '',
      'Image URL 10': allImages[9]?.url || '',
      'Image URL 11': allImages[10]?.url || '',
      'Image URL 12': allImages[11]?.url || ''
    }
  }

  /**
   * Convert parts inventory to eBay CSV format
   */
  convertInventoryToEbayCSV(partsInventory, marketAnalysisData, imagesData, vehiclePhotosData = []) {
    const csvRows = []
    
    // Add header row
    const headers = [
      'Action', 'Title', 'Description', 'Condition ID', 'Start Price', 'Buy It Now Price',
      'Quantity', 'Category ID', 'MPN', 'Brand', 'Compatibility Year', 'Compatibility Make',
      'Compatibility Model', 'Compatibility Trim', 'Compatibility Engine', 'Item Specifics',
      'Shipping Service', 'Shipping Cost', 'Handling Time', 'Return Policy',
      'Image URL 1', 'Image URL 2', 'Image URL 3', 'Image URL 4', 'Image URL 5', 'Image URL 6',
      'Image URL 7', 'Image URL 8', 'Image URL 9', 'Image URL 10', 'Image URL 11', 'Image URL 12'
    ]
    
    csvRows.push(headers.join(','))
    
    // Convert each part
    partsInventory.forEach(part => {
      const marketAnalysis = marketAnalysisData[part.partsMasterId] || {}
      const images = imagesData[part.partsMasterId] || []
      
      const ebayRow = this.convertPartToEbayRow(part, marketAnalysis, images, vehiclePhotosData)
      const rowValues = headers.map(header => {
        const value = ebayRow[header] || ''
        // Escape commas and quotes in CSV
        return `"${value.toString().replace(/"/g, '""')}"`
      })
      
      csvRows.push(rowValues.join(','))
    })
    
    return csvRows.join('\n')
  }

  /**
   * Validate eBay listing data
   */
  validateListing(ebayRow) {
    const errors = []
    
    if (!ebayRow.Title || ebayRow.Title.length > 80) {
      errors.push('Title must be 1-80 characters')
    }
    
    if (!ebayRow.Description || ebayRow.Description.length < 50) {
      errors.push('Description must be at least 50 characters')
    }
    
    if (parseFloat(ebayRow['Start Price']) >= parseFloat(ebayRow['Buy It Now Price'])) {
      errors.push('Start Price must be less than Buy It Now Price')
    }
    
    if (!ebayRow['Compatibility Year'] || !ebayRow['Compatibility Make'] || !ebayRow['Compatibility Model']) {
      errors.push('Must include Year, Make, and Model compatibility')
    }
    
    if (!ebayRow['Image URL 1']) {
      errors.push('At least one image is required')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate sample listings for testing
   */
  generateSampleListings() {
    const sampleParts = [
      {
        partName: 'Engine Oil Filter',
        make: 'Honda',
        model: 'Civic',
        year: 2005,
        trimLevel: 'EX',
        engineSize: '1.7L 4-Cylinder',
        category: 'Engine',
        subCategory: 'Filter',
        partNumber: '15400-PLC-004',
        brand: 'Honda'
      },
      {
        partName: 'Brake Pad Set',
        make: 'Honda',
        model: 'Civic',
        year: 2005,
        trimLevel: 'EX',
        engineSize: '1.7L 4-Cylinder',
        category: 'Brakes',
        subCategory: 'Front',
        partNumber: '45022-SNA-A01',
        brand: 'Honda'
      }
    ]
    
    const sampleMarketAnalysis = {
      averagePrice: 15.99,
      recommendedPrice: 19.99
    }
    
    return sampleParts.map(part => 
      this.convertPartToEbayRow(part, sampleMarketAnalysis, [])
    )
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EbayBulkUploadGenerator
}

// Example usage:
/*
const generator = new EbayBulkUploadGenerator()

// Convert single part
const part = {
  partName: 'Engine Oil Filter',
  make: 'Honda',
  model: 'Civic',
  year: 2005,
  trimLevel: 'EX',
  engineSize: '1.7L 4-Cylinder',
  category: 'Engine',
  partNumber: '15400-PLC-004',
  brand: 'Honda'
}

const marketAnalysis = {
  averagePrice: 15.99,
  recommendedPrice: 19.99
}

const ebayRow = generator.convertPartToEbayRow(part, marketAnalysis)
console.log(ebayRow)

// Validate the listing
const validation = generator.validateListing(ebayRow)
console.log(validation)
*/
