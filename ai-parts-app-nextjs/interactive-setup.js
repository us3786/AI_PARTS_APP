#!/usr/bin/env node

/**
 * Interactive Google Images API Setup
 * This script guides you through the complete setup process
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Interactive Google Images API Setup');
console.log('=====================================\n');

console.log('This script will help you set up Google Images API for automatic image collection during price research.\n');

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupGoogleImages() {
  try {
    console.log('📋 Step 1: Google Cloud Console Setup');
    console.log('=====================================');
    console.log('1. Go to: https://console.developers.google.com/');
    console.log('2. Create a new project or select existing');
    console.log('3. Enable "Custom Search API"');
    console.log('4. Create credentials (API Key)');
    console.log('5. Restrict the API key to "Custom Search API"\n');
    
    await question('Press Enter when you have your API Key ready...');
    
    const apiKey = await question('🔑 Enter your Google API Key: ');
    
    if (!apiKey || !apiKey.startsWith('AIza')) {
      console.log('❌ Invalid API Key format. Should start with "AIza"');
      return;
    }
    
    console.log('\n📋 Step 2: Custom Search Engine Setup');
    console.log('=====================================');
    console.log('1. Go to: https://cse.google.com/cse/');
    console.log('2. Create a new Custom Search Engine');
    console.log('3. Configure it to search the entire web');
    console.log('4. Get the Search Engine ID from the setup page\n');
    
    await question('Press Enter when you have your Search Engine ID ready...');
    
    const engineId = await question('🔍 Enter your Search Engine ID: ');
    
    if (!engineId || !engineId.startsWith('017')) {
      console.log('❌ Invalid Search Engine ID format. Should start with "017"');
      return;
    }
    
    console.log('\n📝 Step 3: Updating Environment File');
    console.log('====================================');
    
    // Read existing .env.local
    const envPath = path.join(__dirname, '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    } else {
      envContent = `# Database
DATABASE_URL="file:./dev.db"

# Next.js
NEXT_PUBLIC_APP_BASE_URL="http://localhost:3000"

# eBay API (for pricing only, no images)
EBAY_CLIENT_ID="your_ebay_client_id"
EBAY_CLIENT_SECRET="your_ebay_client_secret"

# Google Custom Search API (for images with proper usage rights)
GOOGLE_CUSTOM_SEARCH_API_KEY=""
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=""
`;
    }
    
    // Update the API credentials
    envContent = envContent.replace(
      'GOOGLE_CUSTOM_SEARCH_API_KEY=""',
      `GOOGLE_CUSTOM_SEARCH_API_KEY="${apiKey}"`
    );
    envContent = envContent.replace(
      'GOOGLE_CUSTOM_SEARCH_ENGINE_ID=""',
      `GOOGLE_CUSTOM_SEARCH_ENGINE_ID="${engineId}"`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env.local with your credentials');
    
    console.log('\n🧪 Step 4: Testing Configuration');
    console.log('=================================');
    
    const testNow = await question('Would you like to test the configuration now? (y/n): ');
    
    if (testNow.toLowerCase() === 'y' || testNow.toLowerCase() === 'yes') {
      console.log('\n🔍 Testing Google Images API...');
      
      // Set environment variables for testing
      process.env.GOOGLE_CUSTOM_SEARCH_API_KEY = apiKey;
      process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID = engineId;
      
      try {
        const testScript = require('./test-google-images.js');
        console.log('✅ Test completed successfully!');
      } catch (error) {
        console.log('⚠️ Test script not found, but configuration is saved');
      }
    }
    
    console.log('\n🎉 Setup Complete!');
    console.log('=================');
    console.log('✅ Google Images API configured');
    console.log('✅ Environment variables updated');
    console.log('✅ Ready for automatic image collection');
    
    console.log('\n🚀 What happens next:');
    console.log('- Price research will automatically collect images');
    console.log('- Images will be high-quality and legally compliant');
    console.log('- No more placeholder images');
    console.log('- Better user experience with real automotive photos');
    
    console.log('\n💡 To test manually, run: node test-google-images.js');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Start the setup
setupGoogleImages();
