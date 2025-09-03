const express = require("express");
const ytdlp = require("yt-dlp-exec");

const router = express.Router();

router.get("/dailymotion", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Video URL is required" });
  }

  try {
    // Fetch metadata + formats
    const info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ["referer: https://www.dailymotion.com/"], // sometimes required
    });

    // Filter only MP4 formats with direct URLs
    const mp4Formats = info.formats
      .filter(f => f.ext === "mp4")
      .map(f => ({
        quality: f.format_note || f.height + "p", // e.g. 360p, 720p
        resolution: f.height ? `${f.height}p` : "audio",
        filesize: f.filesize || null, // some formats don't provide this
        mime: f.ext,
        url: f.manifest_url, // direct link
      }));

      console.log("Formats",mp4Formats);
      

    // Remove duplicates (sometimes yt-dlp returns duplicates of same quality)
    const uniqueFormats = Array.from(
      new Map(mp4Formats.map(f => [f.quality, f])).values()
    );

    console.log("Remove Duplicate",uniqueFormats);
    

    return res.json({
      title: info.title,
      duration: info.duration_string,
      thumbnail: info.thumbnails,
      qualities: uniqueFormats, // all available MP4 links
    });
  } catch (err) {
    console.error("Dailymotion fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch Dailymotion video" });
  }
});

module.exports = router;

