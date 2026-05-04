# 🎲 Board Game Catalog

A personal board game collection viewer that fetches live box art, ratings, and player counts from BoardGameGeek.

## Stack
- **Frontend:** Vanilla HTML/CSS/JS (no framework needed)
- **Backend:** Vercel Serverless Function (`/api/games.js`)
- **Data source:** [BoardGameGeek XML API v2](https://boardgamegeek.com/wiki/page/BGG_XML_API2)

## Project Structure
```
bgg-catalog/
├── api/
│   └── games.js        # Serverless function — fetches BGG data server-side
├── public/
│   └── index.html      # Frontend card grid with search + filter + sort
├── games.json          # Your game list (edit to add/remove games)
├── package.json
├── vercel.json
└── .gitignore
```

## Deploy to Vercel (5 minutes)

### Option A — Vercel CLI
```bash
npm install -g vercel
cd bgg-catalog
npm install
vercel          # follow prompts, deploys instantly
```

### Option B — GitHub + Vercel Dashboard
1. Push this folder to a new GitHub repo
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Leave all settings as default → click **Deploy**
5. Done — Vercel auto-deploys on every `git push`

## Adding Games
Edit `games.json` — add a new object with:
```json
{
  "name": "Game Name",
  "type": "Game Type",
  "description": "Short description.",
  "bgg_id": 123456,
  "bgg": "https://boardgamegeek.com/boardgame/123456"
}
```
Then redeploy. The API function handles fetching images/ratings automatically.

## Caching
The `/api/games` endpoint is cached for **24 hours** on Vercel's edge (`s-maxage=86400`), so BGG isn't hammered on every page load.
