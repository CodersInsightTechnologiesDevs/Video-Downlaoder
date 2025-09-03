const express = require("express");
const instagram = require("rahad-media-downloader");

const router = express.Router();

// GET endpoint: /api/instagram?url=<tiktok-video-link>
router.get("/instagram", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
     const result = await instagram.rahadinsta(url);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error downloading video:", error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;