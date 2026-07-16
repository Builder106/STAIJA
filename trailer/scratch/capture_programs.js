const puppeteer = require('puppeteer');

const pages = [
  { url: 'https://staija.org/programs/stepup-scholars', out: '../public/staija_stepup.png' },
  { url: 'https://staija.org/programs/dynamerge', out: '../public/staija_dynamerge.png' },
];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  for (const { url, out } of pages) {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise((r) => setTimeout(r, 3000));
    await page.screenshot({ path: out });
    console.log('captured', out);
  }

  await browser.close();
})();
