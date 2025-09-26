#!/usr/bin/env node

/**
 * Test PostgreSQL Connection and Migrate Data
 */

const { PrismaClient } = require('@prisma/client')

// Set the PostgreSQL URL directly for testing
process.env.DATABASE_URL = "postgresql://postgres:Faizi786@localhost:5433/ai_parts_app"

const prisma = new PrismaClient()

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...')
  console.log('📊 Database URL:', process.env.DATABASE_URL)
  
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ PostgreSQL connection successful!')
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('✅ Database version:', result[0].version)
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    
    console.log(`✅ Found ${tables.length} tables in database`)
    
    if (tables.length > 0) {
      console.log('📋 Existing tables:')
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`)
      })
    } else {
      console.log('📝 No tables found - ready for schema push')
    }
    
  } catch (error) {
    console.log('❌ PostgreSQL connection failed:', error.message)
    console.log('💡 Make sure:')
    console.log('   1. PostgreSQL is running on port 5433')
    console.log('   2. Database "ai_parts_app" exists')
    console.log('   3. User "postgres" has access with password "Faizi786"')
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
