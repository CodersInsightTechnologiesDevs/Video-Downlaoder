const express = require("express");
const tik = require("rahad-media-downloader");

const router = express.Router();

// GET endpoint: /api/tiktok?url=<tiktok-video-link>
router.get("/tiktok", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "TikTok URL is required" });
  }

  try {
    const result = await tik.rahadtikdl(url);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error downloading TikTok video:", error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
