@echo off
echo 🚀 Setting up AI Parts Application for GitHub...

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git not found. Please install Git first:
    echo    https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Git found

REM Check if we're in the correct directory
if not exist "package.json" (
    echo ❌ Not in the correct directory. Please run this script from the ai-parts-app-nextjs folder.
    pause
    exit /b 1
)

echo ✅ In correct directory

REM Initialize Git repository
echo 📦 Initializing Git repository...
git init

REM Add all files
echo 📁 Adding files to Git...
git add .

REM Create initial commit
echo 💾 Creating initial commit...
git commit -m "Initial commit: AI Parts Application - Complete Next.js implementation

- VIN decoding with NHTSA API integration
- 290+ automotive parts catalog with detailed specifications  
- Multi-source price research (eBay, AutoZone, RockAuto, LKQ)
- eBay OAuth 2.0 authentication and bulk listing system
- Professional dashboard UI with React components
- Comprehensive documentation and setup guides
- Prisma ORM with SQLite database
- TypeScript throughout for type safety
- Ready for production deployment"

echo ✅ Git repository initialized and committed!

echo.
echo 🎯 NEXT STEPS:
echo 1. Go to https://github.com and create a new repository named 'ai-parts-app'
echo 2. Copy the repository URL (e.g., https://github.com/YOUR_USERNAME/ai-parts-app.git)
echo 3. Run these commands (replace YOUR_USERNAME):
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/ai-parts-app.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 📚 See GITHUB_SETUP_GUIDE.md for detailed instructions
echo 🎉 Your AI Parts Application is ready for GitHub!
pause
