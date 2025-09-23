@echo off
echo 🔍 Checking GitHub upload status...
echo Repository: https://github.com/us3786/AI_PARTS_APP
echo.

REM Check if we're in the correct directory
if not exist "package.json" (
    echo ❌ Not in the correct directory. Please run this script from the ai-parts-app-nextjs folder.
    pause
    exit /b 1
)

echo ✅ In correct directory: ai-parts-app-nextjs
echo.

REM Show what files we have
echo 📁 Files in current directory:
dir /b | findstr /v "node_modules" | findstr /v ".git"
echo.

REM Force add all files
echo 📦 Adding all files to Git...
git add -A

REM Show what's staged
echo 📋 Files staged for commit:
git status --porcelain
echo.

REM Create commit
echo 💾 Creating commit...
git commit -m "Force upload: Complete AI Parts Application

- Next.js application with TypeScript
- 290+ automotive parts catalog
- VIN decoding system
- eBay integration
- Professional dashboard UI
- Comprehensive documentation
- Database schema and seeding
- All configuration files"

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push -f origin main

echo.
echo ✅ Upload complete!
echo 📂 Check your repository: https://github.com/us3786/AI_PARTS_APP
echo.
echo 📋 You should now see:
echo - src/ folder with all components
echo - prisma/ folder with database files
echo - All documentation files
echo - Configuration files
echo - Setup scripts
echo.
pause
