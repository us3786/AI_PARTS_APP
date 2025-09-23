# 🔄 AI Parts Application - System Logic Flow

## 🎯 Overview
This document outlines the complete logic flow of the AI Parts Application, from VIN input to eBay listing completion.

---

## 📊 System Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   USER INPUT    │    │   VIN DECODING   │    │ PARTS POPULATION│
│                 │    │                  │    │                 │
│ • VIN Number    │───▶│ • NHTSA API      │───▶│ • 290+ Parts    │
│ • Manual Entry  │    │ • Vehicle Data   │    │ • Categories    │
└─────────────────┘    │ • Database Save  │    │ • Specifications│
                       └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  PRICE RESEARCH │    │   IMAGE HUNTING  │    │ PARTS MANAGEMENT│
│                 │    │                  │    │                 │
│ • Multi-Source  │◀───│ • AI Collection  │◀───│ • Filtering     │
│ • Market Analysis│    │ • Ranking        │    │ • Editing       │
│ • Competitor Data│    │ • Storage        │    │ • Bulk Ops      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   EBAY OAUTH    │    │  BULK LISTING    │    │   ANALYTICS     │
│                 │    │                  │    │                 │
│ • Authentication│───▶│ • Template       │───▶│ • Performance   │
│ • Token Mgmt    │    │ • Creation       │    │ • Metrics       │
│ • API Access    │    │ • Progress Track │    │ • Reports       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🔄 Detailed Logic Flows

### 1. **VIN Decoding Flow**

```typescript
// Step-by-step logic flow
VIN_INPUT → VALIDATION → API_CALL → PARSE_RESPONSE → DATABASE_SAVE → UI_UPDATE

// Detailed breakdown:
1. User enters VIN in VINDecoder.tsx
2. Client-side validation (17 characters, alphanumeric)
3. POST to /api/decode-vin with {vin: string}
4. Call NHTSA API: https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}
5. Parse response array into key-value object
6. Extract: make, model, year, engine, transmission, etc.
7. Upsert to Vehicle table (create or update)
8. Return vehicle object to frontend
9. Update VINDecoder state with vehicle data
10. Trigger automatic parts population
```

### 2. **Parts Population Flow**

```typescript
// AI-powered parts suggestion flow
VEHICLE_DATA → PARTS_QUERY → INVENTORY_CREATION → CATEGORIZATION → UI_DISPLAY

// Detailed breakdown:
1. Vehicle data available from VIN decode
2. POST to /api/get-vehicle-part-suggestions
3. Query PartsMaster table (290+ parts, isActive: true)
4. Create PartsInventory entries for each part
5. Set default values: condition='good', status='available'
6. Calculate currentValue from resaleValue or estimatedValue
7. Group parts by category for response
8. Return categorized parts to frontend
9. Display in EnhancedPartsDashboard
10. Enable filtering and bulk operations
```

### 3. **Price Research Flow**

```typescript
// Multi-source price research flow
PARTS_SELECTION → RESEARCH_INITIATION → MULTI_SOURCE_QUERY → DATA_STORAGE → UI_UPDATE

// Detailed breakdown:
1. User selects parts for research
2. POST to /api/price-research/bulk
3. For each part, query multiple sources:
   - eBay: Search API for similar items
   - AutoZone: Web scraping (if available)
   - RockAuto: Web scraping (if available)
   - LKQ: Web scraping (if available)
4. Store results in PriceResearch table
5. Calculate market trends and competitor analysis
6. Update part values based on research
7. Return comprehensive price data
8. Display in PriceResearchDashboard
9. Show price comparisons and market trends
```

### 4. **eBay OAuth Flow**

```typescript
// eBay authentication and token management
OAUTH_INITIATION → USER_AUTHORIZATION → TOKEN_EXCHANGE → STORAGE → API_ACCESS

// Detailed breakdown:
1. User clicks "Connect to eBay" in EbayConnection.tsx
2. GET /api/ebay/oauth
3. Generate eBay OAuth URL with:
   - Client ID
   - Redirect URI (ngrok URL)
   - Scopes (sell.inventory, sell.account, etc.)
4. Redirect user to eBay authorization page
5. User authorizes application
6. eBay redirects to /api/ebay/callback with code
7. Exchange authorization code for access/refresh tokens
8. Store tokens in EbayToken table
9. Update connection status in UI
10. Enable eBay listing features
```

