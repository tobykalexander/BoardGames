# 🎲 Board Game Catalog v2

## Project Structure
```
/
├── index.html       ← frontend (served as static root)
├── api/
│   └── games.js     ← Vercel serverless function (no npm deps!)
├── vercel.json
└── package.json
```

## Deploy via GitHub → Vercel
1. Upload ALL files to the **root** of your GitHub repo (not inside a subfolder)
2. Go to vercel.com → Import repo → Deploy
3. No build settings needed — leave everything default

## Key fix from v1
- Removed all npm dependencies (no xml2js)
- Simplified vercel.json (Vercel auto-detects api/ folder)
- index.html is at repo root (not inside /public)
- Uses CommonJS require() instead of ES module imports
