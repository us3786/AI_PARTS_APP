# 🔧 Google Images API Setup Guide

## 🎯 Why We Need This

- ✅ **Legal Compliance**: Avoid eBay image policy violations
- ✅ **High Quality**: Professional automotive part images
- ✅ **Usage Rights**: Only properly licensed content
- ✅ **Automatic Collection**: Images gathered during price research

## 📋 Step-by-Step Setup

### Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.developers.google.com/
   - Sign in with your Google account

2. **Create or Select Project**
   - Click "Select a project" → "New Project"
   - Name: "AI Parts Images" (or any name you prefer)
   - Click "Create"

3. **Enable Custom Search API**
   - Go to "APIs & Services" → "Library"
   - Search for "Custom Search API"
   - Click on it → "Enable"

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API Key (starts with "AIza...")
   - ⚠️ **Important**: Click "Restrict Key" → Select "Custom Search API"

### Step 2: Custom Search Engine Setup

1. **Go to Custom Search Engine**
   - Visit: https://cse.google.com/cse/
   - Sign in with the same Google account

2. **Create New Search Engine**
   - Click "Add" button
   - Enter any website (e.g., "google.com")
   - Click "Create"

3. **Configure Search Engine**
   - Go to "Setup" tab
   - Under "Sites to search", select "Search the entire web"
   - Go to "Advanced" tab
   - Copy the "Search engine ID" (starts with "017...")

### Step 3: Update Environment File

1. **Open .env.local file**
   - Located in: `ai-parts-app-nextjs/.env.local`

2. **Add Your Credentials**
   ```bash
   GOOGLE_CUSTOM_SEARCH_API_KEY="your_api_key_here"
   GOOGLE_CUSTOM_SEARCH_ENGINE_ID="your_search_engine_id_here"
   ```

3. **Save the file**

### Step 4: Test Configuration

Run the test script to verify everything works:

```bash
node test-google-images.js
```

## 🧪 Expected Test Results

If successful, you should see:
```
✅ Found 3 images:
   1. Ford Edge Headlight Assembly
      URL: https://example.com/image1.jpg
   2. 2008 Ford Edge Headlight
      URL: https://example.com/image2.jpg
   3. Automotive Headlight Part
      URL: https://example.com/image3.jpg
```

## 🚀 What Happens Next

Once configured:
- ✅ **Price Research** will automatically collect images
- ✅ **Real Images** from Google (not placeholders)
- ✅ **Legal Compliance** with proper usage rights
- ✅ **Better Quality** professional automotive photos

## 🔧 Troubleshooting

### "API Key not configured"
- Check that you added the API key to `.env.local`
- Restart the development server

### "No images found"
- Try a different search query
- Check that your Custom Search Engine is configured to search the entire web

### "Request failed"
- Verify your API key is correct
- Check that Custom Search API is enabled
- Ensure API key restrictions allow Custom Search API

## 💡 Pro Tips

1. **API Key Security**: Always restrict your API key to specific APIs
2. **Search Engine**: Configure to search the entire web for best results
3. **Usage Rights**: The system automatically filters for reusable images
4. **Testing**: Use the test script to verify before using in production

## 🎉 Success!

Once everything is working, your price research will automatically collect high-quality, legally compliant images from Google!
