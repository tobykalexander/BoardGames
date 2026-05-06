// api/bgg-img/index.js
// Vercel serverless function: proxy BoardGameGeek images so the browser
// doesn't hit the hotlink-protected cf.geekdo-images.com CDN directly.
// BGG returns 403 Forbidden when images are requested with a Referer
// other than boardgamegeek.com. This proxy fetches the image server-side
// with the right Referer and streams it back to the browser.

const ALLOWED_HOSTS = new Set([
  'cf.geekdo-images.com',
  'boardgamegeek.com',
  'www.boardgamegeek.com',
]);

export default async function handler(req, res) {
  const raw = req.query.url;
  if (!raw) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Normalize protocol-relative URLs like //cf.geekdo-images.com/...
  let target = decodeURIComponent(raw);
  if (target.startsWith('//')) target = 'https:' + target;

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return res.status(403).json({ error: 'Host not allowed' });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        // The header BGG's CDN checks for hotlink protection
        Referer: 'https://boardgamegeek.com/',
        'User-Agent':
          'Mozilla/5.0 (compatible; BoardGameCatalog/1.0; +https://board-games-sigma.vercel.app)',
        Accept:
          'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: 'Upstream fetch failed', status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    // Cache aggressively at Vercel's edge - BGG art rarely changes
    res.setHeader(
      'Cache-Control',
      'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800'
    );
    return res.status(200).send(buf);
  } catch (err) {
    return res.status(502).json({ error: 'Fetch failed', message: String(err) });
  }
}
