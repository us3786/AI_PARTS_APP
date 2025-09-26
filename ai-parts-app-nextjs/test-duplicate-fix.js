const { PrismaClient } = require('@prisma/client');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testDuplicateFix() {
  try {
    console.log('🧪 Testing duplicate API call fix...');
    
    // Check current inventory count
    const inventoryCount = await prisma.partsInventory.count();
    console.log(`📊 Current inventory count: ${inventoryCount}`);
    
    // Check for any duplicates
    const duplicates = await prisma.partsInventory.groupBy({
      by: ['vehicleId', 'partsMasterId'],
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } }
    });
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found - fix is working!');
    } else {
      console.log(`❌ Found ${duplicates.length} duplicate groups`);
    }
    
    // Get vehicle count
    const vehicleCount = await prisma.vehicle.count();
    console.log(`🚗 Vehicle count: ${vehicleCount}`);
    
    // Expected ratio should be 1:1 (445 parts per vehicle)
    const expectedRatio = inventoryCount / vehicleCount;
    console.log(`📈 Parts per vehicle ratio: ${expectedRatio.toFixed(2)}`);
    
    if (expectedRatio === 445) {
      console.log('✅ Perfect ratio - no duplicates!');
    } else if (expectedRatio > 445) {
      console.log('⚠️ Ratio too high - duplicates may still exist');
    } else {
      console.log('✅ Ratio looks good');
    }
    
  } catch (error) {
    console.error('❌ Error testing fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDuplicateFix();
