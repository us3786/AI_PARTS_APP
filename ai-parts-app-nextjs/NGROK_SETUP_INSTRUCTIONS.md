# 🚀 ngrok Setup Instructions for eBay OAuth

## Quick Fix (Recommended)

### Option 1: Manual ngrok Setup

1. **Download ngrok:**
   - Go to: https://ngrok.com/download
   - Download the Windows version
   - Extract to a folder (e.g., `C:\ngrok\`)

2. **Sign up for ngrok:**
   - Go to: https://ngrok.com/signup
   - Create a free account
   - Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

3. **Configure ngrok:**
   ```powershell
   C:\ngrok\ngrok.exe config add-authtoken YOUR_AUTHTOKEN_HERE
   ```

4. **Start ngrok tunnel:**
   ```powershell
   C:\ngrok\ngrok.exe http 3000
   ```

5. **Copy the HTTPS URL:**
   - Look for: `https://abc123.ngrok-free.app` (forwarding -> https://localhost:3000)
   - Copy this URL

6. **Update .env file:**
   ```bash
   EBAY_REDIRECT_URI=https://your-url-here.ngrok-free.app/api/ebay/callback
   ```

7. **Restart your app:**
   ```bash
   npm run dev
   ```

### Option 2: Use PowerShell Script

Run the provided script:
```powershell
PowerShell -ExecutionPolicy Bypass -File setup-ngrok.ps1
```

### Option 3: Temporary Mock URL (For Testing)

If you want to test the app without ngrok, I can create a temporary mock URL:

1. Update `.env` file with:
   ```
   EBAY_REDIRECT_URI=https://mock-ngrok-url.ngrok-free.app/api/ebay/callback
   ```

2. This will allow the app to run, but eBay OAuth won't work until you set up a real ngrok tunnel.

## Current Status

✅ **Fixed**: eBay OAuth redirect URI issue  
✅ **Working**: VIN decoding and parts population  
✅ **Working**: Image hunting and price research  
⚠️ **Pending**: Real ngrok tunnel for eBay authentication  

## Next Steps

1. **Set up ngrok** using Option 1 above
2. **Test eBay OAuth** connection
3. **Verify** that parts can be listed on eBay

## Troubleshooting

- **403 Forbidden**: ngrok tunnel not active or wrong URL
- **400 Invalid Request**: Redirect URI doesn't match eBay Developer Console
- **401 Unauthorized**: Need to complete OAuth flow first

## eBay Developer Console

If you have access to the eBay Developer Console:
1. Go to your app settings
2. Update the RuName (Redirect URI) to include your new ngrok URL
3. This allows you to use any ngrok URL without restrictions

---

**Need Help?** The ngrok setup is the most complex part. Once it's working, everything else should work perfectly! 🎉
