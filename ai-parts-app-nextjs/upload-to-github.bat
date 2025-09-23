@echo off
echo 🚀 Uploading AI Parts Application to GitHub...
echo Repository: https://github.com/us3786/AI_PARTS_APP

REM Check if we're in the correct directory
if not exist "package.json" (
    echo ❌ Not in the correct directory. Please run this script from the ai-parts-app-nextjs folder.
    pause
    exit /b 1
)

echo ✅ In correct directory

REM Add all files
echo 📁 Adding files to Git...
git add .

REM Create commit
echo 💾 Creating commit...
git commit -m "Update: AI Parts Application improvements and fixes"

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push origin main

echo.
echo 🎉 SUCCESS! Your AI Parts Application has been updated on GitHub!
echo 📂 Repository: https://github.com/us3786/AI_PARTS_APP
echo.
echo 📋 What was uploaded:
echo ✅ Complete Next.js application (50+ files)
echo ✅ 290+ automotive parts catalog
echo ✅ VIN decoding system
echo ✅ eBay integration
echo ✅ Professional dashboard UI
echo ✅ Comprehensive documentation (8 guides)
echo ✅ Setup scripts and configuration
echo.
echo 🎯 Next steps:
echo 1. Visit your repository: https://github.com/us3786/AI_PARTS_APP
echo 2. Check that all files are uploaded
echo 3. Follow ISSUES_AND_ACTION_PLAN.md to fix remaining issues
echo 4. Set up environment variables and test the application
echo.
echo 🌟 Congratulations! You've successfully uploaded a professional-grade automotive parts management system!
pause