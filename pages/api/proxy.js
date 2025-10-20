// pages/api/proxy.js
// Simple proxy to stream remote media and set Content-Disposition for filename

const fetch = require('node-fetch');

export default async function handler(req, res) {
  try {
    const u = (req.query.u || '').trim();
    const fn = (req.query.fn || '').trim() || 'VectorDigital';
    if (!u) return res.status(400).send('Missing u param');

    const target = decodeURIComponent(u);
    const r = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36',
        'Accept': '*/*'
      }
    });

    if (!r.ok) return res.status(502).send('Bad Gateway');

    const contentType = r.headers.get('content-type') || 'application/octet-stream';
    const buffer = await r.buffer();

    res.setHeader('Content-Type', contentType);
    // set Content-Disposition for forced download
    const dispositionName = fn.includes('.') ? fn : (fn + (contentType.includes('audio') ? '.mp3' : (contentType.includes('video') ? '.mp4' : '')));
    res.setHeader('Content-Disposition', `attachment; filename="${dispositionName}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (err) {
    console.error('proxy error', err);
    res.status(500).send('Internal server error');
  }
}
