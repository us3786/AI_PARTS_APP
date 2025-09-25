#!/usr/bin/env node

/**
 * PostgreSQL Setup Script
 * Simple setup for both office and home PostgreSQL databases
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('🔍 Checking PostgreSQL database...')
  
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    
    console.log(`✅ Found ${tables.length} tables in database`)
    
    // Check if PartsMaster has data
    try {
      const partsCount = await prisma.partsMaster.count()
      console.log(`✅ PartsMaster: ${partsCount} records`)
      
      if (partsCount === 0) {
        console.log('⚠️  PartsMaster is empty - run: npx prisma db seed')
      }
    } catch (error) {
      console.log('❌ PartsMaster table missing - run: npx prisma db push')
    }
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message)
    console.log('💡 Make sure PostgreSQL is running and DATABASE_URL is correct')
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  console.log('🚀 PostgreSQL Setup Check')
  console.log('=' .repeat(40))
  
  await checkDatabase()
  
  console.log('\n📝 Setup Commands:')
  console.log('1. npx prisma db push    # Create/update tables')
  console.log('2. npx prisma db seed    # Add sample data')
  console.log('3. npm run dev           # Start development')
  
  console.log('\n🎉 Setup check complete!')
}

main().catch(console.error)
