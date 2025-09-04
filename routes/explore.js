const express = require("express");
const puppeteer = require("puppeteer");

const router = express.Router();

async function scrapeCategoriesAndVideos() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Go to Explore page
  await page.goto("https://www.tiktok.com/explore", {
    waitUntil: "networkidle2",
  });

  // Get categories (buttons inside #category-list-container)
  const categories = await page.evaluate(() => {
    const container = document.querySelector("#category-list-container");
    if (!container) return [];

    return Array.from(container.querySelectorAll("button")).map((btn, index) => ({
      title: btn.innerText.trim(),
      index, // keep track of button index
    }));
  });

  const results = [];

  for (const cat of categories) {
    // Re-select category buttons
    const buttons = await page.$$("#category-list-container button");
    const button = buttons[cat.index];
    if (!button) continue;

    // Click category button
    await button.click();

    // Wait for videos container to update
    await page.waitForSelector('[data-e2e="explore-item-list"] [data-e2e="explore-item"]', {
      timeout: 15000,
    });

    // Scrape videos for this category
    const videos = await page.evaluate((categoryTitle) => {
      const items = document.querySelectorAll(
        '[data-e2e="explore-item-list"] [data-e2e="explore-item"]'
      );

      return Array.from(items).map((item) => {
        const anchor = item.querySelector("a[href*='/video/']");
        const img = item.querySelector("img[alt]");
        return {
          title: (img?.alt || anchor?.innerText || "Untitled").trim(),
          url: anchor ? anchor.href : null,
          category: categoryTitle,
        };
      });
    }, cat.title);

    results.push(...videos);
  }

  await browser.close();
  return results;
}

// API route
router.get("/explore", async (req, res) => {
  try {
    const data = await scrapeCategoriesAndVideos();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;