# GitHub Pages Deployment Guide

## Quick Steps

### 1. Install Dependencies
```bash
cd github_frontend
npm install
npm install --save-dev gh-pages
```

### 2. Configure package.json
Add to `package.json`:
```json
"homepage": "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME",
"scripts": {
  "deploy": "npm run build && gh-pages -d build"
}
```

### 3. Set Production API URL
Create `.env.production` in `github_frontend/`:
```
REACT_APP_API_URL=https://cadu-ardu.com/api
```

### 4. Deploy to GitHub Pages
```bash
npm run deploy
```

### 5. Configure GitHub Repository
- Go to repo **Settings → Pages**
- **Source**: `gh-pages` branch
- **Custom domain** (optional): `cadu-ardu.com`
- Your site: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

### 6. Custom Domain Setup (Optional)
1. Create `public/CNAME` file:
   ```
   cadu-ardu.com
   ```
2. Update DNS: Add CNAME record pointing to `YOUR_USERNAME.github.io`
3. Wait for DNS propagation (5-30 min)
4. Enable HTTPS in GitHub Pages settings

### 7. React Router Setup (Already Done)
✅ `404.html` redirect file created  
✅ `index.html` updated with redirect handler  
This ensures client-side routing works on GitHub Pages

## Error Handling (Already Implemented)

✅ **Public Pages**: Show cached content if backend fails  
⚠️ **Member Areas**: Display maintenance message when backend unavailable

## Benefits

- ✅ Frontend stays online even if backend is down
- ✅ Static assets served from GitHub CDN
- ✅ Automatic HTTPS
- ✅ Free hosting
