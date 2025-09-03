const express = require("express");
const facebook = require("rahad-media-downloader");

const router = express.Router();

// GET endpoint: /api/facebook?url=<tiktok-video-link>
router.get("/facebook", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
     const result = await facebook.rahadfbdl(url);
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