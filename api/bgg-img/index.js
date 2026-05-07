// api/bgg-img/index.js
const ALLOWED_HOSTS = new Set([
  'cf.geekdo-images.com',
  'boardgamegeek.com',
  'www.boardgamegeek.com',
]);

export default async function handler(req, res) {
  const raw = req.query.url;
  if (!raw) return res.status(400).json({ error: 'Missing url parameter' });

  // Vercel already decoded the query param. Don't run it through new URL()
  // again — that can renormalize characters like = : ( ) and break BGG's
  // Thumbor signature in the path.
  let target = String(raw);
  if (target.startsWith('//')) target = 'https:' + target;

  const m = target.match(/^https?:\/\/([^\/?#]+)/);
  if (!m || !ALLOWED_HOSTS.has(m[1].toLowerCase())) {
    return res.status(403).json({ error: 'Host not allowed' });
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        Referer: 'https://boardgamegeek.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      // Diagnostic: surface what we actually sent and what BGG said back
      const body = await upstream.text().catch(() => '');
      return res.status(upstream.status).json({
        error: 'Upstream fetch failed',
        status: upstream.status,
        triedUrl: target,
        upstreamBody: body.slice(0, 500),
      });
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') || 'image/jpeg'
    );
    res.setHeader(
      'Cache-Control',
      'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800'
    );
    return res.status(200).send(buf);
  } catch (err) {
    return res.status(502).json({ error: 'Fetch failed', message: String(err) });
  }
}
