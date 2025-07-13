# 🚀 AquaSentinel Deployment Guide (FREE Options)

## Overview
Deploy AquaSentinel completely FREE with:
- **Frontend**: React app on Netlify (FREE unlimited)
- **Backend**: Flask API on Render.com (FREE unlimited with sleep)
- **Database**: Firebase Firestore (FREE 1GB storage)

## 🆓 **Why These FREE Options?**

| Service | What You Get FREE | Limitations |
|---------|-------------------|-------------|
| **Render.com** | Unlimited usage, 512MB RAM | Sleeps after 15min inactivity |
| **Netlify** | 100GB bandwidth/month | More than enough for most apps |
| **Firebase** | 1GB storage, 10GB transfer | Perfect for IoT data |

**Total Cost: $0/month forever** ✅

## 📋 Step-by-Step Deployment

### 1. Backend Deployment on Render.com

#### A. Prepare Render Account
1. Go to [Render.com](https://render.com) and sign up with GitHub
2. It's completely FREE - no credit card required!

#### B. Deploy Backend
1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `aquasentinel-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
   - **Plan**: **FREE** (select this!)

#### C. Environment Variables
Add in Render dashboard:
```
FLASK_ENV=production
FLASK_DEBUG=False
PORT=10000
```

### 2. Frontend Deployment on Netlify

#### A. Deploy Frontend
1. Go to [Netlify.com](https://netlify.com) and sign up
2. Click "New site from Git"
3. Select your AquaSentinel repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

#### B. Environment Variables
Add in Netlify dashboard:
```
VITE_API_URL=https://your-render-app.onrender.com
VITE_APP_NAME=AquaSentinel
VITE_FIREBASE_API_KEY=your-firebase-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 🔧 **Handle Backend Sleep Issue**

Since Render.com sleeps after 15 minutes, here are solutions:

### Option A: Keep-Alive Ping (Recommended)
Add this to your frontend to ping the backend every 10 minutes:

```javascript
// In frontend/src/App.jsx
useEffect(() => {
  const keepAlive = setInterval(() => {
    fetch(`${import.meta.env.VITE_API_URL}/health`)
      .catch(() => {}) // Ignore errors
  }, 10 * 60 * 1000) // Every 10 minutes
  
  return () => clearInterval(keepAlive)
}, [])
```

### Option B: External Monitor (Free)
Use [UptimeRobot](https://uptimerobot.com) (free) to ping your backend every 5 minutes.

## 🌐 Alternative FREE Backend Options

### Option 2: PythonAnywhere (Always-On FREE)
If you prefer no sleeping:

1. Go to [PythonAnywhere.com](https://pythonanywhere.com)
2. Sign up for FREE account
3. Upload your `backend` folder
4. Create a web app pointing to `app.py`
5. Your app stays online 24/7!

### Option 3: Vercel Serverless (Edge Functions)
Convert your Flask app to serverless functions:

1. Create `api/` folder in your repo
2. Move Flask routes to individual files
3. Deploy to Vercel (FREE unlimited)

## 💡 **Recommended Setup for You:**

**Best Balance of FREE + Reliability:**
```
Frontend: Netlify (always fast)
Backend: Render.com (free unlimited, sleeps)
Database: Firebase (free 1GB)
Monitoring: UptimeRobot (keeps backend awake)
```

**If You Need Always-On Backend:**
```
Frontend: Netlify
Backend: PythonAnywhere (free, always-on)
Database: Firebase
```

## 🔄 **Migration from Railway**

Since you already have Railway setup:

1. **Delete Railway service** (avoid charges)
2. **Deploy to Render.com instead** (follow steps above)
3. **Update frontend** with new Render URL
4. **Same code, zero changes needed!**

## 🎉 **Benefits of This Setup:**

✅ **$0/month forever**  
✅ **Professional URLs** (yourapp.onrender.com)  
✅ **Auto HTTPS** certificates  
✅ **Git-based deployment** (push to deploy)  
✅ **Environment variables** support  
✅ **Build logs** and monitoring  
✅ **Custom domains** (if you get one later)  

## 🚨 **Important Notes:**

- **Render.com sleeps**: ~30 second startup after inactivity
- **Perfect for demos/development**: Most users won't notice
- **Firebase free tier**: 1GB storage = ~1 million sensor readings
- **Netlify free tier**: 100GB bandwidth = very generous
- **No credit cards required** for any of these services

Ready to deploy for FREE? Just follow the Render.com steps above! 🚀 