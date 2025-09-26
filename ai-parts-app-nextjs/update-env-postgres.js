const fs = require('fs')
const path = require('path')

console.log('🔄 Updating .env.local for PostgreSQL...')

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
  console.log('📊 Database URL: postgresql://postgres:***@localhost:5433/ai_parts_app')
  console.log('🎉 Migration complete! Your app is now using PostgreSQL.')
} catch (error) {
  console.log('❌ Failed to update .env.local:', error.message)
}
