const https = require('https');
const fs    = require('fs');
const path  = require('path');

const GAMES    = require('./games.json');
const IMG_DIR  = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

function get(url, binary = false, redirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'BGGCatalog/1.0' } }, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location && redirects > 0)
        return get(res.headers.location, binary, redirects - 1).then(resolve).catch(reject);
      if (binary) {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      } else {
        let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
      }
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function parseXML(xml) {
  const out = {};
  for (const item of (xml.match(/<item\s[^>]*type="boardgame"[\s\S]*?<\/item>/g) || [])) {
    const id = parseInt((item.match(/\sid="(\d+)"/) || [])[1]);
    if (!id) continue;
    let thumb = ((item.match(/<thumbnail>([^<]+)<\/thumbnail>/) || [])[1] || '').trim();
    if (thumb && !thumb.startsWith('http')) thumb = 'https:' + thumb;
    const rating  = (item.match(/<average[^>]*value="([^"]+)"/) || [])[1];
    const minP    = (item.match(/<minplayers[^>]*value="([^"]+)"/) || [])[1] || '?';
    const maxP    = (item.match(/<maxplayers[^>]*value="([^"]+)"/) || [])[1] || '?';
    out[id] = { thumbnail: thumb, rating: rating ? parseFloat(rating).toFixed(1) : 'N/A', minPlayers: minP, maxPlayers: maxP };
  }
  return out;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // 1. Fetch BGG metadata in parallel chunks
  const ids    = [...new Set(GAMES.map(g => g.bgg_id))];
  const chunks = [];
  for (let i = 0; i < ids.length; i += 20) chunks.push(ids.slice(i, i + 20));

  const bggMap = {};
  for (const chunk of chunks) {
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${chunk.join(',')}&stats=1&type=boardgame`;
    try {
      const xml = await get(url);
      // BGG returns 202 (queued) on first hit — retry once after delay
      if (xml.includes('<message>')) {
        console.log('BGG queued response, retrying in 5s...');
        await sleep(5000);
        const xml2 = await get(url);
        Object.assign(bggMap, parseXML(xml2));
      } else {
        Object.assign(bggMap, parseXML(xml));
      }
    } catch(e) { console.error(`Chunk error: ${e.message}`); }
    await sleep(1500);
  }
  console.log(`Metadata fetched for ${Object.keys(bggMap).length} games`);

  // 2. Download images
  const seen = new Set();
  const enriched = [];
  for (const g of GAMES) {
    const bgg = bggMap[g.bgg_id] || {};
    let localImg = '';
    if (bgg.thumbnail) {
      const ext = (bgg.thumbnail.match(/\.(jpe?g|png|gif|webp)/i) || ['','jpg'])[1];
      const filename = `${g.bgg_id}.${ext}`;
      const dest = path.join(IMG_DIR, filename);
      if (!seen.has(g.bgg_id)) {
        seen.add(g.bgg_id);
        try {
          const buf = await get(bgg.thumbnail, true);
          fs.writeFileSync(dest, buf);
          console.log(`✓ ${g.name}`);
        } catch(e) { console.error(`✗ ${g.name}: ${e.message}`); }
        await sleep(300);
      }
      localImg = `/images/${filename}`;
    }
    enriched.push({ ...g, thumbnail: localImg, rating: bgg.rating || 'N/A',
      minPlayers: bgg.minPlayers || '?', maxPlayers: bgg.maxPlayers || '?' });
  }

  fs.writeFileSync('games-data.json', JSON.stringify(enriched, null, 2));
  console.log('✅ games-data.json written');
}

main().catch(e => { console.error(e); process.exit(1); });
