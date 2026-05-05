export default async function handler(req, res) {
  const pathSegments = req.query.path;
  const path = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

  const upstream = `https://cf.geekdo-images.com/${path}`;

  try {
    const response = await fetch(upstream, {
      headers: {
        'Referer': 'https://boardgamegeek.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      return res.status(response.status).end();
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache for 1 day
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).end();
  }
}
