// api/proxy.js
// Proxy endpoint untuk streaming file (untuk menghindari CORS / agar user bisa klik "download")
// Usage: /api/proxy?u=<encoded_direct_url>

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const u = (req.query.u || '').trim();
    if (!u) return res.status(400).send('Missing u param');

    const target = decodeURIComponent(u);
    const r = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36',
        'Accept': '*/*'
      }
    });

    // Forward status and headers (some headers excluded)
    res.status(r.status);
    const contentType = r.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    const contentLength = r.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    const buffer = await r.buffer();
    res.send(buffer);
  } catch (err) {
    console.error('proxy error', err);
    res.status(500).send('proxy error');
  }
};
