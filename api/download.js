// api/download.js
// VectorDownloader — Stable TikTok API with File Naming
// © VectorDigital 2025

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

module.exports = async (req, res) => {
  try {
    const inputUrl =
      (req.query.url || (req.body && req.body.url) || "").trim();
    if (!inputUrl)
      return res.status(400).json({
        status: false,
        message: "Missing parameter ?url=<tiktok-link>",
      });

    const url = inputUrl.startsWith("http") ? inputUrl : `https://${inputUrl}`;

    // --- Ambil data dari TikWM API ---
    const api = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36",
      },
      body: new URLSearchParams({ url }),
    });

    const data = await api.json();
    if (!data || !data.data)
      return res.status(500).json({
        status: false,
        message: "Failed to fetch TikTok video data",
        raw: data,
      });

    const d = data.data;
    const result = {
      status: true,
      source: url,
      description: d.title || "",
      author: d.author?.nickname || "",
      region: d.region,
      video: {
        filename: "VectorDigital.mp4",
        no_watermark: d.play,
        with_watermark: d.wmplay,
        hd: d.hdplay,
        cover: d.cover,
      },
      music: {
        filename: "VectorDigital.mp3",
        title: d.music_info?.title,
        author: d.music_info?.author,
        play_url: d.music_info?.play,
      },
      images: d.images || [],
      via: "tikwm.com",
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("Error TikTok Downloader:", err);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      details: err.message,
    });
  }
};
