/**
 * Comprehensive Shipping Cost Calculator
 * Calculates shipping costs based on part characteristics, weight, dimensions, and destination
 */

export interface ShippingDimensions {
  length: number // inches
  width: number // inches
  height: number // inches
  weight: number // pounds
}

export interface ShippingDestination {
  zipCode: string
  country: string
  state?: string
  city?: string
}

export interface ShippingOption {
  service: string
  cost: number
  estimatedDays: number
  carrier: 'USPS' | 'FedEx' | 'UPS'
  description: string
}

export interface PartShippingInfo {
  category: string
  subCategory?: string
  estimatedWeight: number
  estimatedDimensions: ShippingDimensions
  shippingClass: 'standard' | 'oversized' | 'fragile' | 'hazardous'
}

/**
 * Default part shipping profiles based on category
 */
const PART_SHIPPING_PROFILES: Record<string, PartShippingInfo> = {
  'Engine': {
    category: 'Engine',
    estimatedWeight: 350,
    estimatedDimensions: { length: 24, width: 18, height: 20, weight: 350 },
    shippingClass: 'oversized'
  },
  'Transmission': {
    category: 'Transmission',
    estimatedWeight: 150,
    estimatedDimensions: { length: 20, width: 16, height: 14, weight: 150 },
    shippingClass: 'oversized'
  },
  'Brake Rotor': {
    category: 'Brake',
    estimatedWeight: 25,
    estimatedDimensions: { length: 14, width: 14, height: 3, weight: 25 },
    shippingClass: 'standard'
  },
  'Brake Caliper': {
    category: 'Brake',
    estimatedWeight: 8,
    estimatedDimensions: { length: 8, width: 6, height: 4, weight: 8 },
    shippingClass: 'standard'
  },
  'Headlight': {
    category: 'Exterior',
    estimatedWeight: 3,
    estimatedDimensions: { length: 12, width: 8, height: 6, weight: 3 },
    shippingClass: 'fragile'
  },
  'Taillight': {
    category: 'Exterior',
    estimatedWeight: 2,
    estimatedDimensions: { length: 10, width: 6, height: 4, weight: 2 },
    shippingClass: 'fragile'
  },
  'Bumper': {
    category: 'Exterior',
    estimatedWeight: 45,
    estimatedDimensions: { length: 60, width: 8, height: 4, weight: 45 },
    shippingClass: 'oversized'
  },
  'Door': {
    category: 'Exterior',
    estimatedWeight: 65,
    estimatedDimensions: { length: 48, width: 36, height: 6, weight: 65 },
    shippingClass: 'oversized'
  },
  'Fender': {
    category: 'Exterior',
    estimatedWeight: 25,
    estimatedDimensions: { length: 36, width: 24, height: 3, weight: 25 },
    shippingClass: 'standard'
  },
  'Hood': {
    category: 'Exterior',
    estimatedWeight: 85,
    estimatedDimensions: { length: 54, width: 42, height: 4, weight: 85 },
    shippingClass: 'oversized'
  },
  'Mirror': {
    category: 'Exterior',
    estimatedWeight: 2,
    estimatedDimensions: { length: 8, width: 6, height: 4, weight: 2 },
    shippingClass: 'fragile'
  },
  'Wheel': {
    category: 'Wheels',
    estimatedWeight: 35,
    estimatedDimensions: { length: 18, width: 18, height: 8, weight: 35 },
    shippingClass: 'standard'
  },
  'Tire': {
    category: 'Wheels',
    estimatedWeight: 28,
    estimatedDimensions: { length: 25, width: 25, height: 8, weight: 28 },
    shippingClass: 'standard'
  },
  'Battery': {
    category: 'Electrical',
    estimatedWeight: 45,
    estimatedDimensions: { length: 10, width: 7, height: 8, weight: 45 },
    shippingClass: 'hazardous'
  },
  'Alternator': {
    category: 'Electrical',
    estimatedWeight: 12,
    estimatedDimensions: { length: 8, width: 6, height: 6, weight: 12 },
    shippingClass: 'standard'
  },
  'Starter': {
    category: 'Electrical',
    estimatedWeight: 8,
    estimatedDimensions: { length: 6, width: 5, height: 5, weight: 8 },
    shippingClass: 'standard'
  },
  'Radiator': {
    category: 'Cooling',
    estimatedWeight: 15,
    estimatedDimensions: { length: 24, width: 16, height: 2, weight: 15 },
    shippingClass: 'fragile'
  },
  'Water Pump': {
    category: 'Cooling',
    estimatedWeight: 4,
    estimatedDimensions: { length: 6, width: 6, height: 4, weight: 4 },
    shippingClass: 'standard'
  },
  'Oil Filter': {
    category: 'Engine',
    estimatedWeight: 1,
    estimatedDimensions: { length: 4, width: 4, height: 3, weight: 1 },
    shippingClass: 'standard'
  },
  'Air Filter': {
    category: 'Engine',
    estimatedWeight: 1,
    estimatedDimensions: { length: 8, width: 8, height: 2, weight: 1 },
    shippingClass: 'standard'
  },

  // Additional 182 Parts Shipping Profiles
  'Engine Mount - Left Front': {
    category: 'Engine',
    subCategory: 'Engine Mounts',
    estimatedWeight: 8,
    estimatedDimensions: { length: 8, width: 6, height: 4, weight: 8 },
    shippingClass: 'standard'
  },
  'Engine Mount - Right Front': {
    category: 'Engine',
    subCategory: 'Engine Mounts',
    estimatedWeight: 8,
    estimatedDimensions: { length: 8, width: 6, height: 4, weight: 8 },
    shippingClass: 'standard'
  },
  'Engine Mount - Left Rear': {
    category: 'Engine',
    subCategory: 'Engine Mounts',
    estimatedWeight: 6,
    estimatedDimensions: { length: 6, width: 5, height: 4, weight: 6 },
    shippingClass: 'standard'
  },
  'Engine Mount - Right Rear': {
    category: 'Engine',
    subCategory: 'Engine Mounts',
    estimatedWeight: 6,
    estimatedDimensions: { length: 6, width: 5, height: 4, weight: 6 },
    shippingClass: 'standard'
  },
  'Engine Mount - Transmission': {
    category: 'Engine',
    subCategory: 'Engine Mounts',
    estimatedWeight: 5,
    estimatedDimensions: { length: 6, width: 4, height: 3, weight: 5 },
    shippingClass: 'standard'
  },
  'Front Exhaust Manifold': {
    category: 'Engine',
    subCategory: 'Exhaust Manifold',
    estimatedWeight: 20,
    estimatedDimensions: { length: 20, width: 12, height: 8, weight: 20 },
    shippingClass: 'oversized'
  },
  'Rear Exhaust Manifold': {
    category: 'Engine',
    subCategory: 'Exhaust Manifold',
    estimatedWeight: 20,
    estimatedDimensions: { length: 20, width: 12, height: 8, weight: 20 },
    shippingClass: 'oversized'
  },
  'Wheel Hub Assembly/Spindle - Front Left': {
    category: 'Wheels',
    subCategory: 'Hub Assembly',
    estimatedWeight: 15,
    estimatedDimensions: { length: 8, width: 8, height: 4, weight: 15 },
    shippingClass: 'standard'
  },
  'Wheel Hub Assembly/Spindle - Front Right': {
    category: 'Wheels',
    subCategory: 'Hub Assembly',
    estimatedWeight: 15,
    estimatedDimensions: { length: 8, width: 8, height: 4, weight: 15 },
    shippingClass: 'standard'
  },
  'Wheel Hub Assembly/Spindle - Rear Left': {
    category: 'Wheels',
    subCategory: 'Hub Assembly',
    estimatedWeight: 12,
    estimatedDimensions: { length: 7, width: 7, height: 3, weight: 12 },
    shippingClass: 'standard'
  },
  'Wheel Hub Assembly/Spindle - Rear Right': {
    category: 'Wheels',
    subCategory: 'Hub Assembly',
    estimatedWeight: 12,
    estimatedDimensions: { length: 7, width: 7, height: 3, weight: 12 },
    shippingClass: 'standard'
  },
  'Upper Coolant Hose (Engine to Radiator)': {
    category: 'Cooling',
    subCategory: 'Coolant Hoses',
    estimatedWeight: 1,
    estimatedDimensions: { length: 12, width: 4, height: 4, weight: 1 },
    shippingClass: 'standard'
  },
  'Lower Coolant Hose (Radiator to Engine)': {
    category: 'Cooling',
    subCategory: 'Coolant Hoses',
    estimatedWeight: 1,
    estimatedDimensions: { length: 12, width: 4, height: 4, weight: 1 },
    shippingClass: 'standard'
  }
}

