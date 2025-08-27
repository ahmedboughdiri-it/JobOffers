const puppeteer = require("puppeteer");
const Rawjobdata = require("../models/Rawjobdata");


//////////////////////
//////tanitjobs////////
////////////////////

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

  await page.goto(listingUrl, { waitUntil: "networkidle2" });
  await page.waitForSelector("article.listing-item");

  const scrapedLinks = new Set();

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

  // Load all jobs on the current page by clicking the bottom "VOIR PLUS"
let moreJobs = true;
while (moreJobs) {
  await scrapeLinksFromPage();

  const voirPlusBtn = await page.$("button.load-more.btn__nextpage");
  if (voirPlusBtn) {
    await voirPlusBtn.evaluate(b => b.scrollIntoView());
    await voirPlusBtn.click();
    console.log("Clicked bottom 'VOIR PLUS' button, waiting for more jobs...");

    // wait for jobs to load (fixed for Puppeteer v20+)
    await new Promise(r => setTimeout(r, 2500 + Math.random() * 2000));
  } else {
    moreJobs = false;
    console.log("No more bottom 'VOIR PLUS' buttons on this page.");
  }
}


// Pagination
let hasNextPage = true;
while (hasNextPage) {
  const nextPageLink = await page.$eval(
    "#list_nav a:last-child",
    a => a.href
  ).catch(() => null);

  if (nextPageLink) {
    await page.goto(nextPageLink, { waitUntil: "networkidle2" });
    console.log("➡️ Moving to next page:", nextPageLink);

    // Click all bottom "VOIR PLUS" on new page
    moreJobs = true;
    while (moreJobs) {
      await scrapeLinksFromPage();
      const voirPlusBtn = await page.$("button.load-more.btn__nextpage");
      if (voirPlusBtn) {
        await voirPlusBtn.evaluate(b => b.scrollIntoView());
        await voirPlusBtn.click();
        // <-- fixed wait
        await new Promise(r => setTimeout(r, 2500 + Math.random() * 2000));
      } else {
        moreJobs = false;
      }
    }
  } else {
    hasNextPage = false;
    console.log("No more pages in pagination.");
  }
}

  await browser.close();
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

//////////////////////
//////keejobs////////
////////////////////

async function scrapeKeejob(listingUrl) {
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

  // Scrape links from one page
  async function scrapeLinksFromPage() {
    const links = await page.$$eval("article h2 a", els =>
      els.map(el => el.href)
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

          // Inside page.evaluate()
const html = await jobPage.evaluate(() => {
  const title = document.querySelector(".page-title")?.outerHTML || "";

  // Example: find the "Entreprise" block by scanning h2s
  const entrepriseHeading = [...document.querySelectorAll("h2")]
    .find(h => h.textContent.includes("Entreprise"));
  const entrepriseBlock = entrepriseHeading
    ? entrepriseHeading.parentElement.outerHTML
    : "";

  const details = document.querySelector(".job-description")?.outerHTML || "";

  return title + entrepriseBlock + details;
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

  // Scrape first page
  await scrapeLinksFromPage();

  // Pagination
let hasNextPage = true;

while (hasNextPage) {
  try {
    // Find the "Suivant" link
    const nextPageUrl = await page.$eval(
      'nav[aria-label="Pagination"] a',
      links => {
        const next = Array.from(document.querySelectorAll('nav[aria-label="Pagination"] a')).find(a => {
          const sr = a.querySelector('span.sr-only');
          return sr && sr.textContent.trim() === 'Suivant';
        });
        return next ? next.href : null;
      }
    );

    if (!nextPageUrl) {
      console.log("🚫 No more pages.");
      hasNextPage = false;
      break;
    }

    console.log("➡️ Going to next page:", nextPageUrl);
    await page.goto(nextPageUrl, { waitUntil: 'networkidle2' });

    // Scrape all links on the new page
    await scrapeLinksFromPage();
  } catch (err) {
    console.error("⚠️ Error while going to next page:", err.message);
    hasNextPage = false;
  }
}



  await browser.close();
}



module.exports = { scrapeTanitJobs, scrapeEmploiTunisie , scrapeKeejob };
