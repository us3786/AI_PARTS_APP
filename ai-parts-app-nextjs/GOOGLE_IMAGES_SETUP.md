# Google Images Setup Guide

## Why Google Images Instead of eBay Images?

✅ **Legal Compliance** - Avoids eBay's image policy violations
✅ **Usage Rights Filtering** - Only images labeled for reuse
✅ **Better Quality** - Professional automotive part images
✅ **No Copyright Issues** - Properly licensed content

## Setup Instructions

### 1. Google Custom Search API Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.developers.google.com/

2. **Create/Select Project**
   - Create new project or select existing one

3. **Enable Custom Search API**
   - Go to "APIs & Services" > "Library"
   - Search for "Custom Search API"
   - Click "Enable"

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API Key

### 2. Custom Search Engine Setup

1. **Go to Custom Search Engine**
   - Visit: https://cse.google.com/cse/

2. **Create New Search Engine**
   - Click "Add" button
   - Enter any website (e.g., "google.com")
   - Click "Create"

3. **Configure Search Engine**
   - Go to "Setup" tab
   - Under "Sites to search", select "Search the entire web"
   - Go to "Advanced" tab
   - Copy the "Search engine ID"

### 3. Environment Variables

Add these to your `.env.local` file:

```bash
# Google Custom Search API
GOOGLE_CUSTOM_SEARCH_API_KEY="your_api_key_here"
GOOGLE_CUSTOM_SEARCH_ENGINE_ID="your_search_engine_id_here"
```

### 4. Usage Rights Filtering

The system automatically filters for images with proper usage rights:
- `cc_publicdomain` - Public domain images
- `cc_attribute` - Images requiring attribution
- `cc_sharealike` - Images with share-alike license

## Benefits

🎯 **Legal Safety** - No eBay policy violations
🖼️ **Quality Images** - Professional automotive photos
⚡ **Fast Integration** - Works with existing price research
🔒 **Usage Rights** - Only properly licensed images
📊 **Better Results** - More relevant automotive part images

## Fallback Behavior

If Google Images API is not configured:
- System continues to work with pricing data
- No images are collected (graceful degradation)
- Logs show "Google Images API not configured"
- No errors or failures in the application
