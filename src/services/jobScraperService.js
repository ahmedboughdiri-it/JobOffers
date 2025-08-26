const puppeteer = require("puppeteer");
const Rawjobdata = require("../models/Rawjobdata");

async function scrapeTanitJobs(listingUrl) {
  const browser = await puppeteer.launch({
    headless: false,
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

  // Keep track of links already scraped
  const scrapedLinks = new Set();

  // Function to scrape links from the page
  async function scrapeLinksFromPage() {
    const links = await page.$$eval(
      "article.listing-item .media-heading a.link",
      els => els.map(el => el.href)
    );
    for (const link of links) {
      if (!scrapedLinks.has(link)) {
        scrapedLinks.add(link);

        try {
          const jobPage = await browser.newPage();
          await jobPage.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
          );

          await jobPage.goto(link, { waitUntil: "networkidle2" });

          await jobPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));

          const html = await jobPage.evaluate(() => {
            const top = document.querySelector(".top-annonce")?.outerHTML || "";
            const details = document.querySelector(".detail-offre")?.outerHTML || "";
            return top + details;
          });

          await Rawjobdata.create({ raw_html: html, url: link });
          console.log(`✅ Inserted job from ${link}`);

          await jobPage.close();
        } catch (err) {
          console.error(`❌ Error scraping ${link}: ${err.message}`);
        }
      }
    }
  }

  // Scrape initial jobs
  await scrapeLinksFromPage();

  // Handle bottom "VOIR PLUS" button (loads more job listings on same page)
let hasMoreListings = true;
while (hasMoreListings) {
  try {
    const bottomVoirPlusBtn = await page.$("button.btn.btn__nextpage"); // bottom button
    if (!bottomVoirPlusBtn) {
      console.log("No more bottom 'VOIR PLUS' button found.");
      hasMoreListings = false;
      break;
    }

    await bottomVoirPlusBtn.evaluate(b => b.scrollIntoView());
    await bottomVoirPlusBtn.click();
    console.log("Clicked bottom 'VOIR PLUS' button, waiting for jobs...");

    // wait for new articles to appear
    await page.waitForSelector("article.listing-item", { timeout: 5000 }).catch(() => {});
   await new Promise(r => setTimeout(r, 2500 + Math.random() * 2000));


    // scrape new batch
    await scrapeLinksFromPage();

  } catch (err) {
    console.error("⚠️ Error while clicking bottom 'VOIR PLUS':", err.message);
    hasMoreListings = false;
  }
}
}



///////////////////////
///////emploi tunisie
///////////////////////


async function scrapeEmploiTunisie(listingUrl) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  await page.goto(listingUrl, { waitUntil: "networkidle2" });

  const scrapedLinks = new Set();

  // Scrape links from the current page
  async function scrapeLinksFromPage() {
    const links = await page.$$eval("div.card.card-job", els =>
      els.map(el => el.getAttribute("data-href"))
    );

    for (const link of links) {
      if (link && !scrapedLinks.has(link)) {
        scrapedLinks.add(link);

        try {
          const jobPage = await browser.newPage();
          await jobPage.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
          );

          await jobPage.goto(link, { waitUntil: "networkidle2" });

          await jobPage.evaluate(() =>
            window.scrollTo(0, document.body.scrollHeight)
          );
          await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));

          // Grab the job content
          const html = await jobPage.evaluate(() => {
            const title = document.querySelector(".page-title")?.outerHTML || "";
            const wrapper =
              document.querySelector(".page-application-wrapper")?.outerHTML ||
              "";
            const details =
              document.querySelector(".page-application-content")
                ?.outerHTML || "";
            return title + wrapper + details;
          });

          await Rawjobdata.create({ raw_html: html, url: link });
          console.log(`✅ Inserted job from ${link}`);

          await jobPage.close();
        } catch (err) {
          console.error(`❌ Error scraping ${link}: ${err.message}`);
        }
      }
    }
  }

  // Scrape the first page
  await scrapeLinksFromPage();

  // Handle pagination
  let hasNextPage = true;
  while (hasNextPage) {
    try {
      const nextBtn = await page.$(
        '.pagination li.pager-next.active a[title="Aller à la page suivante"]'
      );
      if (!nextBtn) {
        console.log("No more next page button found.");
        hasNextPage = false;
        break;
      }

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        nextBtn.click()
      ]);

      console.log("➡️ Going to next page...");
      await scrapeLinksFromPage();
    } catch (err) {
      console.error("⚠️ Error while going to next page:", err.message);
      hasNextPage = false;
    }
  }

  await browser.close();
}



module.exports = { scrapeTanitJobs, scrapeEmploiTunisie };
