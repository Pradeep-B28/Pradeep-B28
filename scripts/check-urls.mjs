import fs from 'fs';

const readme = fs.readFileSync('README.md', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const combined = readme + '\n' + index;

const urlRegex = /https?:\/\/[^\s"'><\)\`]+/g;
const matches = combined.match(urlRegex) || [];
const cleanedUrls = [...new Set(matches.map(u => u.replace(/[\.,;]+$/, '')))];

console.log(`Found ${cleanedUrls.length} unique URLs to check.`);

async function checkUrl(url) {
  // Skip external fonts / schemas / cdnjs for simple checks or check with HEAD/GET
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    return { url, status: res.status, ok: res.ok };
  } catch (err) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      return { url, status: res.status, ok: res.ok };
    } catch (err2) {
      return { url, status: 'ERROR', error: err2.message };
    }
  }
}

async function run() {
  for (const url of cleanedUrls) {
    const res = await checkUrl(url);
    console.log(`${res.status} | ${url} ${res.error ? '(' + res.error + ')' : ''}`);
  }
}

run();
