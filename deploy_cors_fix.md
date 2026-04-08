# CORS Fix Deployment Guide

## Problem
The frontend at `https://marsamarocformation.onrender.com` cannot access the Python backend at `https://gestion-apresformation-1-python.onrender.com` due to CORS policy restrictions.

## Solution Applied

### 1. Backend Changes (main.py)
Updated CORS middleware configuration to:
- Explicitly allow the frontend domain: `https://marsamarocformation.onrender.com`
- Allow localhost for development: `http://localhost:3000`, `http://localhost:3001`
- Specific HTTP methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- Keep wildcard as fallback

### 2. Frontend Changes (TrainingAnalytics.js)
- Added `mode: 'cors'` to all fetch requests
- Improved error handling for CORS issues
- Better logging for debugging

## Deployment Steps

### For Python Backend (Render.com)

1. **Push changes to Git:**
```bash
git add AnalyseForm/app/main.py
git commit -m "Fix CORS policy for frontend domain access"
git push origin main
```

2. **Render should auto-deploy** - If not, manually trigger deployment in Render dashboard

### For Frontend (if needed)

1. **Push changes:**
```bash
git add app_default_26_02_11_18_45_54/frontend/src/pages/TrainingAnalytics.js
git commit -m "Add CORS mode to fetch requests"
git push origin main
```

## Verification

After deployment, test the CORS fix:

1. Open browser developer tools
2. Navigate to the analytics page
3. Check the Network tab for the health check request to `/`
4. Verify no CORS errors appear
5. Test the "Lancer l'analyse" button

## Alternative Solutions (if issues persist)

### Option 1: Use a Proxy
Create a proxy endpoint in your main backend that forwards requests to the analysis service.

### Option 2: Environment Variables
Set CORS origins via environment variables in Render:
```
CORS_ORIGINS=https://marsamarocformation.onrender.com,http://localhost:3000
```

### Option 3: Development Mode
For local testing, use browser extensions to disable CORS temporarily.

## Common Issues

1. **Cache Issues**: Clear browser cache and hard refresh (Ctrl+F5)
2. **Propagation Delay**: Wait 2-3 minutes for Render deployment
3. **Pre-flight Requests**: Ensure OPTIONS method is allowed
4. **SSL Certificates**: Both sites must use HTTPS in production

## Testing Commands

```bash
# Test CORS pre-flight
curl -X OPTIONS https://gestion-apresformation-1-python.onrender.com/ \
  -H "Origin: https://marsamarocformation.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Test actual request
curl -X GET https://gestion-apresformation-1-python.onrender.com/ \
  -H "Origin: https://marsamarocformation.onrender.com" \
  -v
```
