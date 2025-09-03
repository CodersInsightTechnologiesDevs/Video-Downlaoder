const express = require("express");
const ytdlp = require("yt-dlp-exec");

const router = express.Router();

router.get("/snackvideo", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Video URL is required" });
  }

  try {
    // Fetch metadata + formats
    const info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true
    });    

    if(info._type !== "video"){
        return res.status(400).json({ error: "Video URL is required" });
    }

    return res.json({
        title: info.title,
        thumbnail : info.thumbnail,
        url : info.url
    });
  } catch (err) {
    console.error("Snack Video fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch Snack video" });
  }
});

module.exports = router;