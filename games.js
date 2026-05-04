import https from 'https';
import { parseStringPromise } from 'xml2js';

// Read game list from local JSON
import gamesData from '../games.json' assert { type: 'json' };

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'BGGCatalog/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function fetchBGGData(ids) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(',')}&stats=1&type=boardgame`;
  const xml = await fetchUrl(url);
  const parsed = await parseStringPromise(xml, { explicitArray: false });
  const items = parsed?.items?.item;
  if (!items) return {};
  const arr = Array.isArray(items) ? items : [items];
  const result = {};
  for (const item of arr) {
    const id = parseInt(item.$.id);
    let thumbnail = item.thumbnail || '';
    if (thumbnail && !thumbnail.startsWith('http')) thumbnail = 'https:' + thumbnail;
    const stats = item.statistics?.ratings;
    const rating = parseFloat(stats?.average?.$?.value || 0).toFixed(1);
    const minPlayers = item.minplayers?.$?.value || '?';
    const maxPlayers = item.maxplayers?.$?.value || '?';
    result[id] = { thumbnail, rating, minPlayers, maxPlayers };
  }
  return result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  try {
    // Deduplicate IDs
    const uniqueIds = [...new Set(gamesData.map(g => g.bgg_id))];
    // Fetch in batches of 20
    const chunks = [];
    for (let i = 0; i < uniqueIds.length; i += 20) chunks.push(uniqueIds.slice(i, i + 20));
    const bggMap = {};
    for (const chunk of chunks) {
      const data = await fetchBGGData(chunk);
      Object.assign(bggMap, data);
    }
    // Merge BGG data into games list
    const enriched = gamesData.map(g => ({
      ...g,
      thumbnail: bggMap[g.bgg_id]?.thumbnail || '',
      rating: bggMap[g.bgg_id]?.rating || 'N/A',
      minPlayers: bggMap[g.bgg_id]?.minPlayers || '?',
      maxPlayers: bggMap[g.bgg_id]?.maxPlayers || '?',
    }));
    res.status(200).json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch BGG data', detail: err.message });
  }
}
