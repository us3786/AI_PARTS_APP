#!/usr/bin/env node

/**
 * Google Images API Setup Script
 * This script helps you configure the Google Custom Search API for image collection
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Google Images API Setup');
console.log('========================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('📝 Creating .env.local file...');
  
  const envContent = `# Database
DATABASE_URL="file:./dev.db"

# Next.js
NEXT_PUBLIC_APP_BASE_URL="http://localhost:3000"

# eBay API (for pricing only, no images)
EBAY_CLIENT_ID="your_ebay_client_id"
EBAY_CLIENT_SECRET="your_ebay_client_secret"

# Google Custom Search API (for images with proper usage rights)
# Get these from Google Cloud Console and Custom Search Engine
GOOGLE_CUSTOM_SEARCH_API_KEY=""
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=""

# Instructions:
# 1. Go to https://console.developers.google.com/
# 2. Create a new project or select existing
# 3. Enable "Custom Search API"
# 4. Create credentials (API Key)
# 5. Go to https://cse.google.com/cse/
# 6. Create a new Custom Search Engine
# 7. Configure it to search the entire web
# 8. Get the Search Engine ID from the setup page
# 9. Add both API Key and Search Engine ID above
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
} else {
  console.log('✅ .env.local file already exists');
}

console.log('\n📋 Next Steps:');
console.log('==============');
console.log('1. 🌐 Go to Google Cloud Console: https://console.developers.google.com/');
console.log('2. 📁 Create a new project or select existing one');
console.log('3. 🔌 Enable "Custom Search API"');
console.log('4. 🔑 Create credentials (API Key)');
console.log('5. 🔍 Go to Custom Search Engine: https://cse.google.com/cse/');
console.log('6. ➕ Create a new Custom Search Engine');
console.log('7. ⚙️  Configure it to search the entire web');
console.log('8. 📋 Get the Search Engine ID from the setup page');
console.log('9. ✏️  Edit .env.local and add your API Key and Engine ID');
console.log('10. 🧪 Run: node test-google-images.js');

console.log('\n💡 Benefits:');
console.log('============');
console.log('✅ Legal compliance - no eBay image policy violations');
console.log('✅ High-quality automotive images');
console.log('✅ Proper usage rights filtering');
console.log('✅ Automatic image collection during price research');

console.log('\n🚀 After setup, images will be automatically collected during price research!');
