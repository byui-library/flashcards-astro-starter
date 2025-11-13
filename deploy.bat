@echo off
echo 🚀 Starting deployment process...

echo 📦 Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    exit /b 1
)

echo 🧪 Running tests...
call npm run test:run
if %errorlevel% neq 0 (
    echo ❌ Tests failed!
    exit /b 1
)

echo 📝 Adding files to git...
git add .

echo 💾 Committing changes...
git commit -m "chore: build and test"

echo 🌐 Pushing to GitHub...
git push
if %errorlevel% neq 0 (
    echo ❌ Push failed!
    exit /b 1
)

echo ✅ Deployment completed successfully!
pause