/**
 * Shipping rate tables by carrier and service
 */
const SHIPPING_RATES = {
  USPS: {
    'Priority Mail': {
      baseRate: 8.95,
      perPound: 0.35,
      oversizeFee: 15.00,
      fragileFee: 5.00,
      hazardousFee: 25.00
    },
    'Ground Advantage': {
      baseRate: 4.95,
      perPound: 0.25,
      oversizeFee: 10.00,
      fragileFee: 3.00,
      hazardousFee: 20.00
    }
  },
  FedEx: {
    'Ground': {
      baseRate: 12.95,
      perPound: 0.45,
      oversizeFee: 25.00,
      fragileFee: 8.00,
      hazardousFee: 35.00
    },
    'Home Delivery': {
      baseRate: 10.95,
      perPound: 0.40,
      oversizeFee: 20.00,
      fragileFee: 6.00,
      hazardousFee: 30.00
    }
  },
  UPS: {
    'Ground': {
      baseRate: 11.95,
      perPound: 0.42,
      oversizeFee: 22.00,
      fragileFee: 7.00,
      hazardousFee: 32.00
    },
    'SurePost': {
      baseRate: 7.95,
      perPound: 0.30,
      oversizeFee: 15.00,
      fragileFee: 4.00,
      hazardousFee: 25.00
    }
  }
}

