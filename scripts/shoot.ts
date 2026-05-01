import puppeteer from "npm:puppeteer-core@22.15.0";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:5190";
const OUT = "/tmp/staija-shots";

const routes: [string, string][] = [
  ["home", "/"],
  ["stepup", "/programs/stepup-scholars"],
  ["dynamerge", "/programs/dynamerge"],
  ["get-involved", "/get-involved"],
  ["donate", "/donate"],
  ["about", "/about"],
  ["blog", "/blog"],
  ["events", "/events"],
  ["contact", "/contact"],
  ["login", "/login"],
  ["signup", "/signup"],
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  defaultViewport: { width: 1440, height: 900 },
  args: ["--no-sandbox", "--disable-gpu"],
});

const page = await browser.newPage();
page.on("pageerror", (e) => console.error("[pageerror]", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.error("[console.error]", m.text());
});

for (const [name, path] of routes) {
  try {
    await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 30000 });
    await page.waitForSelector("#app *", { timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    console.log(`captured ${name}`);
  } catch (e) {
    console.error(`failed ${name}: ${(e as Error).message}`);
  }
}

await browser.close();
