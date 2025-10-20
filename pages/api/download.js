// pages/api/download.js
// Stable backend using TikWM API

const fetch = require('node-fetch');

export default async function handler(req, res) {
  try {
    const inputUrl = (req.query.url || (req.body && req.body.url) || '').trim();
    if (!inputUrl) return res.status(400).json({ status:false, message: 'Missing url param' });
    const url = inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`;

    // Use tikwm to get stable JSON
    const apiRes = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36'
      },
      body: new URLSearchParams({ url })
    });

    const json = await apiRes.json();
    if (!json || !json.data) return res.status(500).json({ status:false, message: 'Failed to fetch data', raw: json });

    const d = json.data;
    const result = {
      status: true,
      source: url,
      description: d.title || '',
      author: d.author?.nickname || '',
      video: {
        filename: 'VectorDigital.mp4',
        no_watermark: d.play || null,
        with_watermark: d.wmplay || null,
        hd: d.hdplay || null,
        cover: d.cover || null
      },
      music: {
        filename: 'VectorDigital.mp3',
        title: d.music_info?.title || null,
        author: d.music_info?.author || null,
        play_url: d.music || d.music_info?.play || null
      },
      images: d.images || []
    };

    res.status(200).json(result);
  } catch (err) {
    console.error('download api error', err);
    res.status(500).json({ status:false, message: 'Internal server error', details: err.message });
  }
}