### 5. **Bulk Listing Flow**

```typescript
// Bulk eBay listing creation flow
PARTS_SELECTION → TEMPLATE_CREATION → LISTING_GENERATION → EBAY_UPLOAD → TRACKING

// Detailed breakdown:
1. User selects parts for bulk listing
2. Configure listing template:
   - Title format: "{Year} {Make} {Model} {PartName}"
   - Description template with specifications
   - Category mapping from parts to eBay categories
   - Pricing strategy (market price, markup, etc.)
3. POST to /api/ebay/listings/bulk
4. Create BulkOperation record
5. For each selected part:
   - Generate optimized listing title
   - Create detailed description
   - Upload images (if available)
   - Set category and pricing
   - Create listing via eBay API
6. Track progress and results
7. Store EbayListing records
8. Update BulkOperation progress
9. Display real-time progress in UI
10. Show success/failure statistics
```

---

## 🧠 Business Logic Rules

### **Parts Categorization Logic**
```typescript
// Priority assignment based on category
const getPriorityFromCategory = (category: string): 'high' | 'medium' | 'low' => {
  const highPriority = ['Brake System', 'Engine', 'Transmission', 'Electrical System']
  const mediumPriority = ['Suspension & Steering', 'Fuel System', 'Exhaust System']
  
  if (highPriority.includes(category)) return 'high'
  if (mediumPriority.includes(category)) return 'medium'
  return 'low'
}
```

### **Pricing Logic**
```typescript
// Price calculation hierarchy
const calculatePartValue = (part: PartsMaster): number => {
  // Priority: resaleValue > estimatedValue > default
  return part.resaleValue || part.estimatedValue || 0
}

// Market price adjustment
const adjustForMarket = (basePrice: number, marketTrend: any): number => {
  const adjustment = marketTrend?.priceChange || 0
  return basePrice * (1 + adjustment / 100)
}
```

### **Listing Title Generation**
```typescript
// Smart title generation
const generateListingTitle = (part: PartsInventory, vehicle: Vehicle): string => {
  const { partName, condition } = part
  const { make, model, year } = vehicle
  
  // Format: "2018 Ford F-150 Front Brake Rotor - Used Good Condition"
  return `${year} ${make} ${model} ${partName} - ${condition.charAt(0).toUpperCase() + condition.slice(1)} Condition`
}
```

### **Image Selection Logic**
```typescript
// Image ranking and selection
const selectBestImages = (images: string[]): string[] => {
  return images
    .filter(img => isValidImage(img))           // Valid format
    .filter(img => !isLowQuality(img))          // Quality check
    .sort((a, b) => getImageScore(b) - getImageScore(a))  // Rank by score
    .slice(0, 12)                               // eBay limit
}
```

---

## 🔄 State Management Flow

### **Frontend State Flow**
```typescript
// Component state hierarchy
App State (page.tsx)
├── vehicle: Vehicle | null
├── ebayConnected: boolean
└── Dashboard States:
    ├── PartsDashboard
    │   ├── parts: Part[]
    │   ├── filteredParts: Part[]
    │   ├── selectedParts: string[]
    │   └── filters: FilterState
    ├── PriceResearchDashboard
    │   ├── researchResults: PriceResearch[]
    │   ├── loading: boolean
    │   └── marketTrends: MarketTrend[]
    ├── BulkListingDashboard
    │   ├── selectedParts: string[]
    │   ├── template: ListingTemplate
    │   ├── progress: number
    │   └── operationId: string | null
    └── AnalyticsDashboard
        ├── metrics: AnalyticsMetrics
        ├── charts: ChartData[]
        └── reports: Report[]
```

