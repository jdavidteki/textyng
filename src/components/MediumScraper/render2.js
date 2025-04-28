const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

puppeteer.use(StealthPlugin());
const app = express();
const PORT = 3001;

app.use(cors());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.get("/render", async (req, res) => {
  const { url } = req.query;

  if (!url || !url.startsWith("http")) {
    return res.status(400).send("Invalid URL");
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

    console.log("🌐 Navigating to", url);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });

    // Wait, scroll and refresh until tweets load or max attempts
    let found = false;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 6; j++) {
        const iframeCount = await page.evaluate(() => {
          return document.querySelectorAll('iframe[src*="platform.twitter.com/embed/Tweet.html"]').length;
        });

        console.log(`🔍 Attempt ${i + 1}.${j + 1}: Found ${iframeCount} Twitter iframe(s)`);

        if (iframeCount > 0) {
          found = true;
          break;
        }

        await page.evaluate(() => {
          window.scrollBy(0, 500);
        });
        console.log("🖱 Scrolled down");

        await sleep(10000); // wait 10 seconds
      }

      if (found) break;

      console.log("🔄 Refreshing page");
      await page.reload({ waitUntil: "networkidle2", timeout: 120000 });
    }

    // Take a screenshot to verify what loaded
    const screenshotPath = path.join(__dirname, "screenshot-after-refresh.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log("📸 Screenshot taken at:", screenshotPath);

    const tweetLinks = await page.evaluate(() => {
      const iframes = Array.from(document.querySelectorAll('iframe[src*="platform.twitter.com/embed/Tweet.html"]'));
      return iframes.map((iframe) => iframe.src);
    });

    await browser.close();

    console.log(`✅ Scraped ${tweetLinks.length} Twitter embed link(s)`);
    res.json({ tweetLinks });
  } catch (err) {
    console.error("❌ Render error:", err);
    res.status(500).send("Render error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Render server running at http://localhost:${PORT}`);
});

