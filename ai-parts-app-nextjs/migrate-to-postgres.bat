@echo off
echo 🔄 Migrating from SQLite to PostgreSQL...
echo.

echo 📊 Setting environment variables...
set DATABASE_URL=postgresql://postgres:Faizi786@localhost:5433/ai_parts_app

echo 🔍 Testing PostgreSQL connection...
npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Schema push failed
    pause
    exit /b 1
)

echo ✅ Schema pushed successfully!
echo.

echo 📊 Seeding database with initial data...
npx prisma db seed
if %errorlevel% neq 0 (
    echo ❌ Database seeding failed
    pause
    exit /b 1
)

echo ✅ Database seeded successfully!
echo.

echo 🎉 Migration complete!
echo 📋 Your app is now using PostgreSQL database
echo 🚀 You can now run: npm run dev
pause
