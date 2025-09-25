@echo off
echo 🚀 AI Parts App - PostgreSQL Setup
echo ==================================

echo.
echo 1. Pushing database schema...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Database push failed
    pause
    exit /b 1
)
echo ✅ Database schema updated

echo.
echo 2. Seeding database...
call npx prisma db seed
if %errorlevel% neq 0 (
    echo ❌ Database seed failed
    pause
    exit /b 1
)
echo ✅ Database seeded

echo.
echo 3. Running health check...
call node scripts/postgres-setup.js
echo ✅ Health check complete

echo.
echo 🎉 Setup complete! Run: npm run dev
pause
