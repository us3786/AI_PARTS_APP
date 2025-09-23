# 🏗️ AI Parts Application - Project Architecture & Logic Flow

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Detailed Project Structure](#detailed-project-structure)
3. [Data Flow Architecture](#data-flow-architecture)
4. [API Architecture](#api-architecture)
5. [Component Architecture](#component-architecture)
6. [Database Architecture](#database-architecture)
7. [Authentication Flow](#authentication-flow)
8. [Business Logic Flow](#business-logic-flow)
9. [Integration Points](#integration-points)

---

## 🎯 System Overview

The AI Parts Application is a comprehensive automotive parts management system that transforms the traditional Flask application into a modern Next.js architecture. The system follows a **4-phase workflow**:

```
VIN Input → Vehicle Decode → Parts Population → Price Research → eBay Listing
```

### Core Architecture Principles
- **Server-Side Rendering (SSR)** with Next.js App Router
- **Type-Safe** with TypeScript throughout
- **Database-First** with Prisma ORM
- **Component-Based** React architecture
- **API-First** design with RESTful endpoints

---

## 📁 Detailed Project Structure

```
ai-parts-app-nextjs/
├── 📁 src/                                    # Source Code
│   ├── 📁 app/                               # Next.js App Router
│   │   ├── 📁 api/                           # API Routes (Backend)
│   │   │   ├── 📁 analytics/                 # Analytics endpoints
│   │   │   │   └── route.ts                  # GET /api/analytics
│   │   │   ├── 📁 decode-vin/                # VIN Decoding
│   │   │   │   └── route.ts                  # POST /api/decode-vin
│   │   │   ├── 📁 ebay/                      # eBay Integration
│   │   │   │   ├── 📁 callback/              # OAuth callback
│   │   │   │   │   └── route.ts              # GET /api/ebay/callback
│   │   │   │   ├── 📁 listings/              # Listing management
│   │   │   │   │   ├── 📁 bulk/              # Bulk operations
│   │   │   │   │   │   └── route.ts          # POST /api/ebay/listings/bulk
│   │   │   │   │   ├── 📁 create/            # Create listing
│   │   │   │   │   │   └── route.ts          # POST /api/ebay/listings/create
│   │   │   │   │   └── 📁 performance/       # Performance tracking
│   │   │   │   │       └── route.ts          # GET /api/ebay/listings/performance
│   │   │   │   ├── 📁 oauth/                 # OAuth initiation
│   │   │   │   │   └── route.ts              # GET /api/ebay/oauth
│   │   │   │   ├── 📁 refresh/               # Token refresh
│   │   │   │   │   └── route.ts              # POST /api/ebay/refresh
│   │   │   │   ├── 📁 search/                # Item search
│   │   │   │   │   └── route.ts              # GET /api/ebay/search
│   │   │   │   └── 📁 status/                # Connection status
│   │   │   │       └── route.ts              # GET /api/ebay/status
│   │   │   ├── 📁 export/                    # Data export
│   │   │   │   └── route.ts                  # GET /api/export
│   │   │   ├── 📁 get-vehicle-part-suggestions/ # AI part suggestions
│   │   │   │   └── route.ts                  # POST /api/get-vehicle-part-suggestions
│   │   │   ├── 📁 image-hunting/             # Image collection
│   │   │   │   └── route.ts                  # POST /api/image-hunting
│   │   │   ├── 📁 parts/                     # Parts management
│   │   │   │   ├── 📁 bulk-operations/       # Bulk operations
│   │   │   │   │   └── route.ts              # POST /api/parts/bulk-operations
│   │   │   │   ├── 📁 fetch-prices/          # Price fetching
│   │   │   │   │   └── route.ts              # POST /api/parts/fetch-prices
│   │   │   │   └── 📁 populate-inventory/    # Inventory population
│   │   │   │       └── route.ts              # POST /api/parts/populate-inventory
│   │   │   ├── 📁 price-research/            # Price research
│   │   │   │   ├── 📁 auto-update/           # Automated updates
│   │   │   │   │   └── route.ts              # POST /api/price-research/auto-update
│   │   │   │   ├── 📁 bulk/                  # Bulk research
│   │   │   │   │   └── route.ts              # POST /api/price-research/bulk
│   │   │   │   └── route.ts                  # POST /api/price-research
│   │   │   └── 📁 settings/                  # Settings management
│   │   │       └── route.ts                  # GET/POST /api/settings
│   │   └── page.tsx                          # Main dashboard page
│   ├── 📁 components/                        # React Components
│   │   ├── 📁 dashboard/                     # Dashboard Components
│   │   │   ├── AnalyticsDashboard.tsx        # Analytics overview
│   │   │   ├── BulkListingDashboard.tsx      # Bulk listing management
│   │   │   ├── EnhancedPartsDashboard.tsx    # Enhanced parts management
│   │   │   ├── ListingPerformanceDashboard.tsx # Performance tracking
│   │   │   ├── PartsDashboard.tsx            # Basic parts display
│   │   │   └── PriceResearchDashboard.tsx    # Price research interface
│   │   ├── 📁 forms/                         # Form Components
│   │   │   ├── EbayConnection.tsx            # eBay OAuth connection
│   │   │   ├── ImageUploader.tsx             # Image upload interface
│   │   │   ├── PartsFilter.tsx               # Parts filtering
│   │   │   └── VINDecoder.tsx                # VIN input form
│   │   └── 📁 ui/                            # Reusable UI Components
│   │       ├── badge.tsx                     # Badge component
│   │       ├── button.tsx                    # Button component
│   │       ├── card.tsx                      # Card component
│   │       ├── dialog.tsx                    # Modal dialog
│   │       ├── input.tsx                     # Input component
│   │       ├── progress.tsx                  # Progress bar
│   │       ├── select.tsx                    # Select dropdown
│   │       └── table.tsx                     # Table components
│   ├── 📁 lib/                               # Utility Libraries
│   │   ├── api.ts                            # API utility functions
│   │   ├── prisma.ts                         # Database client
│   │   └── utils.ts                          # General utilities
│   └── 📁 types/                             # TypeScript Definitions
│       └── index.ts                          # All type definitions
├── 📁 prisma/                                # Database Layer
│   ├── schema.prisma                         # Database schema
│   ├── seed.ts                               # Database seeding script
│   ├── complete-parts-master-data.ts         # 290+ parts master data
│   └── dev.db                                # SQLite database file
├── 📁 public/                                # Static Assets
├── 📁 scripts/                               # Build & Utility Scripts
├── 📁 .env                                   # Environment Variables
├── 📄 package.json                           # Dependencies & Scripts
├── 📄 README.md                              # Basic documentation
├── 📄 requirements.txt                       # Project requirements
└── 📄 .gitignore                             # Git ignore rules
```

---

## 🔄 Data Flow Architecture

### 1. **VIN Decoding Flow**
```
User Input VIN → VINDecoder.tsx → /api/decode-vin → NHTSA API → Database → UI Update
```

### 2. **Parts Population Flow**
```
Vehicle Data → /api/get-vehicle-part-suggestions → PartsMaster Query → PartsInventory Creation → UI Population
```

### 3. **Price Research Flow**
```
Parts Selection → /api/price-research → Multi-Source APIs → Price Data Storage → UI Update
```

### 4. **eBay Listing Flow**
```
Parts Selection → eBay OAuth → Listing Creation → Bulk Operations → Performance Tracking
```

---

## 🌐 API Architecture

### **RESTful API Design Pattern**
All APIs follow REST conventions with proper HTTP methods:

| Endpoint | Method | Purpose | Input | Output |
|----------|--------|---------|-------|--------|
| `/api/decode-vin` | POST | VIN decoding | `{vin: string}` | `{success: boolean, vehicle: Vehicle}` |
| `/api/get-vehicle-part-suggestions` | POST | AI part suggestions | `{make, model, year, vin}` | `{success: boolean, categories: PartCategory[]}` |
| `/api/parts/populate-inventory` | POST | Populate inventory | `{vehicleId: string}` | `{success: boolean, inventory: PartsInventory[]}` |
| `/api/price-research` | POST | Single part research | `{partsMasterId: string}` | `{success: boolean, research: PriceResearch[]}` |
| `/api/price-research/bulk` | POST | Bulk price research | `{partsMasterIds: string[]}` | `{success: boolean, results: BulkPriceResearch}` |
| `/api/ebay/oauth` | GET | Initiate OAuth | None | Redirect to eBay |
| `/api/ebay/callback` | GET | OAuth callback | Query params | Token storage |
| `/api/ebay/listings/bulk` | POST | Bulk listing | `{selectedParts: string[], template: ListingTemplate}` | `{success: boolean, operationId: string}` |
| `/api/analytics` | GET | Analytics data | Query params | `{metrics: AnalyticsMetrics}` |
| `/api/export` | GET | Data export | `{format: 'csv'|'pdf'|'json', vehicleId: string}` | File download |

---

## 🧩 Component Architecture

### **Component Hierarchy**
```
App (page.tsx)
├── VINDecoder
├── EbayConnection
├── EnhancedPartsDashboard
│   ├── PartsFilter
│   ├── PartsTable
│   └── BulkOperations
├── PriceResearchDashboard
│   ├── ResearchControls
│   ├── PriceComparison
│   └── MarketAnalysis
├── BulkListingDashboard
│   ├── ListingTemplate
│   ├── BulkOperations
│   └── ProgressTracker
├── ListingPerformanceDashboard
│   ├── PerformanceMetrics
│   ├── SalesCharts
│   └── ListingStatus
└── AnalyticsDashboard
    ├── KeyMetrics
    ├── Charts
    └── Reports
```

### **Component Responsibilities**

| Component | Responsibility | Props | State |
|-----------|---------------|-------|-------|
| `VINDecoder` | VIN input & decode | `onVehicleDecoded?: (vehicle: Vehicle) => void` | `vin, vehicle, error, loading` |
| `EnhancedPartsDashboard` | Parts management | `vehicleId: string` | `parts, filteredParts, selectedParts` |
| `PriceResearchDashboard` | Price research | `vehicleId: string` | `researchResults, loading, filters` |
| `BulkListingDashboard` | Bulk operations | `vehicleId: string` | `selectedParts, template, progress` |
| `EbayConnection` | eBay OAuth | None | `connectionStatus, loading` |

---

## 🗄️ Database Architecture

### **Entity Relationship Diagram**
```
Vehicle (1) ──── (M) PartsInventory (M) ──── (1) PartsMaster
    │                    │
    │                    │
    └─── (M) Report      └─── (M) PriceResearch
                              │
                              └─── (M) EbayListing (M) ──── (1) BulkOperation

Setting (Singleton)
EbayToken (Singleton)
```

### **Table Definitions**

#### **Vehicle**
```sql
- id: String (Primary Key)
- vin: String (Unique)
- make: String
- model: String
- year: Int
- engine: String?
- transmission: String?
- driveType: String?
- fuelType: String?
- bodyClass: String?
- createdAt: DateTime
- updatedAt: DateTime
```

#### **PartsMaster** (290+ Parts Catalog)
```sql
- id: String (Primary Key)
- partName: String
- category: String
- subCategory: String?
- oemPartNumber: String?
- aftermarketNumbers: Json?
- vehicleSpecific: Boolean
- fitmentData: Json?
- estimatedValue: Float?
- resaleValue: Float?
- marketDemand: String?
- weight: Float?
- dimensions: Json?
- specifications: Json?
- images: Json?
- notes: String?
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

#### **PartsInventory** (Actual Parts)
```sql
- id: String (Primary Key)
- vehicleId: String (Foreign Key)
- partsMasterId: String (Foreign Key)
- condition: String
- location: String?
- acquiredDate: DateTime?
- acquiredPrice: Float?
- currentValue: Float?
- status: String
- notes: String?
- customImages: Json?
- createdAt: DateTime
- updatedAt: DateTime
```

#### **PriceResearch**
```sql
- id: String (Primary Key)
- partsMasterId: String (Foreign Key)
- source: String
- price: Float
- currency: String
- url: String?
- images: Json?
- marketTrend: Json?
- competitorAnalysis: Json?
- researchDate: DateTime
- isActive: Boolean
```

#### **EbayListing**
```sql
- id: String (Primary Key)
- partsInventoryId: String? (Foreign Key)
- partsMasterId: String (Foreign Key)
- ebayItemId: String?
- title: String
- description: String?
- categoryId: String?
- price: Float
- currency: String
- images: Json?
- status: String
- listingDate: DateTime?
- endDate: DateTime?
- bulkOperationId: String? (Foreign Key)
- performanceData: Json?
- createdAt: DateTime
- updatedAt: DateTime
```

#### **BulkOperation**
```sql
- id: String (Primary Key)
- operationName: String
- selectedParts: Json
- listingTemplate: Json?
- pricingStrategy: Json?
- schedulingOptions: Json?
- status: String
- progress: Int
- totalParts: Int
- processedParts: Int
- successfulListings: Int
- failedListings: Int
- createdAt: DateTime
- updatedAt: DateTime
```

---

## 🔐 Authentication Flow

### **eBay OAuth 2.0 Flow**
```
1. User clicks "Connect to eBay" → EbayConnection.tsx
2. Redirect to /api/ebay/oauth → generateEbayAuthUrl()
3. User authorizes on eBay → eBay redirects to /api/ebay/callback
4. Exchange code for tokens → exchangeCodeForTokens()
5. Store tokens in database → EbayToken table
6. Update connection status → UI reflects connected state
```

### **Token Management**
- **Access Token**: Short-lived (2 hours), used for API calls
- **Refresh Token**: Long-lived, used to get new access tokens
- **Automatic Refresh**: Handled by `/api/ebay/refresh` endpoint

---

## 🧠 Business Logic Flow

### **Phase 1: VIN Decoding & Vehicle Setup**
```typescript
1. User enters VIN → VINDecoder component
2. Validate VIN format → Client-side validation
3. Call NHTSA API → /api/decode-vin
4. Parse vehicle data → Extract make, model, year, etc.
5. Store in database → Vehicle table
6. Trigger parts population → Automatic AI suggestions
```

### **Phase 2: Parts Population & Management**
```typescript
1. Vehicle data available → Trigger /api/get-vehicle-part-suggestions
2. Query PartsMaster → Get all 290+ parts
3. Create PartsInventory → One entry per part per vehicle
4. Categorize parts → Group by category/subcategory
5. Display in UI → EnhancedPartsDashboard
6. Enable filtering → PartsFilter component
```

### **Phase 3: Price Research & Market Analysis**
```typescript
1. User selects parts → Parts selection in UI
2. Initiate research → /api/price-research/bulk
3. Query multiple sources → eBay, AutoZone, RockAuto, LKQ
4. Store results → PriceResearch table
5. Analyze trends → Market analysis algorithms
6. Update part values → Automatic price updates
```

### **Phase 4: eBay Listing & Bulk Operations**
```typescript
1. Parts selected & priced → Ready for listing
2. eBay OAuth connected → Token validation
3. Create listing template → Professional formatting
4. Bulk listing creation → /api/ebay/listings/bulk
5. Track progress → Real-time updates
6. Monitor performance → Analytics dashboard
```

---

## 🔗 Integration Points

### **External APIs**

#### **NHTSA API**
- **Endpoint**: `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}`
- **Purpose**: VIN decoding
- **Rate Limit**: No official limit
- **Data Format**: JSON array of variable-value pairs

#### **eBay API**
- **Authentication**: OAuth 2.0
- **Endpoints**: 
  - Browse API: Item search
  - Sell Inventory API: Listing management
  - Marketing API: Promotional tools
- **Rate Limits**: Varies by endpoint
- **Data Format**: JSON

#### **Price Research Sources**
- **eBay**: Public search API
- **AutoZone**: Web scraping (if available)
- **RockAuto**: Web scraping (if available)
- **LKQ**: Web scraping (if available)

### **Internal Data Flow**
```
External APIs → API Routes → Database → React Components → UI Updates
```

---

## 🚀 Performance Considerations

### **Database Optimization**
- **Indexes**: VIN (unique), partsMasterId, vehicleId
- **Queries**: Optimized with Prisma includes
- **Caching**: React Query for API responses

### **API Optimization**
- **Rate Limiting**: Implemented for external APIs
- **Batch Operations**: Bulk price research and listing
- **Error Handling**: Comprehensive error boundaries

### **Frontend Optimization**
- **Lazy Loading**: Component-level code splitting
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For large parts lists

---

## 🔧 Development Workflow

### **Local Development**
```bash
npm run dev          # Start development server
npm run db:push      # Sync database schema
npm run db:seed      # Seed with parts data
npm run lint         # Code quality checks
```

### **Database Management**
```bash
npm run db:studio    # Prisma Studio (GUI)
npm run db:reset     # Reset and reseed
```

### **Production Deployment**
```bash
npm run build        # Production build
npm run start        # Production server
```

---

## 📊 Monitoring & Analytics

### **Application Metrics**
- VIN decoding success rate
- Parts population accuracy
- Price research coverage
- eBay listing success rate
- User engagement metrics

### **Performance Metrics**
- API response times
- Database query performance
- Frontend render times
- Error rates and types

### **Business Metrics**
- Parts processed per session
- Average listing prices
- Conversion rates
- Revenue tracking

---

This architecture provides a solid foundation for a scalable, maintainable automotive parts management system with comprehensive eBay integration and professional-grade features.