/**
 * Calculate shipping cost for a part
 */
export function calculateShippingCost(
  partName: string,
  partCategory: string,
  destination: ShippingDestination,
  customDimensions?: Partial<ShippingDimensions>
): ShippingOption[] {
  // Get part shipping profile
  const profile = getPartShippingProfile(partName, partCategory, customDimensions)
  
  // Calculate dimensional weight
  const dimensionalWeight = calculateDimensionalWeight(profile.estimatedDimensions)
  const billableWeight = Math.max(profile.estimatedWeight, dimensionalWeight)
  
  // Generate shipping options
  const options: ShippingOption[] = []
  
  // USPS Options
  options.push(calculateUSPSRate(billableWeight, profile, destination))
  options.push(calculateFedExRate(billableWeight, profile, destination))
  options.push(calculateUPSRate(billableWeight, profile, destination))
  
  // Sort by cost
  return options.sort((a, b) => a.cost - b.cost)
}

/**
 * Get shipping profile for a part
 */
function getPartShippingProfile(
  partName: string,
  partCategory: string,
  customDimensions?: Partial<ShippingDimensions>
): PartShippingInfo {
  // Try exact match first
  let profile = PART_SHIPPING_PROFILES[partName] || PART_SHIPPING_PROFILES[partCategory]
  
  // If no exact match, use category-based defaults
  if (!profile) {
    profile = getDefaultProfileForCategory(partCategory)
  }
  
  // Apply custom dimensions if provided
  if (customDimensions) {
    profile.estimatedDimensions = {
      ...profile.estimatedDimensions,
      ...customDimensions
    }
    profile.estimatedWeight = customDimensions.weight || profile.estimatedWeight
  }
  
  return profile
}

/**
 * Get default profile for a category
 */
function getDefaultProfileForCategory(category: string): PartShippingInfo {
  const categoryDefaults: Record<string, PartShippingInfo> = {
    'Engine': {
      category,
      estimatedWeight: 200,
      estimatedDimensions: { length: 20, width: 16, height: 18, weight: 200 },
      shippingClass: 'oversized'
    },
    'Transmission': {
      category,
      estimatedWeight: 120,
      estimatedDimensions: { length: 18, width: 14, height: 12, weight: 120 },
      shippingClass: 'oversized'
    },
    'Exterior': {
      category,
      estimatedWeight: 15,
      estimatedDimensions: { length: 24, width: 16, height: 4, weight: 15 },
      shippingClass: 'standard'
    },
    'Interior': {
      category,
      estimatedWeight: 8,
      estimatedDimensions: { length: 16, width: 12, height: 6, weight: 8 },
      shippingClass: 'standard'
    },
    'Electrical': {
      category,
      estimatedWeight: 5,
      estimatedDimensions: { length: 8, width: 6, height: 4, weight: 5 },
      shippingClass: 'standard'
    },
    'Brake': {
      category,
      estimatedWeight: 12,
      estimatedDimensions: { length: 12, width: 10, height: 3, weight: 12 },
      shippingClass: 'standard'
    }
  }
  
  return categoryDefaults[category] || {
    category,
    estimatedWeight: 8,
    estimatedDimensions: { length: 12, width: 8, height: 4, weight: 8 },
    shippingClass: 'standard'
  }
}

/**
 * Calculate dimensional weight
 */
function calculateDimensionalWeight(dimensions: ShippingDimensions): number {
  // Dimensional weight formula: (L × W × H) ÷ 139
  return Math.ceil((dimensions.length * dimensions.width * dimensions.height) / 139)
}

/**
 * Calculate USPS shipping rate
 */
