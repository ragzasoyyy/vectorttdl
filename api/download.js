// api/download.js
// Serverless function untuk Vercel /api/download?url=<tiktok-url>
// Mengambil metadata dari halaman TikTok (SIGI_STATE) dan mengembalikan direct urls untuk video/photo/music

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const url = (req.query.url || req.body && req.body.url || '').trim();
    if (!url) return res.status(400).json({ error: 'Missing url parameter. Use /api/download?url=<tiktok-url>' });

    // Normalize TikTok url (ensure http(s)://)
    const target = url.startsWith('http') ? url : `https://${url}`;

    const resp = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
    });

    const html = await resp.text();

    // Try to extract JSON in <script id="SIGI_STATE">...</script>
    const sigiMatch = html.match(/<script id="SIGI_STATE" type="application\/json">([\s\S]*?)<\/script>/);
    let state = null;
    if (sigiMatch && sigiMatch[1]) {
      try {
        state = JSON.parse(sigiMatch[1]);
      } catch (e) {
        // ignore parse error
      }
    }

    // Fallback: search for 'window.__INIT_PROPS' or 'window['SIGI_STATE']'
    if (!state) {
      const windowMatch = html.match(/window\.__INIT_PROPS\s*=\s*({[\s\S]*?});\s*window/);
      if (windowMatch && windowMatch[1]) {
        try { state = JSON.parse(windowMatch[1]); } catch (e) {}
      }
    }

    if (!state) {
      return res.status(500).json({ error: 'Failed to parse TikTok page JSON' });
    }

    // Try to find the item data (ItemModule or ItemList)
    let item = null;

    if (state && state.ItemModule) {
      const keys = Object.keys(state.ItemModule);
      if (keys.length) item = state.ItemModule[keys[0]];
    }

    // Another possible path
    if (!item && state && state.ItemList) {
      const listKeys = Object.keys(state.ItemList);
      if (listKeys.length) {
        const first = state.ItemList[listKeys[0]];
        if (first && first.length && state.ItemModule && state.ItemModule[first[0]]) {
          item = state.ItemModule[first[0]];
        }
      }
    }

    if (!item) {
      // last resort: try to find JSON in 'application/json' segments
      return res.status(500).json({ error: 'Could not locate video item data in page' });
    }

    // Extract data
    const author = item.author || item.authorName || (item.author && item.author.uniqueId) || null;
    const description = item.desc || item.description || '';

    // Video object
    const video = item.video || {};
    // playAddr often contains watermark version; downloadAddr or the 'urls' may contain real direct urls
    const urls = (video && video.downloadAddr) ? [video.downloadAddr] : (video && video.playAddr ? [video.playAddr] : []);

    // Also some versions have 'urls' array
    if (video && Array.isArray(video.urls) && video.urls.length) {
      urls.unshift(...video.urls);
    }

    // Reduce duplicates
    const uniqueUrls = [...new Set(urls)].slice(0, 5);

    // Music
    const music = item.music || null;
    const musicInfo = music ? {
      id: music.mid || music.id || null,
      title: music.title || music.musicName || null,
      author: music.authorName || music.artist || null,
      music_url: music.playUrl || music.downloadUrl || null
    } : null;

    // Image / slides
    const images = [];
    if (item.imageUrl) images.push(item.imageUrl);
    if (item.images && Array.isArray(item.images)) images.push(...item.images);

    const result = {
      source: target,
      author,
      description,
      video: {
        urls: uniqueUrls
      },
      music: musicInfo,
      images: images,
      raw_item: item
    };

    return res.json(result);

  } catch (err) {
    console.error('download error', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Internal server error', details: String(err && err.message ? err.message : err) });
  }
};
