// Vehicle Types
export interface Vehicle {
  id: string
  vin: string
  make: string
  model: string
  year: number
  trimLevel?: string
  engine?: string
  engineSize?: string
  engineType?: string
  transmission?: string
  transmissionType?: string
  driveType?: string
  fuelType?: string
  bodyClass?: string
  bodyStyle?: string
  doors?: number
  cylinders?: number
  displacement?: number
  horsepower?: number
  torque?: number
  specifications?: any
  vehicleImages?: any
  createdAt: Date
  updatedAt: Date
}

// Part Types
export interface Part {
  id: string
  partNumber: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
  price?: number
  imageUrl?: string
  ebayListingId?: string
  ebayUrl?: string
  vehicleId: string
  createdAt: Date
  updatedAt: Date
}

// Report Types
export interface Report {
  id: string
  title: string
  description?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  vehicleId: string
  totalParts: number
  processedParts: number
  createdAt: Date
  updatedAt: Date
}

// API Response Types
export interface VINDecodeResponse {
  success: boolean
  vin: string
  make?: string
  model?: string
  year?: string
  submodel?: string
  trimLevel?: string
  engineSize?: string
  details?: any
  message?: string
}

export interface EbayTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  refresh_token?: string
  timestamp?: number
}

export interface EbaySearchResponse {
  findItemsAdvancedResponse: Array<{
    searchResult: Array<{
      item: Array<{
        itemId: string[]
        title: string[]
        globalId: string[]
        primaryCategory: Array<{
          categoryId: string[]
          categoryName: string[]
        }>
        galleryURL?: string[]
        viewItemURL: string[]
        location: string[]
        country: string[]
        shippingInfo: Array<{
          shippingServiceCost: Array<{
            '@currencyId': string[]
            __value__: string[]
          }>
        }>
        sellingStatus: Array<{
          currentPrice: Array<{
            '@currencyId': string[]
            __value__: string[]
          }>
        }>
      }>
    }>
  }>
}

// Component Props Types
export interface VINDecoderProps {
  onVehicleDecoded?: (vehicle: Vehicle) => void
  className?: string
}

export interface PartsDashboardProps {
  vehicleId: string
  className?: string
}

export interface PartsFilterProps {
  parts: Part[]
  onFilteredParts: (parts: Part[]) => void
  className?: string
}

// Settings Types
export interface AppSettings {
  app_scheme: string
  app_hostname: string
  app_port: string
  ebay_redirect_uri_path: string
}

// Form Types
export interface VINFormData {
  vin: string
}

export interface SettingsFormData {
  app_scheme: string
  app_hostname: string
  app_port: string
  ebay_redirect_uri_path: string
}

// Enhanced Parts Master Types
export interface PartsMaster {
  id: string
  partName: string
  category: string
  subCategory?: string
  oemPartNumber?: string
  aftermarketNumbers?: any
  vehicleSpecific: boolean
  fitmentData?: any
  estimatedValue?: number
  resaleValue?: number
  marketDemand?: string
  weight?: number
  dimensions?: any
  specifications?: any
  images?: any
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PartsInventory {
  id: string
  vehicleId: string
  partsMasterId: string
  condition: string
  location?: string
  acquiredDate?: Date
  acquiredPrice?: number
  currentValue?: number
  status: string
  notes?: string
  customImages?: any
  createdAt: Date
  updatedAt: Date
}

export interface PriceResearch {
  id: string
  partsMasterId: string
  source: string
  price: number
  currency: string
  url?: string
  images?: any
  marketTrend?: any
  competitorAnalysis?: any
  researchDate: Date
  isActive: boolean
}

export interface EbayListing {
  id: string
  partsInventoryId?: string
  partsMasterId: string
  ebayItemId?: string
  title: string
  description?: string
  categoryId?: string
  price: number
  currency: string
  images?: any
  status: string
  listingDate?: Date
  endDate?: Date
  bulkOperationId?: string
  performanceData?: any
  createdAt: Date
  updatedAt: Date
}

export interface BulkOperation {
  id: string
  operationName: string
  selectedParts: any
  listingTemplate?: any
  pricingStrategy?: any
  schedulingOptions?: any
  status: string
  progress: number
  totalParts: number
  processedParts: number
  successfulListings: number
  failedListings: number
  createdAt: Date
  updatedAt: Date
}
