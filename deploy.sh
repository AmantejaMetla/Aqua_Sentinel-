#!/bin/bash

# AquaSentinel Deployment Script
echo "🚀 AquaSentinel Deployment Helper"
echo "=================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "git init"
    echo "git add ."
    echo "git commit -m 'Initial commit'"
    exit 1
fi

# Check if requirements.txt exists
if [ ! -f "backend/requirements.txt" ]; then
    echo "❌ backend/requirements.txt not found. Creating it..."
    cd backend
    pip freeze > requirements.txt
    cd ..
fi

# Check if package.json exists
if [ ! -f "frontend/package.json" ]; then
    echo "❌ frontend/package.json not found. Please run 'npm init' in frontend directory"
    exit 1
fi

echo "✅ Pre-deployment checks passed!"
echo ""
echo "Next steps:"
echo "1. Push code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for deployment'"
echo "   git push origin main"
echo ""
echo "2. Deploy Backend to Railway:"
echo "   - Go to https://railway.app"
echo "   - Click 'New Project' → 'Deploy from GitHub'"
echo "   - Select your AquaSentinel repository"
echo "   - Railway will auto-detect Python app"
echo ""
echo "3. Deploy Frontend to Netlify:"
echo "   - Go to https://netlify.com"
echo "   - Click 'New site from Git'"
echo "   - Select your repository"
echo "   - Set build settings:"
echo "     Base: frontend"
echo "     Build: npm run build"
echo "     Publish: frontend/dist"
echo ""
echo "4. Configure environment variables (see DEPLOYMENT_GUIDE.md)"
echo ""
echo "🎉 Your AquaSentinel app will be live!" 