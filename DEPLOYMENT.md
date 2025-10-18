# Deployment Guide

## Render.com Deployment

### Prerequisites
- GitHub repository with latest code
- Render.com account

### Configuration

#### Build Settings
```
Build Command: npm install; npm run build
Start Command: npm start
```

**IMPORTANT:**
- ❌ DO NOT use `npm run dev` as Start Command (development server)
- ✅ USE `npm start` (production static file server with `serve`)

#### Environment Variables
Add the following environment variables in Render.com dashboard:

```
VITE_KAKAO_MAP_API_KEY=your_kakao_map_api_key
```

Get Kakao Map API key from: https://developers.kakao.com/

### Deployment Process

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Render.com auto-deploys** on push to main branch

3. **Verify deployment:**
   - Check Render.com logs for successful build
   - Visit deployed URL
   - Test functionality

### Common Issues

#### Issue 1: Port Scan Timeout
**Error:** "No open ports detected on 0.0.0.0"

**Cause:** Using `npm run dev` instead of `npm start`

**Solution:**
- Change Start Command to `npm start` in Render.com dashboard
- Redeploy

#### Issue 2: Host Not Allowed
**Error:** "Blocked request. This host is not allowed."

**Cause:** Vite dev server security restriction (if using npm run dev)

**Solution:**
- Use `npm start` instead (recommended)
- OR: allowedHosts already configured in vite.config.ts

#### Issue 3: Kakao Map Not Loading
**Error:** Map doesn't display or shows error

**Cause:** Missing VITE_KAKAO_MAP_API_KEY environment variable

**Solution:**
- Add environment variable in Render.com dashboard
- Redeploy

### Manual Deployment

If auto-deploy fails:

1. Go to Render.com dashboard
2. Select your service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Monitor logs for errors

### Rollback

To rollback to previous version:

1. Go to Render.com dashboard
2. Select your service
3. Go to "Events" tab
4. Find previous successful deployment
5. Click "Rollback to this version"

### Production Checklist

- [ ] Build Command: `npm install; npm run build`
- [ ] Start Command: `npm start` (NOT `npm run dev`)
- [ ] Environment variable `VITE_KAKAO_MAP_API_KEY` set
- [ ] Latest code pushed to GitHub
- [ ] Build succeeds without errors
- [ ] Application loads correctly
- [ ] Map functionality works (if API key configured)

### Performance

Current bundle size:
- Total: ~302KB
- Gzipped: ~90KB
- Load time: <3s on 3G

### Monitoring

Check Render.com logs for:
- Build errors
- Runtime errors
- Performance metrics
- Traffic patterns

### Support

For deployment issues:
- Render.com docs: https://render.com/docs
- Render.com support: https://render.com/support
