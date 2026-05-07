// scripts/refresh-thumbnails.js
// Reads games-data.json, queries BGG's XML API for each entry's bgg_id,
// and rewrites the `thumbnail` field with the fresh, simple URL BGG returns
// (e.g. https://cf.geekdo-images.com/images/pic12345_t.jpg).
//
// Why: the existing thumbnails are signed Thumbor URLs scraped from BGG's
// website. BGG rotates the HMAC key those URLs depend on, so they go stale
// and start returning HTTP 400 ("bad signature"). The simple /images/picXXX
// URLs from the XML API don't have signatures and don't go stale.
//
// Run via the "Refresh BGG thumbnails" GitHub Actions workflow.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, 'games-data.json');
const BATCH_SIZE = 20;          // BGG accepts batched ?id=1,2,3,... requests
const RETRY_DELAY_MS = 2000;    // BGG returns 202 while it builds the response
const MAX_RETRIES = 6;
const POLITE_DELAY_MS = 800;    // brief pause between batches to be nice

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchBatch(ids) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(',')}`;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'BoardGameCatalog/1.0 (+https://github.com/tobykalexander/BoardGames)',
        Accept: 'application/xml, text/xml',
      },
    });
    if (res.status === 202) {
      // BGG is still building the response â wait and retry
      await sleep(RETRY_DELAY_MS);
      continue;
    }
    if (!res.ok) {
      throw new Error(`BGG API ${res.status} for ids=${ids.join(',')}`);
    }
    return res.text();
  }
  throw new Error(`BGG API still returning 202 after ${MAX_RETRIES} retries`);
}

// Parse <item id="..."> ... <thumbnail>URL</thumbnail> ... </item>
// Tolerant of attribute ordering / extra whitespace; no real XML parser needed.
function extractThumbnails(xml) {
  const out = new Map();
  const itemRe =
    /<item\b[^>]*\bid="(\d+)"[^>]*>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml))) {
    const id = Number(m[1]);
    const inner = m[2];
    const tm = /<thumbnail>([\s\S]*?)<\/thumbnail>/.exec(inner);
    if (tm) {
      let url = tm[1].trim();
      if (url.startsWith('//')) url = 'https:' + url;
      // BGG sometimes returns http://; normalize to https
      url = url.replace(/^http:\/\//, 'https://');
      out.set(id, url);
    }
  }
  return out;
}

async function main() {
  const raw = await readFile(DATA_FILE, 'utf8');
  const games = JSON.parse(raw);
  if (!Array.isArray(games)) {
    throw new Error('games-data.json is not an array');
  }
  console.log(`Loaded ${games.length} games.`);

  const ids = [...new Set(
    games
      .map(g => Number(g.bgg_id))
      .filter(n => Number.isFinite(n) && n > 0)
  )];
  console.log(`${ids.length} unique BGG IDs to refresh.`);

  const idToThumb = new Map();
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    console.log(
      `Fetching batch ${i / BATCH_SIZE + 1}/${Math.ceil(ids.length / BATCH_SIZE)} (${batch.length} ids)`
    );
    const xml = await fetchBatch(batch);
    const map = extractThumbnails(xml);
    for (const [k, v] of map) idToThumb.set(k, v);
    if (i + BATCH_SIZE < ids.length) await sleep(POLITE_DELAY_MS);
  }

  let updated = 0;
  let missing = 0;
  for (const g of games) {
    const fresh = idToThumb.get(Number(g.bgg_id));
    if (!fresh) {
      missing++;
      console.warn(`No thumbnail found via API for id=${g.bgg_id} (${g.name})`);
      continue;
    }
    if (g.thumbnail !== fresh) {
      g.thumbnail = fresh;
      updated++;
    }
  }
  console.log(
    `Refreshed ${updated} thumbnails. ${missing} missing. ${games.length - updated - missing} unchanged.`
  );

  // Preserve trailing newline; pretty-print with 2-space indent
  await writeFile(DATA_FILE, JSON.stringify(games, null, 2) + '\n');
  console.log(`Wrote ${DATA_FILE}.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
