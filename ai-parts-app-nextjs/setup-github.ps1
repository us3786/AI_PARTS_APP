# PowerShell Script to Set Up GitHub Repository
# Run this script in PowerShell as Administrator

Write-Host "🚀 Setting up AI Parts Application for GitHub..." -ForegroundColor Green

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Please install Git first:" -ForegroundColor Red
    Write-Host "   https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Not in the correct directory. Please run this script from the ai-parts-app-nextjs folder." -ForegroundColor Red
    exit 1
}

Write-Host "✅ In correct directory" -ForegroundColor Green

# Initialize Git repository
Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
git init

# Add all files
Write-Host "📁 Adding files to Git..." -ForegroundColor Yellow
git add .

# Create initial commit
Write-Host "💾 Creating initial commit..." -ForegroundColor Yellow
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

Write-Host "✅ Git repository initialized and committed!" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Go to https://github.com and create a new repository named 'ai-parts-app'" -ForegroundColor White
Write-Host "2. Copy the repository URL (e.g., https://github.com/YOUR_USERNAME/ai-parts-app.git)" -ForegroundColor White
Write-Host "3. Run these commands (replace YOUR_USERNAME):" -ForegroundColor White
Write-Host ""
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/ai-parts-app.git" -ForegroundColor Yellow
Write-Host "   git branch -M main" -ForegroundColor Yellow
Write-Host "   git push -u origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 See GITHUB_SETUP_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host "🎉 Your AI Parts Application is ready for GitHub!" -ForegroundColor Green
