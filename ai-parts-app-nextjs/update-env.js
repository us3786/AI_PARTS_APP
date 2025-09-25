#!/usr/bin/env node

/**
 * Environment File Update Script
 * This script helps you update your .env.local file with Google API credentials
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Environment File Update');
console.log('=========================\n');

const envPath = path.join(__dirname, '.env.local');

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  
  const envContent = `# Database
DATABASE_URL="file:./dev.db"

# Next.js
NEXT_PUBLIC_APP_BASE_URL="http://localhost:3000"

# eBay API (for pricing only, no images)
EBAY_CLIENT_ID="your_ebay_client_id"
EBAY_CLIENT_SECRET="your_ebay_client_secret"

# Google Custom Search API (for images with proper usage rights)
GOOGLE_CUSTOM_SEARCH_API_KEY="AIzaSyCKF3MYbUX7i40Xh-zlQmmVeosVt7Rcx5c"
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=""

# Next step: Get your Search Engine ID from https://cse.google.com/cse/
# 1. Go to https://cse.google.com/cse/
# 2. Create a new Custom Search Engine
# 3. Configure it to search the entire web
# 4. Copy the Search Engine ID and replace the empty string above
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local with your API key');
} else {
  console.log('✅ .env.local file already exists');
  
  // Read and update existing file
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update API key if it's empty
  if (envContent.includes('GOOGLE_CUSTOM_SEARCH_API_KEY=""')) {
    envContent = envContent.replace(
      'GOOGLE_CUSTOM_SEARCH_API_KEY=""',
      'GOOGLE_CUSTOM_SEARCH_API_KEY="AIzaSyCKF3MYbUX7i40Xh-zlQmmVeosVt7Rcx5c"'
    );
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated API key in .env.local');
  } else {
    console.log('✅ API key already configured');
  }
}

console.log('\n📋 Next Steps:');
console.log('==============');
console.log('1. 🌐 Go to: https://cse.google.com/cse/');
console.log('2. ➕ Create a new Custom Search Engine');
console.log('3. ⚙️  Configure it to search the entire web');
console.log('4. 📋 Copy the Search Engine ID (starts with "017...")');
console.log('5. ✏️  Edit .env.local and replace the empty GOOGLE_CUSTOM_SEARCH_ENGINE_ID');
console.log('6. 🧪 Test with: node test-google-images.js');

console.log('\n💡 Your API Key is already configured!');
console.log('   Just need the Search Engine ID to complete the setup.');
