# Deployment Guide - Render.com

## Step-by-Step Deployment Instructions

### 1. Prepare Your Code

✅ Already done! The project includes:
- `render.yaml` - Deployment configuration
- `.gitignore` - Ignore unnecessary files
- `requirements.txt` - Python dependencies
- `package.json` - Node.js dependencies

### 2. Create GitHub Repository

```bash
# Navigate to your project folder
cd "e:\PROJECTS\def and dump"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Deaf & Dump Communication Platform"

# Create repository on GitHub.com
# Then connect it:
git remote add origin https://github.com/YOUR_USERNAME/deaf-dump.git
git branch -M main
git push -u origin main
```

### 3. Deploy on Render.com

#### A. Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account
3. Authorize Render to access your repositories

#### B. Deploy Using Blueprint
1. Click **"New"** → **"Blueprint"**
2. Select your `deaf-dump` repository
3. Render will detect `render.yaml` automatically
4. Click **"Apply"** to deploy

#### C. Wait for Deployment
- Backend: ~5 minutes
- Frontend: ~3 minutes
- Total: ~10 minutes

### 4. Get Your URLs

After deployment completes:
- **Frontend**: `https://deaf-dump-frontend.onrender.com`
- **Backend**: `https://deaf-dump-backend.onrender.com`

### 5. Update CORS (Important!)

1. Go to Render Dashboard
2. Click on **"deaf-dump-backend"** service
3. Go to **"Environment"** tab
4. Update `ALLOWED_ORIGINS`:
   ```
   https://deaf-dump-frontend.onrender.com
   ```
5. Save and wait for re-deploy (~1 min)

### 6. Test Your Deployment

1. Open `https://deaf-dump-frontend.onrender.com`
2. Sign up for an account
3. Login
4. Start a video call (requires webcam)
5. Test sign detection and speech recognition

## Troubleshooting

### Backend Won't Start
- **Check logs**: Render Dashboard → Service → Logs
- **Common issues**:
  - MongoDB URI invalid: Check environment variable
  - Missing dependencies: Check `requirements.txt`
  - Port conflict: Render auto-assigns port

### Frontend Shows 404
- **Solution**: Wait for build to complete (check Logs)
- **Check**: Build command ran successfully
- **Verify**: `dist/` folder was created

### CORS Errors
- **Check**: `ALLOWED_ORIGINS` includes your frontend URL
- **Format**: `https://your-frontend.onrender.com` (no trailing slash)
- **Re-deploy**: After changing environment variables

### WebRTC Not Working
- **Check**: Both services are HTTPS (required for WebRTC)
- **Browser**: Use Chrome or Edge
- **Camera**: Allow camera/mic permissions
- **Network**: Some corporate networks block WebRTC

### Speech Recognition Not Working
- **Browser**: Only works in Chrome/Edge (not Firefox/Safari)
- **Permissions**: Allow microphone access
- **HTTPS**: Required for Web Speech API

### Cold Starts (Free Tier)
- **Issue**: App sleeps after 15 min of inactivity
- **Result**: First request takes 30-60 seconds
- **Solution**: Upgrade to paid tier ($7/month) for always-on

## Monitoring

### Check Service Health
- Render Dashboard → Service → Metrics
- Monitor: Response time, CPU, Memory

### View Logs
- Render Dashboard → Service → Logs
- Real-time log streaming
- Search and filter logs

## Upgrading

### To Paid Tier ($7/month per service)
1. Render Dashboard → Service → Settings
2. Change instance type to "Starter"
3. Benefits:
   - No cold starts
   - Better performance
   - More resources

## Custom Domain (Optional)

1. Buy domain (e.g., Namecheap, GoDaddy)
2. Render Dashboard → Service → Settings → Custom Domains
3. Add your domain: `deafdump.com`
4. Update DNS records at your registrar:
   ```
   Type: CNAME
   Name: @
   Value: deaf-dump-frontend.onrender.com
   ```
5. Wait for DNS propagation (5-60 min)

## Environment Variables Reference

### Backend (render.yaml handles these)
```
MONGODB_URI=mongodb+srv://...
SECRET_KEY=auto-generated
ALLOWED_ORIGINS=https://your-frontend.onrender.com
FORCE_HTTPS=True
PORT=5000
```

### Frontend (render.yaml handles these)
```
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

## Costs

### Free Tier
- ✅ Both services FREE
- ⚠️ 750 hours/month (enough for small usage)
- ⚠️ Cold starts after 15 min inactivity

### Paid Tier ($14/month total)
- ✅ Always-on (no cold starts)
- ✅ Better performance
- ✅ 512MB RAM per service
- Backend: $7/month
- Frontend: $7/month

## Support

- Render Docs: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

## Next Steps After Deployment

1. ✅ Test all features thoroughly
2. ✅ Share link with users
3. 📊 Monitor usage and errors
4. 🔄 Set up GitHub Actions for auto-deploy (optional)
5. 📧 Configure email service for password reset
6. 🌐 Add TURN server for better WebRTC reliability
7. 🎨 Customize branding and colors
