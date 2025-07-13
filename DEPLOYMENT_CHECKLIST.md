# 🚀 AquaSentinel Deployment Checklist

## Pre-Deployment Setup

### 1. GitHub Repository Setup
- [ ] Run `setup-github.bat` to initialize Git repository
- [ ] Create GitHub repository: `https://github.com/yourusername/aquasentinel`
- [ ] Push code to GitHub: `git push -u origin main`

### 2. Environment Configuration
- [ ] Copy `frontend/env.template` to configure environment variables
- [ ] Set up Firebase project and get configuration keys
- [ ] Note down all environment variables for deployment

## Backend Deployment (Render.com)

### 3. Render.com Backend Setup
- [ ] Create Render.com account
- [ ] Connect GitHub repository
- [ ] Create new Web Service
- [ ] Configure deployment settings:
  - **Build Command**: `pip install -r requirements.txt`
  - **Start Command**: `python app.py`
  - **Environment**: `Python 3`
  - **Plan**: `Free`

### 4. Backend Environment Variables
Add these in Render.com dashboard:
- [ ] `FLASK_ENV=production`
- [ ] `FLASK_DEBUG=false`
- [ ] `PORT=10000`
- [ ] Firebase configuration variables (if using Firebase)

### 5. Backend Verification
- [ ] Deployment completes successfully
- [ ] Health check endpoint accessible: `https://your-app.onrender.com/health`
- [ ] Model loads correctly (check logs)
- [ ] API endpoints respond correctly

## Frontend Deployment (Netlify)

### 6. Netlify Frontend Setup
- [ ] Create Netlify account
- [ ] Connect GitHub repository
- [ ] Configure build settings:
  - **Base directory**: `frontend`
  - **Build command**: `npm run build`
  - **Publish directory**: `frontend/dist`

### 7. Frontend Environment Variables
Add these in Netlify dashboard (Site Settings > Environment Variables):
- [ ] `VITE_API_URL=https://your-render-app.onrender.com`
- [ ] `VITE_APP_NAME=AquaSentinel`
- [ ] `VITE_FIREBASE_API_KEY=your-firebase-key`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com`
- [ ] `VITE_FIREBASE_PROJECT_ID=your-project-id`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id`
- [ ] `VITE_FIREBASE_APP_ID=your-app-id`

### 8. Frontend Verification
- [ ] Build completes successfully
- [ ] Site loads correctly
- [ ] All pages accessible
- [ ] API communication works

## Post-Deployment Testing

### 9. Full System Test
- [ ] Run deployment test: `node test-deployment.js`
- [ ] Test all major features:
  - [ ] Dashboard loads with real-time data
  - [ ] Analytics page shows ML predictions
  - [ ] Settings page works
  - [ ] Firebase integration works
  - [ ] Keep-alive service prevents backend sleep

### 10. Final Verification
- [ ] Frontend URL: `https://aquasentinel.netlify.app`
- [ ] Backend URL: `https://aquasentinel-backend.onrender.com`
- [ ] Both URLs accessible and working
- [ ] Cross-origin requests working (CORS configured)
- [ ] No console errors in browser
- [ ] Backend logs show no errors

## Monitoring & Maintenance

### 11. Post-Deployment Monitoring
- [ ] Monitor backend sleep/wake cycles
- [ ] Check keep-alive service logs
- [ ] Monitor API response times
- [ ] Check Firebase usage limits

### 12. Backup & Recovery
- [ ] Document all environment variables
- [ ] Save deployment configuration
- [ ] Create recovery procedures

## Troubleshooting

### Common Issues:
- **Backend sleeping**: Keep-alive service pings every 10 minutes
- **CORS errors**: Check CORS configuration in `backend/app.py`
- **Build failures**: Check environment variables and dependencies
- **API connection**: Verify `VITE_API_URL` matches backend URL

### Quick Tests:
```bash
# Test backend health
curl https://your-backend.onrender.com/health

# Test frontend
curl https://your-frontend.netlify.app

# Run full deployment test
node test-deployment.js
```

## 🎉 Completion

When all checkboxes are complete, your AquaSentinel application is fully deployed and ready for production use!

**Frontend**: https://aquasentinel.netlify.app
**Backend**: https://aquasentinel-backend.onrender.com
**Repository**: https://github.com/yourusername/aquasentinel 