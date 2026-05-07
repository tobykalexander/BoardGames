// scripts/download-images.js
// Downloads each game's BGG thumbnail to /images/picXXX.ext in this repo,
// then rewrites games-data.json to reference the local path. Once committed,
// images are served from Vercel's static hosting alongside index.html — no
// runtime dependency on BGG's CDN, no hotlink protection issues, no proxy.
//
// Idempotent: if a local image already exists, the download is skipped.
// Tries multiple Referer strategies per image, since BGG's hotlink rules
// vary depending on path/transform.

import {
  readFile, writeFile, mkdir, access, stat,
} from 'node:fs/promises';
import { constants as F } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, 'games-data.json');
const IMAGES_DIR = path.join(ROOT, 'images');
const POLITE_DELAY_MS = 250;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fileExists(p) {
  try { await access(p, F.F_OK); return true; }
  catch { return false; }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Pull picXXX.ext out of any of the URL shapes we've seen
function extractPicFile(thumbnail) {
  if (!thumbnail) return null;
  const m = /\/(pic\d+\.[a-zA-Z]+)(?:[?#].*)?$/.exec(thumbnail);
  return m ? m[1] : null;
}

// Build a list of URLs worth trying, in order of preference
function candidateUrls(thumbnail, picFile) {
  const urls = [];
  // 1. Original thumbnail value if it's already a full https URL
  if (thumbnail && /^https?:\/\//.test(thumbnail)) urls.push(thumbnail);
  // 2. Simple unsigned canonical URL from picID
  urls.push(`https://cf.geekdo-images.com/images/${picFile}`);
  return [...new Set(urls)];
}

// Try a single URL with several Referer strategies
async function tryDownload(url) {
  const referers = [
    'https://boardgamegeek.com/',
    null,                    // no Referer
    'https://www.boardgamegeek.com/',
  ];
  for (const ref of referers) {
    const headers = {
      'User-Agent': UA,
      Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',
    };
    if (ref) headers.Referer = ref;
    try {
      const res = await fetch(url, { headers, redirect: 'follow' });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 0) {
          return { ok: true, buf, refUsed: ref || '(none)' };
        }
        console.log(`    [ref=${ref || 'none'}] 200 but empty body`);
      } else {
        console.log(`    [ref=${ref || 'none'}] HTTP ${res.status}`);
      }
    } catch (err) {
      console.log(`    [ref=${ref || 'none'}] ${err.message}`);
    }
  }
  return { ok: false };
}

async function downloadOne(game) {
  const picFile = extractPicFile(game.thumbnail);
  if (!picFile) {
    console.warn(`! ${game.name}: cannot parse picID from "${game.thumbnail}"`);
    return { status: 'failed' };
  }

  const localPath = path.join(IMAGES_DIR, picFile);
  const localUrl = '/images/' + picFile;

  // Idempotency: if already downloaded, just point to it
  if (await fileExists(localPath)) {
    const s = await stat(localPath);
    if (s.size > 0) {
      game.thumbnail = localUrl;
      return { status: 'cached' };
    }
  }

  const urls = candidateUrls(game.thumbnail, picFile);
  for (const url of urls) {
    console.log(`  trying ${url}`);
    const result = await tryDownload(url);
    if (result.ok) {
      await writeFile(localPath, result.buf);
      game.thumbnail = localUrl;
      console.log(`  ✓ saved ${result.buf.length} bytes (Referer: ${result.refUsed})`);
      return { status: 'downloaded' };
    }
  }
  console.warn(`  ✗ all candidates failed for ${game.name}`);
  return { status: 'failed' };
}

async function main() {
  const raw = await readFile(DATA_FILE, 'utf8');
  const games = JSON.parse(raw);
  if (!Array.isArray(games)) throw new Error('games-data.json is not an array');

  await mkdir(IMAGES_DIR, { recursive: true });
  console.log(`Processing ${games.length} games...\n`);

  const counts = { downloaded: 0, cached: 0, failed: 0 };
  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    console.log(`[${i + 1}/${games.length}] ${g.name}`);
    const { status } = await downloadOne(g);
    counts[status]++;
    if (status === 'downloaded') await sleep(POLITE_DELAY_MS);
  }

  await writeFile(DATA_FILE, JSON.stringify(games, null, 2) + '\n');

  console.log(`\nDone. Downloaded: ${counts.downloaded}  Cached: ${counts.cached}  Failed: ${counts.failed}`);
  if (counts.failed > 0) {
    console.error(`\n${counts.failed} downloads failed. Their thumbnails were left unchanged.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
