#!/usr/bin/env node
/**
 * capture-screenshots.js — Takes a 16:9 screenshot of each lab entry
 * Saves as thumb.png in each project directory
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const PROJECTS_DIR = path.join(__dirname, '..', 'projects');
const PORT = 3456;
const BASE = `http://localhost:${PORT}`;

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox']
  });

  const dirs = fs.readdirSync(PROJECTS_DIR).filter(d =>
    fs.statSync(path.join(PROJECTS_DIR, d)).isDirectory()
  );

  console.log(`Found ${dirs.length} projects to screenshot\n`);

  for (const dir of dirs) {
    const url = `${BASE}/projects/${dir}/index.html`;
    const outPath = path.join(PROJECTS_DIR, dir, 'thumb.png');
    const page = await browser.newPage();

    try {
      console.log(`  Capturing: ${dir}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

      // Wait a bit for animations to settle
      await new Promise(r => setTimeout(r, 2500));

      // Hide the back-link so it doesn't appear in thumbnails
      await page.evaluate(() => {
        const backLinks = document.querySelectorAll('a[href*="../../"], .back-link');
        backLinks.forEach(el => el.style.display = 'none');
      });

      await page.screenshot({
        path: outPath,
        type: 'png',
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      });

      // Update meta.json with thumb
      const metaPath = path.join(PROJECTS_DIR, dir, 'meta.json');
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        meta.thumb = 'thumb.png';
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
      }

      console.log(`    ✓ Saved ${outPath}`);
    } catch (err) {
      console.error(`    ✗ Failed: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('\nDone! Run `node scripts/build-manifest.js` to update manifest.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
