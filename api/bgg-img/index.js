// api/bgg-img/index.js
// Vercel serverless function: proxy BoardGameGeek images.
// Uses ?url=<encoded full URL> rather than path segments because Vercel's
// path-to-regexp router chokes on the : ( ) characters in real BGG URLs
// (e.g. "filters:no_upscale():strip_icc()") even for catch-all routes.

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
        Referer: 'https://boardgamegeek.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
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
    res.setHeader(
      'Cache-Control',
      'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800'
    );
    return res.status(200).send(buf);
  } catch (err) {
    return res.status(502).json({ error: 'Fetch failed', message: String(err) });
  }
}
