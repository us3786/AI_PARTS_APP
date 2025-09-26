# Database Seeding Issues and Solutions

This document outlines all the database seeding issues we encountered and their solutions for setting up the AI Parts App database.

## 🚨 **Issue #1: Environment Variable Not Found**

### **Problem:**
```
❌ Error during seeding: PrismaClientInitializationError:
Invalid `prisma.partsMaster.deleteMany()` invocation
error: Environment variable not found: DATABASE_URL.
```

### **Root Cause:**
- The `tsx` command doesn't automatically load `.env.local` files
- The seed script couldn't find the `DATABASE_URL` environment variable

### **Solution:**
1. **Add dotenv import to seed script:**
```typescript
// In prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { PARTS_MASTER_DATA } from './complete-parts-master-data'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()
```

2. **Ensure .env.local exists with correct DATABASE_URL:**
```bash
# Database - PostgreSQL
DATABASE_URL="postgresql://postgres:YourPassword@localhost:5433/ai_parts_app"
```

### **Commands to Fix:**
```bash
# Check if .env.local exists
dir .env.local

# If missing, create it with correct DATABASE_URL
echo 'DATABASE_URL="postgresql://postgres:YourPassword@localhost:5433/ai_parts_app"' > .env.local
```

---

## 🚨 **Issue #2: Foreign Key Constraint Violations**

### **Problem:**
```
❌ Error during seeding: PrismaClientKnownRequestError:
Foreign key constraint violated on the constraint: `price_research_partsMasterId_fkey`
```

### **Root Cause:**
- Trying to delete `PartsMaster` records while dependent tables still reference them
- `PriceResearch`, `EbayListing`, and `PartsInventory` tables reference `PartsMaster`

### **Solution:**
**Clear dependent tables FIRST, then master tables:**

```typescript
// In prisma/seed.ts - CORRECT ORDER
async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data in dependency order to avoid foreign key constraints
  console.log('🧹 Clearing existing data...')
  
  // Clear dependent tables first
  await prisma.ebayListing.deleteMany({})
  await prisma.priceResearch.deleteMany({})
  await prisma.partsInventory.deleteMany({})
  
  // Clear parts master data last
  console.log('🧹 Clearing existing parts master data...')
  await prisma.partsMaster.deleteMany({})

  // Then seed the data...
}
```

### **Commands to Fix:**
```bash
# Run the corrected seed script
npm run db:seed
```

---

## 🚨 **Issue #3: Duplicate Parts in Inventory (890 instead of 445)**

### **Problem:**
- Database shows 890 parts instead of 445
- 890 = 2 × 445 (exact duplication)
- Bulk listing shows "No images found" for all parts

### **Root Cause:**
- **15 different components** calling the same `populate-inventory` API simultaneously
- No guard to prevent duplicate API calls
- Each component creates its own inventory entries

### **Solution:**
**Added global API guard to prevent duplicate calls:**

```typescript
// In src/app/api/parts/populate-inventory/route.ts
// Global guard to prevent duplicate API calls
const activeRequests = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const { vehicleId, selectedCategories } = await request.json()
    
    // Check if this vehicle is already being processed
    const requestKey = `populate-${vehicleId}`
    if (activeRequests.has(requestKey)) {
      console.log(`⏳ Vehicle ${vehicleId} is already being populated, skipping duplicate request`)
      return NextResponse.json({
        success: false,
        message: 'Vehicle is already being populated',
        isDuplicate: true
      }, { status: 409 })
    }

    // Mark this vehicle as being processed
    activeRequests.add(requestKey)
    
    // ... rest of the function ...
    
  } finally {
    // Always remove the request from active requests
    const requestKey = `populate-${vehicleId}`
    activeRequests.delete(requestKey)
    console.log(`✅ Completed population for vehicle ${vehicleId}`)
  }
}
```

