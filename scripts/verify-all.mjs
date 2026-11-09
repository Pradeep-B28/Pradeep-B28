import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('verification-screenshots');
fs.mkdirSync(outDir, { recursive: true });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:8080/Pradeep-B28/';

async function runVerification() {
  console.log('=== STARTING AUTOMATED VERIFICATION ===');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'mobile-390', width: 390, height: 844 }
  ];

  const sections = ['navbar', 'hero', 'work', 'lab', 'experience', 'skills', 'contact'];

  for (const vp of viewports) {
    console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });

    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    // Wait a brief moment for layout/animations
    await new Promise(r => setTimeout(r, 600));

    // Full page screenshot
    const fullPath = path.join(outDir, `${vp.name}-full.png`);
    await page.screenshot({ path: fullPath, fullPage: true });
    console.log(`  Saved full page: ${fullPath}`);

    // Section screenshots
    for (const sec of sections) {
      const el = await page.$(`#${sec}`);
      if (el) {
        const secPath = path.join(outDir, `${vp.name}-${sec}.png`);
        await el.screenshot({ path: secPath });
        console.log(`  Saved section #${sec}: ${secPath}`);
      }
    }

    // Footer screenshot
    const footerEl = await page.$('footer');
    if (footerEl) {
      const footPath = path.join(outDir, `${vp.name}-footer.png`);
      await footerEl.screenshot({ path: footPath });
      console.log(`  Saved footer: ${footPath}`);
    }

    if (errors.length > 0) {
      console.error(`  Console errors on ${vp.name}:`, errors);
    } else {
      console.log(`  Zero console errors on ${vp.name}!`);
    }

    await page.close();
  }

  // --------------------------------------------------------------------------
  // INTERACTION TESTS
  // --------------------------------------------------------------------------
  console.log('\n=== TESTING INTERACTIONS & BUTTONS ===');
  const testPage = await browser.newPage();
  await testPage.setViewport({ width: 1440, height: 900 });
  await testPage.goto(BASE_URL, { waitUntil: 'networkidle0' });

  // 1. Test Filter Buttons
  console.log('\nTesting Lab Filter Buttons:');
  const filters = ['Algorithms', 'Dev Tools', 'Privacy & Security', 'Games', 'Visualizers', 'All'];
  for (const f of filters) {
    const btn = await testPage.$(`button[data-filter="${f}"]`);
    if (btn) {
      await btn.click();
      await new Promise(r => setTimeout(r, 300));
      const visibleCount = await testPage.$$eval('.lab-card', cards => 
        cards.filter(c => window.getComputedStyle(c).display !== 'none').length
      );
      console.log(`  Filter [${f}] -> ${visibleCount} cards visible`);
    }
  }

  // 2. Test Copy Email Button
  console.log('\nTesting Copy Email Button:');
  const copyBtn = await testPage.$('#copy-email-btn');
  if (copyBtn) {
    await copyBtn.click();
    await new Promise(r => setTimeout(r, 200));
    const toastText = await testPage.$eval('#copy-toast', el => el.textContent);
    const toastVisible = await testPage.$eval('#copy-toast', el => el.classList.contains('show'));
    console.log(`  Toast displayed: ${toastVisible}, text: "${toastText}"`);
    await testPage.screenshot({ path: path.join(outDir, 'copy-email-toast.png') });
  }

  // 3. Test Mobile Navigation Menu
  console.log('\nTesting Mobile Menu:');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844 });
  await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle0' });

  const hamburger = await mobilePage.$('#mobile-toggle');
  if (hamburger) {
    await hamburger.click();
    await new Promise(r => setTimeout(r, 300));
    const isOpen = await mobilePage.$eval('#nav-links', el => el.classList.contains('is-open'));
    console.log(`  Mobile menu opened: ${isOpen}`);
    await mobilePage.screenshot({ path: path.join(outDir, 'mobile-menu-open.png') });

    // Click a nav link
    const workLink = await mobilePage.$('#nav-links a[href="#work"]');
    if (workLink) {
      await workLink.click();
      await new Promise(r => setTimeout(r, 300));
      const isClosed = await mobilePage.$eval('#nav-links', el => !el.classList.contains('is-open'));
      console.log(`  Mobile menu closed after link click: ${isClosed}`);
    }
  }
  await mobilePage.close();

  // 4. Test WebGL Disabled Fallback
  console.log('\nTesting WebGL Disabled Fallback:');
  const noWebglBrowser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--disable-webgl', '--disable-3d-apis', '--no-sandbox']
  });
  const noWebglPage = await noWebglBrowser.newPage();
  await noWebglPage.setViewport({ width: 1440, height: 900 });

  // In addition, override WebGL context to guarantee simulation
  await noWebglPage.evaluateOnNewDocument(() => {
    HTMLCanvasElement.prototype.getContext = function (orig) {
      return function (type, ...args) {
        if (type.includes('webgl')) return null;
        return orig.apply(this, [type, ...args]);
      };
    }(HTMLCanvasElement.prototype.getContext);
  });

  await noWebglPage.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const fallbackDisplay = await noWebglPage.$eval('#hero-fallback', el => window.getComputedStyle(el).display);
  console.log(`  WebGL disabled -> #hero-fallback display: ${fallbackDisplay}`);
  const heroFallbackPath = path.join(outDir, 'hero-fallback-no-webgl.png');
  const heroEl = await noWebglPage.$('#hero');
  if (heroEl) {
    await heroEl.screenshot({ path: heroFallbackPath });
    console.log(`  Saved WebGL fallback screenshot: ${heroFallbackPath}`);
  }
  await noWebglBrowser.close();

  // 5. Test Prefers-Reduced-Motion
  console.log('\nTesting Prefers-Reduced-Motion:');
  const motionPage = await browser.newPage();
  await motionPage.setViewport({ width: 1440, height: 900 });
  await motionPage.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await motionPage.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const motionFallbackDisplay = await motionPage.$eval('#hero-fallback', el => window.getComputedStyle(el).display);
  console.log(`  Reduced motion -> #hero-fallback display: ${motionFallbackDisplay}`);
  const motionHeroEl = await motionPage.$('#hero');
  if (motionHeroEl) {
    const motionPath = path.join(outDir, 'hero-fallback-reduced-motion.png');
    await motionHeroEl.screenshot({ path: motionPath });
    console.log(`  Saved reduced motion screenshot: ${motionPath}`);
  }
  await motionPage.close();

  await testPage.close();
  await browser.close();
  console.log('\n=== VERIFICATION COMPLETED SUCCESSFULLY ===');
}

runVerification().catch(console.error);
