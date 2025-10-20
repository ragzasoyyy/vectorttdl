// api/download.js
// VectorDownloader — fix fallback TikWM (anti error JSON parse)

const fetch = require("node-fetch");

module.exports = async (req, res) => {
  try {
    const url =
      (req.query.url || (req.body && req.body.url) || "").trim();
    if (!url)
      return res
        .status(400)
        .json({ error: "Missing url parameter. Use /api/download?url=<tiktok-url>" });

    const target = url.startsWith("http") ? url : `https://${url}`;

    // --- Step 1: coba parse SIGI_STATE seperti biasa ---
    const resp = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const html = await resp.text();

    let item = null;
    const sigiMatch = html.match(
      /<script id="SIGI_STATE" type="application\/json">([\s\S]*?)<\/script>/
    );

    if (sigiMatch && sigiMatch[1]) {
      try {
        const state = JSON.parse(sigiMatch[1]);
        if (state.ItemModule) {
          const keys = Object.keys(state.ItemModule);
          if (keys.length) item = state.ItemModule[keys[0]];
        }
      } catch {}
    }

    // --- Step 2: fallback ke API TikWM kalau gagal ---
    if (!item) {
      const tikwm = await fetch("https://www.tikwm.com/api/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36",
        },
        body: new URLSearchParams({ url: target }),
      });
      const tikwmData = await tikwm.json();

      if (tikwmData && tikwmData.data) {
        const d = tikwmData.data;
        const result = {
          source: target,
          author: d.author && d.author.nickname,
          description: d.title || "",
          video: {
            urls: [d.play || d.wmplay].filter(Boolean),
          },
          music: {
            title: d.music_info && d.music_info.title,
            author: d.music_info && d.music_info.author,
            music_url: d.music || (d.music_info && d.music_info.play),
          },
          images: d.images || [],
          via: "tikwm",
        };
        return res.json(result);
      }
    }

    // --- Step 3: kalau item ditemukan dari SIGI_STATE ---
    if (item) {
      const video = item.video || {};
      const urls = [];
      if (video.downloadAddr) urls.push(video.downloadAddr);
      if (video.playAddr) urls.push(video.playAddr);
      if (video.urls && Array.isArray(video.urls))
        urls.push(...video.urls);
      const uniqueUrls = [...new Set(urls)].slice(0, 5);

      const music = item.music || {};
      const musicInfo = {
        title: music.title || "",
        author: music.authorName || "",
        music_url: music.playUrl || music.downloadUrl || null,
      };

      const result = {
        source: target,
        author: item.author || "",
        description: item.desc || "",
        video: { urls: uniqueUrls },
        music: musicInfo,
        images: item.images || [],
        via: "sigi",
      };

      return res.json(result);
    }

    // --- Jika tetap gagal ---
    return res.status(500).json({
      error: "Failed to extract video info from TikTok",
    });
  } catch (err) {
    console.error("download error", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
};