### **Commands to Clean Up Duplicates:**
```bash
# 1. Check for duplicates
node -e "const { PrismaClient } = require('@prisma/client'); const { config } = require('dotenv'); config({ path: '.env.local' }); const prisma = new PrismaClient(); async function check() { const duplicates = await prisma.partsInventory.groupBy({ by: ['vehicleId', 'partsMasterId'], _count: { id: true }, having: { id: { _count: { gt: 1 } } } }); console.log('Duplicate groups found:', duplicates.length); prisma.$disconnect(); } check();"

# 2. Clean up duplicates (keep only first occurrence)
node -e "const { PrismaClient } = require('@prisma/client'); const { config } = require('dotenv'); config({ path: '.env.local' }); const prisma = new PrismaClient(); async function cleanup() { console.log('🧹 Starting duplicate cleanup...'); const duplicates = await prisma.partsInventory.groupBy({ by: ['vehicleId', 'partsMasterId'], having: { id: { _count: { gt: 1 } } } }); console.log('Found', duplicates.length, 'duplicate groups'); let deletedCount = 0; for(const dup of duplicates) { const items = await prisma.partsInventory.findMany({ where: { vehicleId: dup.vehicleId, partsMasterId: dup.partsMasterId }, orderBy: { createdAt: 'asc' } }); if(items.length > 1) { const toDelete = items.slice(1).map(item => item.id); await prisma.partsInventory.deleteMany({ where: { id: { in: toDelete } } }); deletedCount += toDelete.length; } } console.log('✅ Deleted', deletedCount, 'duplicate entries'); const finalCount = await prisma.partsInventory.count(); console.log('📊 Final inventory count:', finalCount); prisma.$disconnect(); } cleanup();"
```

---

## 🚨 **Issue #4: Wrong Parts Count (445 instead of 472)**

### **Problem:**
- Expected 472 parts but only got 445
- The `COMPLETE_472_PARTS_MASTER_DATA.ts` file had the same content as the original

### **Root Cause:**
- The 472 parts file wasn't properly created
- Only 445 parts were actually in the master data

### **Solution:**
**Verify and update the parts master data:**

```bash
# Check current parts count in master data
node -e "const data = require('./prisma/complete-parts-master-data.ts'); console.log('Parts count:', data.PARTS_MASTER_DATA.length);"

# Check if 472 parts file exists
node -e "const data = require('./COMPLETE_472_PARTS_MASTER_DATA.ts'); console.log('Complete 472 parts count:', data.PARTS_MASTER_DATA.length);"

# If needed, copy the 472 parts file to replace the master data
copy COMPLETE_472_PARTS_MASTER_DATA.ts prisma\complete-parts-master-data.ts

# Re-seed with correct parts count
npm run db:seed
```

---

## 🚨 **Issue #5: PostgreSQL Connection Issues**

### **Problem:**
```
❌ Error: the URL must start with the protocol `postgresql://` or `postgres://`
```

### **Root Cause:**
- Incorrect `DATABASE_URL` format
- Missing or malformed PostgreSQL connection string

### **Solution:**
**Correct DATABASE_URL format:**

```bash
# CORRECT format
DATABASE_URL="postgresql://postgres:YourPassword@localhost:5433/ai_parts_app"

# WRONG formats to avoid:
DATABASE_URL="file:./dev.db"                    # SQLite format
DATABASE_URL="postgres://..."                   # Missing 'ql'
DATABASE_URL="postgresql://user@localhost:5432/db"  # Missing password
```

### **Commands to Fix:**
```bash
# Test PostgreSQL connection
node -e "const { PrismaClient } = require('@prisma/client'); const { config } = require('dotenv'); config({ path: '.env.local' }); const prisma = new PrismaClient(); async function test() { try { await prisma.$connect(); console.log('✅ PostgreSQL connection successful!'); const count = await prisma.partsMaster.count(); console.log('📊 Parts count:', count); } catch (error) { console.error('❌ Connection failed:', error.message); } finally { await prisma.$disconnect(); } } test();"
```

---

## 🚨 **Issue #6: Fast Refresh Rebuilding Loop**

### **Problem:**
- Continuous "Fast Refresh rebuilding" messages
- App keeps rebuilding without user input
- Performance issues and browser hanging

### **Root Cause:**
- Multiple components triggering API calls simultaneously
- Circular dependencies between components
- No debouncing or rate limiting

### **Solution:**
**Added proper guards and debouncing:**

```typescript
// In components, add guards to prevent multiple calls
const [isLoading, setIsLoading] = useState(false)

