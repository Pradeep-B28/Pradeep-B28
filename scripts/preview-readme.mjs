import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('verification-screenshots');

// Simple markdown-to-HTML parser for GitHub README preview
function markdownToHtml(md) {
  let html = md;

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match) => {
    return match;
  });

  return html;
}

async function renderReadmePreview() {
  console.log('=== PREVIEWING README IN LIGHT & DARK MODE ===');
  const readmeContent = fs.readFileSync('README.md', 'utf8');

  // Generate lightweight HTML wrapped in GitHub-style container
  // Marked parser from CDN for preview
  const previewHtml = (theme) => `<!DOCTYPE html>
<html lang="en" data-color-mode="${theme}" data-${theme}-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <title>README Preview (${theme})</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.0/github-markdown-${theme}.min.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    body {
      background: ${theme === 'dark' ? '#0d1117' : '#ffffff'};
      padding: 40px;
      display: flex;
      justify-content: center;
      font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;
    }
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
      background: ${theme === 'dark' ? '#0d1117' : '#ffffff'};
      border: 1px solid ${theme === 'dark' ? '#30363d' : '#d0d7de'};
      border-radius: 6px;
    }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 12px; }
  </style>
</head>
<body>
  <article class="markdown-body" id="content"></article>
  <script>
    const rawMd = ${JSON.stringify(readmeContent)};
    document.getElementById('content').innerHTML = marked.parse(rawMd);
  </script>
</body>
</html>`;

  fs.writeFileSync('readme-preview-dark.html', previewHtml('dark'));
  fs.writeFileSync('readme-preview-light.html', previewHtml('light'));

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox']
  });

  for (const theme of ['dark', 'light']) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:8080/Pradeep-B28/readme-preview-${theme}.html`, {
      waitUntil: 'networkidle0'
    });
    await new Promise(r => setTimeout(r, 600));

    const height = await page.$eval('.markdown-body', el => el.scrollHeight);
    console.log(`README rendered height (${theme}): ${height}px (Target ~2.5 screen heights ≈ 2250px)`);

    const shotPath = path.join(outDir, `readme-preview-${theme}.png`);
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log(`Saved README preview screenshot: ${shotPath}`);
    await page.close();
  }

  await browser.close();
  console.log('=== README PREVIEW COMPLETED ===');
}

renderReadmePreview().catch(console.error);
