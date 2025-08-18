const puppeteer = require("puppeteer");
const Rawjobdata = require("../models/Rawjobdata");

async function scrapeTanitJobs(listingUrl) {
  const browser = await puppeteer.launch({
    headless: false, // show browser
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  // Go to the listing page
  await page.goto(listingUrl, { waitUntil: "networkidle2" });
  await page.waitForSelector("article.listing-item");

  // Get all job links (Voir Plus)
  const jobLinks = await page.$$eval(
    "article.listing-item .media-heading a.link",
    links => links.map(link => link.href)
  );

  console.log(`Found ${jobLinks.length} jobs`);

  for (const link of jobLinks) {
    try {
      const jobPage = await browser.newPage();
      await jobPage.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      );

      await jobPage.goto(link, { waitUntil: "networkidle2" });

      // Scroll down to load lazy content
      await jobPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));

      // Scrape only the job details
      const html = await jobPage.evaluate(() => {
        const top = document.querySelector(".top-annonce")?.outerHTML || "";
        const details = document.querySelector(".detail-offre")?.outerHTML || "";
        return top + details;
      });

      // Insert into database
      await Rawjobdata.create({ raw_html: html, url: link });
      console.log(`✅ Inserted job from ${link}`);

      await jobPage.close();
    } catch (err) {
      console.error(`❌ Error scraping ${link}: ${err.message}`);
    }
  }

  await browser.close();
  console.log("🚀 Scraping completed successfully");
}

module.exports = { scrapeTanitJobs };
