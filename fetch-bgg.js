const https = require('https');
const fs    = require('fs');
const path  = require('path');

const GAMES   = require('./games.json');
const IMG_DIR = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getText(url, timeoutMs = 15000, redirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'BGGCatalogBot/1.0 (github-actions)' } }, res => {
      if (redirects > 0 && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return getText(res.headers.location, timeoutMs, redirects - 1).then(resolve).catch(reject);
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('Timeout: ' + url)); });
  });
}

function getBinary(url, timeoutMs = 15000, redirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'BGGCatalogBot/1.0' } }, res => {
      if (redirects > 0 && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return getBinary(res.headers.location, timeoutMs, redirects - 1).then(resolve).catch(reject);
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function fetchBGGXml(url, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`  Attempt ${attempt}: GET ${url.slice(0, 80)}...`);
    const { status, body } = await getText(url);
    console.log(`  Response status: ${status}, body length: ${body.length}`);
    if (status === 200 && !body.includes('<message>')) return body;
    if (status === 202 || body.includes('<message>')) {
      const waitSecs = attempt * 5;
      console.log(`  BGG returned 202/queued — waiting ${waitSecs}s before retry...`);
      await sleep(waitSecs * 1000);
      continue;
    }
    console.log(`  Unexpected status ${status}, retrying...`);
    await sleep(3000);
  }
  throw new Error(`Failed after ${maxRetries} attempts`);
}

function parseXML(xml) {
  const out = {};
  const items = xml.match(/<item\s[^>]*type="boardgame"[\s\S]*?<\/item>/g) || [];
  console.log(`  Parsed ${items.length} items from XML`);
  for (const item of items) {
    const id = parseInt((item.match(/\sid="(\d+)"/) || [])[1]);
    if (!id) continue;
    let thumb = ((item.match(/<thumbnail>([^<]+)<\/thumbnail>/) || [])[1] || '').trim();
    if (thumb && !thumb.startsWith('http')) thumb = 'https:' + thumb;
    const rating = (item.match(/<average[^>]*value="([^"]+)"/) || [])[1];
    const minP   = (item.match(/<minplayers[^>]*value="([^"]+)"/) || [])[1] || '?';
    const maxP   = (item.match(/<maxplayers[^>]*value="([^"]+)"/) || [])[1] || '?';
    out[id] = { thumbnail: thumb, rating: rating ? parseFloat(rating).toFixed(1) : 'N/A', minPlayers: minP, maxPlayers: maxP };
  }
  return out;
}

async function main() {
  console.log(`\n=== BGG Image Fetcher ===`);
  console.log(`Games to process: ${GAMES.length}`);
  const ids    = [...new Set(GAMES.map(g => g.bgg_id))];
  const chunks = [];
  for (let i = 0; i < ids.length; i += 20) chunks.push(ids.slice(i, i + 20));
  console.log(`Unique IDs: ${ids.length}, Chunks: ${chunks.length}\n`);

  const bggMap = {};
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`\n-- Chunk ${i+1}/${chunks.length} --`);
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${chunk.join(',')}&stats=1&type=boardgame`;
    try {
      const xml = await fetchBGGXml(url);
      Object.assign(bggMap, parseXML(xml));
      console.log(`  Running total: ${Object.keys(bggMap).length} games`);
    } catch(e) { console.error(`  CHUNK FAILED: ${e.message}`); }
    if (i < chunks.length - 1) await sleep(2000);
  }
  console.log(`\n=== Metadata: ${Object.keys(bggMap).length}/${ids.length} games ===\n`);

  const seen = new Set();
  const enriched = [];
  let downloaded = 0, skipped = 0, failed = 0;

  for (const g of GAMES) {
    const bgg = bggMap[g.bgg_id] || {};
    let localImg = '';
    if (bgg.thumbnail) {
      const ext = (bgg.thumbnail.match(/\.(jpe?g|png|gif|webp)/i) || ['','jpg'])[1];
      const filename = `${g.bgg_id}.${ext}`;
      const dest = path.join(IMG_DIR, filename);
      localImg = `/images/${filename}`;
      if (!seen.has(g.bgg_id)) {
        seen.add(g.bgg_id);
        if (fs.existsSync(dest)) { console.log(`  SKIP: ${g.name}`); skipped++; }
        else {
          try {
            const buf = await getBinary(bgg.thumbnail);
            fs.writeFileSync(dest, buf);
            console.log(`  ✓ ${g.name} (${buf.length} bytes)`);
            downloaded++;
            await sleep(250);
          } catch(e) { console.error(`  ✗ ${g.name}: ${e.message}`); failed++; localImg = ''; }
        }
      }
    } else { console.log(`  NO IMAGE: ${g.name}`); }
    enriched.push({ ...g, thumbnail: localImg, rating: bgg.rating || 'N/A', minPlayers: bgg.minPlayers || '?', maxPlayers: bgg.maxPlayers || '?' });
  }

  console.log(`\n=== Done: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed ===`);
  fs.writeFileSync('games-data.json', JSON.stringify(enriched, null, 2));
  console.log('✅ games-data.json written');
}

main().catch(e => { console.error('\n❌ FATAL:', e); process.exit(1); });