### **API State Flow**
```typescript
// API call patterns
const apiFlow = {
  // VIN Decoding
  decodeVIN: async (vin: string) => {
    const response = await fetch('/api/decode-vin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vin })
    })
    return response.json()
  },
  
  // Parts Population
  populateParts: async (vehicleId: string) => {
    const response = await fetch(`/api/parts/populate-inventory?vehicleId=${vehicleId}`)
    return response.json()
  },
  
  // Price Research
  researchPrices: async (partsMasterIds: string[]) => {
    const response = await fetch('/api/price-research/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partsMasterIds })
    })
    return response.json()
  },
  
  // eBay OAuth
  connectEbay: async () => {
    window.location.href = '/api/ebay/oauth'
  },
  
  // Bulk Listing
  createBulkListings: async (data: BulkListingData) => {
    const response = await fetch('/api/ebay/listings/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}
```

---

## 🚨 Error Handling Flow

### **Error Handling Hierarchy**
```typescript
// Error handling at different levels
1. Client-Side Validation
   - VIN format validation
   - Required field validation
   - Input sanitization

2. API Route Validation
   - Request body validation
   - Authentication checks
   - Rate limiting

3. External API Error Handling
   - NHTSA API failures
   - eBay API errors
   - Network timeouts

4. Database Error Handling
   - Connection failures
   - Constraint violations
   - Transaction rollbacks

5. UI Error Display
   - User-friendly error messages
   - Retry mechanisms
   - Fallback states
```

### **Error Recovery Strategies**
```typescript
// Automatic retry logic
const retryableOperations = {
  apiCall: async (fn: Function, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        if (i === maxRetries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  },
  
  tokenRefresh: async (refreshToken: string) => {
    const response = await fetch('/api/ebay/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })
    return response.json()
  }
}
```

---

## 📊 Performance Optimization Flow

### **Database Optimization**
```typescript
// Query optimization strategies
const optimizedQueries = {
  // Use includes for related data
  getVehicleWithParts: () => prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      partsInventory: {
        include: { partsMaster: true }
      }
    }
  }),
  
  // Batch operations
  createBulkInventory: (entries: PartsInventory[]) => 
    prisma.partsInventory.createMany({ data: entries }),
  
  // Pagination for large datasets
  getPartsPaginated: (page: number, limit: number) => 
    prisma.partsInventory.findMany({
      skip: page * limit,
      take: limit,
      include: { partsMaster: true }
    })
}
```

### **Frontend Optimization**
```typescript
// React optimization patterns
const optimizedComponents = {
  // Memoized expensive calculations
  const expensiveValue = useMemo(() => 
    calculateComplexValue(parts), [parts]
  ),
  
  // Lazy loading for heavy components
  const HeavyComponent = lazy(() => import('./HeavyComponent')),
  
  // Virtual scrolling for large lists
  const VirtualizedList = ({ items }) => (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      itemData={items}
    >
      {PartItem}
    </FixedSizeList>
  )
}
```

---

## 🔧 Configuration Management Flow

### **Environment Configuration**
```typescript
// Environment variable hierarchy
const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db'
  },
  
  // APIs
  apis: {
    nhtsa: process.env.NEXT_PUBLIC_NHTSA_API_BASE_URL,
    ebay: {
      clientId: process.env.EBAY_CLIENT_ID,
      clientSecret: process.env.EBAY_CLIENT_SECRET,
      redirectUri: process.env.EBAY_REDIRECT_URI,
      scopes: process.env.EBAY_SCOPES?.split(' ')
    }
  },
  
  // Application
  app: {
    baseUrl: process.env.NEXT_PUBLIC_APP_BASE_URL,
    environment: process.env.NODE_ENV
  }
}
```

### **Dynamic Configuration Updates**
```typescript
// Runtime configuration updates
const updateConfiguration = async (newConfig: Partial<Config>) => {
  // Update database settings
  await prisma.setting.upsert({
    where: { key: 'app_config' },
    update: { value: JSON.stringify(newConfig) },
    create: { key: 'app_config', value: JSON.stringify(newConfig) }
  })
  
  // Reload configuration
  await reloadConfig()
}
```

---

This comprehensive logic flow documentation provides a complete understanding of how the AI Parts Application processes data, handles user interactions, and manages the entire workflow from VIN input to eBay listing completion.