const fetchData = async () => {
  if (isLoading) {
    console.log('⏳ Already loading, skipping duplicate call')
    return
  }
  
  setIsLoading(true)
  try {
    // API call here
  } finally {
    setIsLoading(false)
  }
}
```

---

## 📋 **Complete Setup Checklist for Home Computer**

### **1. Environment Setup:**
```bash
# 1. Create .env.local with correct DATABASE_URL
echo 'DATABASE_URL="postgresql://postgres:YourPassword@localhost:5433/ai_parts_app"' > .env.local

# 2. Add other required environment variables
echo 'NEXT_PUBLIC_APP_BASE_URL="http://localhost:3000"' >> .env.local
echo 'NEXT_PUBLIC_APP_URL="http://localhost:3000"' >> .env.local
```

### **2. Database Setup:**
```bash
# 1. Install dependencies
npm install

# 2. Push schema to database
npx prisma db push

# 3. Seed the database
npm run db:seed

# 4. Verify seeding
node -e "const { PrismaClient } = require('@prisma/client'); const { config } = require('dotenv'); config({ path: '.env.local' }); const prisma = new PrismaClient(); prisma.partsMaster.count().then(count => { console.log('Parts Master:', count); prisma.$disconnect(); });"
```

### **3. Test the Application:**
```bash
# 1. Start development server
npm run dev

# 2. Test VIN decoding
# 3. Check parts count (should be 445, not 890)
# 4. Verify no duplicate API calls in console
```

### **4. Troubleshooting Commands:**
```bash
# Check for duplicates
node -e "const { PrismaClient } = require('@prisma/client'); const { config } = require('dotenv'); config({ path: '.env.local' }); const prisma = new PrismaClient(); async function check() { const duplicates = await prisma.partsInventory.groupBy({ by: ['vehicleId', 'partsMasterId'], _count: { id: true }, having: { id: { _count: { gt: 1 } } } }); console.log('Duplicate groups:', duplicates.length); prisma.$disconnect(); } check();"

# Clean duplicates if found
node -e "const { PrismaClient } = require('@prisma/client'); const { config } = require('dotenv'); config({ path: '.env.local' }); const prisma = new PrismaClient(); async function cleanup() { const duplicates = await prisma.partsInventory.groupBy({ by: ['vehicleId', 'partsMasterId'], having: { id: { _count: { gt: 1 } } } }); let deletedCount = 0; for(const dup of duplicates) { const items = await prisma.partsInventory.findMany({ where: { vehicleId: dup.vehicleId, partsMasterId: dup.partsMasterId }, orderBy: { createdAt: 'asc' } }); if(items.length > 1) { const toDelete = items.slice(1).map(item => item.id); await prisma.partsInventory.deleteMany({ where: { id: { in: toDelete } } }); deletedCount += toDelete.length; } } console.log('Deleted', deletedCount, 'duplicates'); prisma.$disconnect(); } cleanup();"
```

---

## ✅ **Success Indicators:**

- ✅ **Database seeding completes without errors**
- ✅ **Parts Master count: 445**
- ✅ **No duplicate groups in Parts Inventory**
- ✅ **Parts per vehicle ratio: 1.0 (445:1)**
- ✅ **Console shows "Parts population already in progress, skipping..." instead of duplicates**
- ✅ **Images load properly in bulk listing**
- ✅ **No continuous Fast Refresh rebuilding**

---

## 🆘 **Emergency Reset Commands:**

If everything goes wrong, use these commands to completely reset:

```bash
# 1. Clear all data
npx prisma db push --force-reset

# 2. Re-seed
npm run db:seed

# 3. Verify
node test-duplicate-fix.js
```

This should give you a clean setup on your home computer!
