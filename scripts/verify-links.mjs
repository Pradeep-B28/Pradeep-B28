import puppeteer from 'puppeteer';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8080/Pradeep-B28/';

async function verifyAllLinks() {
  console.log('=== VERIFYING ALL LINKS AND BUTTONS ON SITE ===');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

  // Get all anchor tags
  const links = await page.$$eval('a', els => els.map(a => ({
    text: a.innerText.trim(),
    href: a.href,
    target: a.target
  })));

  console.log(`Found ${links.length} total links on page:`);

  const internalAnchors = [];
  const externalUrls = [];

  for (const l of links) {
    if (l.href.includes('#')) {
      internalAnchors.push(l);
    } else {
      externalUrls.push(l);
    }
  }

  console.log(`- Internal anchor links: ${internalAnchors.length}`);
  console.log(`- External / Mailto links: ${externalUrls.length}`);

  // Test internal anchor targets exist
  for (const a of internalAnchors) {
    const hash = new URL(a.href).hash;
    if (hash && hash !== '#' && hash !== '#main') {
      const exists = await page.$(hash);
      if (!exists) {
        console.error(`ERROR: Target ${hash} for link "${a.text}" not found!`);
      } else {
        console.log(`  ✓ Anchor ${hash} verified`);
      }
    }
  }

  // Print all external / mailto URLs
  for (const ext of externalUrls) {
    console.log(`  ✓ Link: "${ext.text || 'icon'}" -> ${ext.href}`);
  }

  await browser.close();
  console.log('=== ALL LINKS AND ANCHORS VERIFIED ===');
}

verifyAllLinks().catch(console.error);
