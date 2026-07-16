import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const urls = [
  "https://staija.org/",
  "https://staija.org/programs/stepup-scholars",
  "https://staija.org/programs/dynamerge",
  "https://staija.org/events",
  "https://staija.org/blog",
  "https://staija.org/about",
  "https://staija.org/stay-connected",
  "https://staija.org/get-involved",
  "https://staija.org/contact",
  "https://staija.org/press",
  "https://staija.org/login",
  "https://staija.org/signup"
];

const outDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

(async () => {
  console.log("Starting browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  // Dark theme, matching the trailer's aesthetic
  await page.emulateMedia({ colorScheme: 'dark' });

  // Force every whileInView / scroll-reveal animation to fire immediately:
  // stub IntersectionObserver so observed elements always report as
  // intersecting. Without this, sections below the fold (e.g. the home
  // program cards, motion-v whileInView with once:true) capture as blank.
  await page.addInitScript(() => {
    window.IntersectionObserver = class {
      constructor(callback) { this.callback = callback; }
      observe(target) {
        this.callback([{
          isIntersecting: true,
          target,
          intersectionRatio: 1,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
          time: Date.now(),
        }], this);
      }
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    };
  });

  for (const url of urls) {
    try {
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(4000);

      // Scroll through the whole page so IntersectionObserver reveal
      // animations fire before the full-page capture; otherwise sections
      // below the fold screenshot as blank.
      await page.evaluate(async () => {
        const step = 600;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 250));
        }
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 800));
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1500);

      let name = new URL(url).pathname.replace(/[^a-zA-Z0-9]/g, '_');
      if (name === '_') name = 'home';
      else if (name.startsWith('_')) name = name.substring(1);

      const filePath = path.join(outDir, `${name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`Saved screenshot to ${filePath}`);
    } catch (e) {
      console.error(`Failed to screenshot ${url}:`, e.message);
    }
  }

  await browser.close();
  console.log("Done.");
})();
