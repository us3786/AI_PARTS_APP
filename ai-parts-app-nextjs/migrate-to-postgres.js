#!/usr/bin/env node

/**
 * Migration Script: SQLite to PostgreSQL
 * This script helps migrate your data from SQLite to PostgreSQL
 */

const fs = require('fs')
const path = require('path')

console.log('🔄 PostgreSQL Migration Setup')
console.log('=' .repeat(40))

// Update .env.local file
const envLocalPath = path.join(__dirname, '.env.local')
const envContent = `# Database - PostgreSQL
DATABASE_URL="postgresql://postgres:Faizi786@localhost:5433/ai_parts_app"

# Google Custom Search API (for images with proper usage rights)
GOOGLE_CUSTOM_SEARCH_API_KEY="AIzaSyCKF3MYbUX7i40Xh-zlQmmVeosVt7Rcx5c"
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=""

# Next.js Configuration
NEXT_PUBLIC_APP_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`

try {
  fs.writeFileSync(envLocalPath, envContent)
  console.log('✅ Updated .env.local with PostgreSQL configuration')
} catch (error) {
  console.log('❌ Failed to update .env.local:', error.message)
  console.log('📝 Please manually update .env.local with:')
  console.log(envContent)
}

// Check if .env file exists and might be overriding
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  console.log('⚠️  Found .env file - this might override .env.local')
  console.log('📝 Consider removing or updating .env file')
}

console.log('\n📋 Next Steps:')
console.log('1. ✅ PostgreSQL database URL configured')
console.log('2. 🔄 Run: npx prisma db push')
console.log('3. 📊 Run: npx prisma db seed')
console.log('4. 🚀 Start: npm run dev')

console.log('\n💡 Make sure PostgreSQL is running on port 5433')
console.log('💡 Database "ai_parts_app" should exist')

console.log('\n🎉 Migration setup complete!')
