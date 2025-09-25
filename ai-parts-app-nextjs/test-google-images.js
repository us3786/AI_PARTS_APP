// Test Google Images API configuration
const testGoogleImages = async () => {
  const partName = "Ford Edge Headlight"
  const vehicleQuery = "2008 FORD Edge"
  
  const searchQuery = `${vehicleQuery} ${partName} automotive part`
  
  console.log('🔍 Testing Google Images API with query:', searchQuery)
  
  // Check if environment variables are set
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const engineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
  
  console.log('📋 API Key configured:', !!apiKey)
  console.log('📋 Engine ID configured:', !!engineId)
  
  if (!apiKey || !engineId) {
    console.log('❌ Google Images API not configured')
    console.log('📝 Please set up Google Custom Search API:')
    console.log('   1. Get API key from Google Cloud Console')
    console.log('   2. Create Custom Search Engine at cse.google.com')
    console.log('   3. Add both to your .env.local file')
    return
  }
  
  try {
    const url = `https://www.googleapis.com/customsearch/v1?` + new URLSearchParams({
      key: apiKey,
      cx: engineId,
      q: searchQuery,
      searchType: 'image',
      num: '3',
      rights: 'cc_publicdomain,cc_attribute,cc_sharealike',
      safe: 'medium',
      imgSize: 'medium',
      imgType: 'photo'
    })
    
    console.log('🌐 Making request to Google Images API...')
    const response = await fetch(url)
    
    if (!response.ok) {
      console.log('❌ Google Images API request failed:', response.status, response.statusText)
      return
    }
    
    const data = await response.json()
    
    if (!data.items || data.items.length === 0) {
      console.log('⚠️ No images found for query:', searchQuery)
      return
    }
    
    console.log('✅ Found', data.items.length, 'images:')
    data.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title}`)
      console.log(`      URL: ${item.link}`)
    })
    
  } catch (error) {
    console.error('❌ Google Images API test failed:', error.message)
  }
}

// Run the test
testGoogleImages()