function calculateUSPSRate(
  weight: number,
  profile: PartShippingInfo,
  destination: ShippingDestination
): ShippingOption {
  const rates = SHIPPING_RATES.USPS['Priority Mail']
  let cost = rates.baseRate + (weight * rates.perPound)
  
  // Apply fees based on shipping class
  if (profile.shippingClass === 'oversized') {
    cost += rates.oversizeFee
  } else if (profile.shippingClass === 'fragile') {
    cost += rates.fragileFee
  } else if (profile.shippingClass === 'hazardous') {
    cost += rates.hazardousFee
  }
  
  // Add distance-based adjustments (simplified)
  const distanceMultiplier = getDistanceMultiplier(destination.zipCode)
  cost *= distanceMultiplier
  
  return {
    service: 'USPS Priority Mail',
    cost: Math.round(cost * 100) / 100,
    estimatedDays: 2,
    carrier: 'USPS',
    description: 'Fast and reliable delivery'
  }
}

/**
 * Calculate FedEx shipping rate
 */
function calculateFedExRate(
  weight: number,
  profile: PartShippingInfo,
  destination: ShippingDestination
): ShippingOption {
  const rates = SHIPPING_RATES.FedEx['Ground']
  let cost = rates.baseRate + (weight * rates.perPound)
  
  if (profile.shippingClass === 'oversized') {
    cost += rates.oversizeFee
  } else if (profile.shippingClass === 'fragile') {
    cost += rates.fragileFee
  } else if (profile.shippingClass === 'hazardous') {
    cost += rates.hazardousFee
  }
  
  const distanceMultiplier = getDistanceMultiplier(destination.zipCode)
  cost *= distanceMultiplier
  
  return {
    service: 'FedEx Ground',
    cost: Math.round(cost * 100) / 100,
    estimatedDays: 3,
    carrier: 'FedEx',
    description: 'Reliable ground shipping'
  }
}

/**
 * Calculate UPS shipping rate
 */
function calculateUPSRate(
  weight: number,
  profile: PartShippingInfo,
  destination: ShippingDestination
): ShippingOption {
  const rates = SHIPPING_RATES.UPS['Ground']
  let cost = rates.baseRate + (weight * rates.perPound)
  
  if (profile.shippingClass === 'oversized') {
    cost += rates.oversizeFee
  } else if (profile.shippingClass === 'fragile') {
    cost += rates.fragileFee
  } else if (profile.shippingClass === 'hazardous') {
    cost += rates.hazardousFee
  }
  
  const distanceMultiplier = getDistanceMultiplier(destination.zipCode)
  cost *= distanceMultiplier
  
  return {
    service: 'UPS Ground',
    cost: Math.round(cost * 100) / 100,
    estimatedDays: 3,
    carrier: 'UPS',
    description: 'Comprehensive ground shipping'
  }
}

/**
 * Get distance multiplier based on zip code (simplified)
 */
function getDistanceMultiplier(zipCode: string): number {
  // This is a simplified version - in production, you'd use a proper distance calculation
  const firstDigit = parseInt(zipCode[0])
  
  // West Coast (9, 8)
  if (firstDigit >= 8) return 1.1
  // Mountain (7, 6)
  if (firstDigit >= 6) return 1.05
  // Central (5, 4, 3)
  if (firstDigit >= 3) return 1.0
  // East Coast (2, 1, 0)
  return 0.95
}

/**
 * Get recommended shipping option for a part
 */
export function getRecommendedShippingOption(
  partName: string,
  partCategory: string,
  destination: ShippingDestination
): ShippingOption {
  const options = calculateShippingCost(partName, partCategory, destination)
  
  // Prefer USPS for smaller items, FedEx/UPS for larger items
  const profile = getPartShippingProfile(partName, partCategory)
  
  if (profile.estimatedWeight < 20) {
    // Prefer USPS for lighter items
    return options.find(opt => opt.carrier === 'USPS') || options[0]
  } else {
    // Prefer FedEx/UPS for heavier items
    return options.find(opt => opt.carrier === 'FedEx') || options.find(opt => opt.carrier === 'UPS') || options[0]
  }
}

/**
 * Calculate total cost including shipping for eBay listing
 */
export function calculateTotalListingCost(
  partPrice: number,
  partName: string,
  partCategory: string,
  destination: ShippingDestination,
  freeShippingThreshold: number = 100
): { itemPrice: number; shippingCost: number; totalCost: number; freeShipping: boolean } {
  const shippingOption = getRecommendedShippingOption(partName, partCategory, destination)
  const freeShipping = partPrice >= freeShippingThreshold
  
  const shippingCost = freeShipping ? 0 : shippingOption.cost
  const totalCost = partPrice + shippingCost
  
  return {
    itemPrice: partPrice,
    shippingCost,
    totalCost,
    freeShipping
  }
}
