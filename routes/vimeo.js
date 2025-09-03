const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

function getVimeoId(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const m = u.pathname.match(/(\d{6,})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// Assumes `axios` is already required at top of file

async function fetchPlayerConfig(urlOrId) {
  // -- extract numeric Vimeo ID from many URL variants or accept plain ID --
  let videoId = null;
  const raw = String(urlOrId || "").trim();

  if (/^\d+$/.test(raw)) {
    videoId = raw;
  } else {
    try {
      const u = new URL(raw);
      const path = u.pathname || "";

      // try several path patterns
      const patterns = [
        /\/video\/(\d+)/,                  // /video/123456
        /\/channels\/[^\/]+\/(\d+)/,       // /channels/name/123456
        /\/album\/\d+\/video\/(\d+)/,      // /album/123/video/123456
        /\/(\d+)(?:\/|$)/,                 // /123456 or /123456/
      ];

      for (const p of patterns) {
        const m = path.match(p);
        if (m) { videoId = m[1]; break; }
      }

      // fallback: search entire URL for a long digit sequence
      if (!videoId) {
        const m2 = raw.match(/(\d{6,})/);
        if (m2) videoId = m2[1];
      }
    } catch (e) {
      // not a valid URL — try to pull digits
      const m = raw.match(/(\d{6,})/);
      if (m) videoId = m[1];
    }
  }

  if (!videoId) throw new Error("Unable to extract Vimeo ID from the provided URL/ID");

  const playerUrl = `https://player.vimeo.com/video/${videoId}`;

  // -- fetch player page HTML --
  const resp = await axios.get(playerUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Referer: "https://vimeo.com/",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    },
    timeout: 15000,
    maxContentLength: 20 * 1024 * 1024,
    maxBodyLength: 20 * 1024 * 1024
  });

  const html = resp.data || "";

  // -- locate a config-like token in the HTML --
  const possibleKeys = [
    "window.playerConfig",
    "window.config",
    "var config =",
    "player.config",
    "playerConfig ="
  ];

  let pos = -1;
  let foundKey = null;
  for (const key of possibleKeys) {
    pos = html.indexOf(key);
    if (pos !== -1) {
      foundKey = key;
      break;
    }
  }

  if (pos === -1) {
    throw new Error("playerConfig not found in player page HTML");
  }

  // -- find beginning of JSON object (first '{' after the found key) --
  const startIdx = html.indexOf("{", pos);
  if (startIdx === -1) throw new Error("Could not find start of playerConfig JSON");

  // -- brace-matching parser that ignores braces inside strings/escapes --
  let i = startIdx;
  let depth = 0;
  let inString = false;
  let stringChar = null;
  let escaped = false;

  for (; i < html.length; i++) {
    const ch = html[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === stringChar) {
        inString = false;
        stringChar = null;
      }
      continue;
    } else {
      if (ch === '"' || ch === "'") {
        inString = true;
        stringChar = ch;
        continue;
      }
      if (ch === "{") {
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0) {
          i++; // include this closing brace
          break;
        }
      }
    }
  }

  if (depth !== 0) {
    throw new Error("Failed to parse playerConfig JSON (unbalanced braces)");
  }

  const jsonText = html.slice(startIdx, i);

  // parse JSON
  try {
    const playerConfig = JSON.parse(jsonText);
    return playerConfig;
  } catch (e) {
    // include a short excerpt to help debugging
    const excerpt = jsonText.slice(0, 2000);
    throw new Error("Failed to JSON.parse playerConfig: " + e.message + " — excerpt: " + excerpt);
  }
}



router.get("/vimeo", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Video URL is required" });

  try {
    const id = getVimeoId(url);
    if (!id) return res.status(400).json({ error: "Invalid Vimeo URL" });

    const cfg = await fetchPlayerConfig(id);

    const video = cfg.video || {};
    const files = cfg.request?.files || {};

    // DASH / HLS sources
    const dashCdn = files.dash?.cdns?.[files.dash.default_cdn] || {};
    const hlsCdn = files.hls?.cdns?.[files.hls.default_cdn] || {};

    // Qualities from DASH streams
    const qualities = (files.dash?.streams || []).map(s => ({
      quality: s.quality,
      fps: s.fps,
    }));

    return res.json({
      id: video.id,
      title: video.title,
      duration: video.duration,
      thumbnail: video.thumbnail_url,
      owner: video.owner?.name,
      qualities,
      dash: dashCdn.avc_url || dashCdn.url,
      hls: hlsCdn.avc_url || hlsCdn.url,
      note: "Direct .mp4 not available; use HLS/DASH URL with a player or download via ffmpeg.",
    });
  } catch (err) {
    console.error("Vimeo route error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;