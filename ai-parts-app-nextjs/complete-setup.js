#!/usr/bin/env node

/**
 * Complete Google Images API Setup
 * This script completes the setup with the Search Engine ID
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Completing Google Images API Setup');
console.log('====================================\n');

const envPath = path.join(__dirname, '.env.local');
const searchEngineId = '87b6dcad6c80c46c3';

// Read existing .env.local
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  console.log('❌ .env.local file not found. Please run update-env.js first.');
  process.exit(1);
}

// Update the Search Engine ID
if (envContent.includes('GOOGLE_CUSTOM_SEARCH_ENGINE_ID=""')) {
  envContent = envContent.replace(
    'GOOGLE_CUSTOM_SEARCH_ENGINE_ID=""',
    `GOOGLE_CUSTOM_SEARCH_ENGINE_ID="${searchEngineId}"`
  );
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated Search Engine ID in .env.local');
} else {
  console.log('✅ Search Engine ID already configured');
}

console.log('\n🎉 Google Images API Setup Complete!');
console.log('===================================');
console.log('✅ API Key: AIzaSyCKF3MYbUX7i40Xh-zlQmmVeosVt7Rcx5c');
console.log('✅ Search Engine ID: 87b6dcad6c80c46c3');
console.log('✅ Environment file updated');

console.log('\n🧪 Testing Configuration...');
console.log('===========================');

// Set environment variables for testing
process.env.GOOGLE_CUSTOM_SEARCH_API_KEY = 'AIzaSyCKF3MYbUX7i40Xh-zlQmmVeosVt7Rcx5c';
process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID = searchEngineId;

// Test the Google Images API
async function testGoogleImages() {
  try {
    const partName = "Ford Edge Headlight"
    const vehicleQuery = "2008 FORD Edge"
    const searchQuery = `${vehicleQuery} ${partName} automotive part`
    
    console.log('🔍 Testing with query:', searchQuery);
    
    const url = `https://www.googleapis.com/customsearch/v1?` + new URLSearchParams({
      key: process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
      cx: process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
      q: searchQuery,
      searchType: 'image',
      num: '3',
      rights: 'cc_publicdomain,cc_attribute,cc_sharealike',
      safe: 'medium',
      imgSize: 'medium',
      imgType: 'photo'
    })
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.log('❌ Google Images API request failed:', response.status, response.statusText);
      return false;
    }
    
    const data = await response.json()
    
    if (!data.items || data.items.length === 0) {
      console.log('⚠️ No images found for query:', searchQuery);
      return false;
    }
    
    console.log('✅ Found', data.items.length, 'images:');
    data.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title}`);
      console.log(`      URL: ${item.link}`);
    })
    
    return true;
    
  } catch (error) {
    console.error('❌ Google Images API test failed:', error.message);
    return false;
  }
}

// Run the test
testGoogleImages().then(success => {
  if (success) {
    console.log('\n🚀 Setup Complete!');
    console.log('==================');
    console.log('✅ Google Images API is working');
    console.log('✅ Images will be automatically collected during price research');
    console.log('✅ High-quality, legally compliant automotive images');
    console.log('✅ No more placeholder images');
    
    console.log('\n💡 Next Steps:');
    console.log('- Start the development server: npm run dev');
    console.log('- Test price research - images will be collected automatically');
    console.log('- Enjoy high-quality automotive part images!');
  } else {
    console.log('\n⚠️ Setup completed but test failed');
    console.log('The configuration is saved, but there might be an issue with the API');
    console.log('You can still use the system - images will be collected when the API works');
  }
});
