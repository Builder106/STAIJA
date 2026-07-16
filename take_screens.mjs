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

const outDir = "/Users/yinkavaughan/My Drive (yvaughan@wesleyan.edu)/CS/staija-screenshots";
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

(async () => {
  console.log("Starting browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set to dark theme if possible, since STAIJA has a dark mode we want to emulate
  await page.emulateMedia({ colorScheme: 'dark' });

  for (const url of urls) {
    try {
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait a bit for animations
      await page.waitForTimeout(2000);
      
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
