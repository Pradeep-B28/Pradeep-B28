import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';

async function runAudit() {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
  });

  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port
  };

  const runnerResult = await lighthouse('http://localhost:8080/Pradeep-B28/', options);
  const rep = JSON.parse(runnerResult.report);

  console.log('\n--- Category Scores ---');
  for (const [k, v] of Object.entries(rep.categories)) {
    console.log(`${k}: ${Math.round(v.score * 100)}`);
  }

  console.log('\n--- Performance Metrics ---');
  const metrics = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index'
  ];
  for (const m of metrics) {
    const a = rep.audits[m];
    console.log(`${m}: ${a.displayValue || a.numericValue} (score: ${a.score})`);
  }

  console.log('\n--- Opportunities & Issues ---');
  for (const [id, a] of Object.entries(rep.audits)) {
    if (a.score !== null && a.score < 0.9 && a.details && a.details.type === 'opportunity') {
      console.log(`[Opportunity] ${id}: ${a.title} - ${a.displayValue}`);
    }
    if (a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'notApplicable') {
      if (['render-blocking-resources', 'unminified-css', 'unminified-javascript', 'unused-javascript', 'unused-css-rules', 'modern-image-formats'].includes(id)) {
        console.log(`[Diagnostic] ${id}: ${a.title} - ${a.displayValue || ''}`);
      }
    }
  }

  await chrome.kill();
}

runAudit().catch(console.error);
