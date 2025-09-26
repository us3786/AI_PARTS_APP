const { PrismaClient } = require('@prisma/client');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testSeed() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('📊 DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const count = await prisma.partsMaster.count();
    console.log(`📊 Current parts master count: ${count}`);
    
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSeed();
