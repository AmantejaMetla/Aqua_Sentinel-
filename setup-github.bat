@echo off
echo 🚀 AquaSentinel GitHub Setup Script
echo ===================================

echo.
echo 📁 Setting up Git repository...

REM Initialize Git if not already done
if not exist ".git" (
    git init
    echo ✅ Git repository initialized
) else (
    echo ℹ️  Git repository already exists
)

echo.
echo 📝 Creating .gitignore...

REM Create .gitignore file
(
echo # Environment variables
echo .env
echo .env.local
echo .env.production
echo .env.development
echo.
echo # Dependencies
echo node_modules/
echo __pycache__/
echo *.pyc
echo.
echo # Build outputs
echo frontend/dist/
echo backend/models/*.pkl
echo *.db
echo *.sqlite
echo.
echo # IDEs
echo .vscode/
echo .idea/
echo *.swp
echo *.swo
echo.
echo # OS
echo .DS_Store
echo Thumbs.db
echo.
echo # Logs
echo *.log
echo logs/
echo.
echo # Firebase
echo firebase-debug.log
echo firestore-debug.log
) > .gitignore

echo ✅ .gitignore created

echo.
echo 📦 Adding files to Git...
git add .

echo.
echo 💾 Creating initial commit...
git commit -m "feat: Initial AquaSentinel setup with deployment configs

- Add Flask backend with ML water quality prediction
- Add React frontend with real-time dashboard
- Add Firebase Firestore integration  
- Add deployment configs for Render.com and Netlify
- Add comprehensive documentation"

echo ✅ Initial commit created

echo.
echo 🌐 Next steps:
echo 1. Create repository on GitHub.com:
echo    - Go to https://github.com/new
echo    - Name: AquaSentinel
echo    - Description: AI-Powered Water Quality Monitoring System
echo    - Make it PUBLIC (required for free deployment)
echo    - DON'T initialize with README
echo.
echo 2. Connect to GitHub (replace YOUR_USERNAME):
echo    git remote add origin https://github.com/YOUR_USERNAME/AquaSentinel.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Deploy:
echo    - Backend: Connect GitHub repo to Render.com
echo    - Frontend: Connect GitHub repo to Netlify
echo.
echo 🎉 GitHub setup complete! Ready for deployment.

pause 