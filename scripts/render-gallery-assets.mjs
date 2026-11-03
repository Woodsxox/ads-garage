/**
 * Renders a poster image for every demo ad, and a short looping video for the animated formats
 * (video, carousel, gamified), into public/gallery. The 3D gallery wall draws these as textures.
 *
 *   1. start the site:   npm run dev            (or: ASSET_RENDER=1 npm run start)
 *   2. generate:         npm run gallery:assets   (BASE_URL=http://localhost:3000 to point elsewhere)
 *
 * Each ad is driven through its real behaviour in a headless browser: the video is played, the
 * carousel is stepped through, the game is played. Commit the output; rerun when ads change.
 */
import { chromium } from "playwright";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = (process.env.BASE_URL ?? "http://localhost:3200").replace(/\/$/, "");
const OUT = path.join(process.cwd(), "public", "gallery");
const TMP = path.join(OUT, ".tmp");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function adFrame(page) {
  await page.waitForSelector("iframe", { timeout: 20000 });
  const handle = await page.$("iframe");
  const frame = await handle.contentFrame();
  await frame.waitForSelector("main", { timeout: 20000 });
  await wait(450); // let fonts settle and entry animations finish
  return frame;
}

/** Plays the ad the way a viewer would, for up to `limitMs`. Returns when the loop is complete. */
async function perform(ad, frame) {
  if (ad.format === "video") {
    const total = await frame.evaluate(() => (typeof TOTAL === "number" ? TOTAL : 12));
    await frame.click("#big");
    await wait(Math.min(total, 14) * 1000 + 400);
  } else if (ad.format === "carousel") {
    const slides = await frame.evaluate(() => document.querySelectorAll(".slide").length);
    await wait(900);
    for (let i = 1; i < slides; i += 1) {
      await frame.click("#next");
      await wait(1150);
    }
    await wait(700);
  } else if (ad.format === "gamified") {
    for (let guard = 0; guard < 8; guard += 1) {
      const kind = await frame.evaluate(() => {
        const step = [...document.querySelectorAll(".step")].find((s) => !s.hidden);
        return step ? step.getAttribute("data-kind") : null;
      });
      if (!kind) break;
      await wait(500);
      if (kind === "choice") await frame.click(".opt");
      else if (kind === "tap") {
        const taps = await frame.evaluate(() => Number(document.querySelector(".step:not([hidden])")?.getAttribute("data-taps") ?? 3));
        for (let t = 0; t < taps; t += 1) {
          await frame.click(".tapper");
          await wait(170);
        }
      } else if (kind === "spin") {
        await frame.click(".wheel");
        await wait(2200);
      } else if (kind === "reveal") {
        await frame.click(".revealbtn");
        await wait(900);
        break;
      }
      await wait(700);
    }
    await wait(500);
  }
}

const ANIMATED = new Set(["video", "carousel", "gamified"]);

async function main() {
  const res = await fetch(`${BASE}/render/manifest`);
  if (!res.ok) throw new Error(`Could not read ${BASE}/render/manifest (${res.status}). Is the site running?`);
  const ads = await res.json();

  await rm(TMP, { recursive: true, force: true });
  await mkdir(path.join(OUT, "posters"), { recursive: true });
  await mkdir(path.join(OUT, "loops"), { recursive: true });
  await mkdir(TMP, { recursive: true });

  const browser = await chromium.launch();
  const manifest = {};

  for (const ad of ads) {
    const size = { width: ad.width, height: ad.height };
    const entry = { poster: `/gallery/posters/${ad.id}.jpg`, width: ad.width, height: ad.height, format: ad.format };

    // Poster: a frame that shows the ad doing something, not its idle first frame.
    {
      const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2 });
      await ctx.addInitScript(() => sessionStorage.setItem("ag-loaded", "1"));
      const page = await ctx.newPage();
      await page.goto(`${BASE}/render/${ad.id}`, { waitUntil: "load" });
      const frame = await adFrame(page);
      if (ad.format === "video") {
        await frame.click("#big");
        await wait(2600);
      }
      await page.screenshot({ path: path.join(OUT, "posters", `${ad.id}.jpg`), type: "jpeg", quality: 92 });
      await ctx.close();
    }

    // Loop: the same ad, recorded while it is played.
    if (ANIMATED.has(ad.format)) {
      const ctx = await browser.newContext({ viewport: size, recordVideo: { dir: TMP, size } });
      await ctx.addInitScript(() => sessionStorage.setItem("ag-loaded", "1"));
      const page = await ctx.newPage();
      await page.goto(`${BASE}/render/${ad.id}`, { waitUntil: "load" });
      const frame = await adFrame(page);
      await perform(ad, frame);
      const video = page.video();
      await ctx.close();
      const target = path.join(OUT, "loops", `${ad.id}.webm`);
      await rename(await video.path(), target);
      entry.loop = `/gallery/loops/${ad.id}.webm`;
    }

    manifest[ad.id] = entry;
    console.log(`${ad.id.padEnd(28)} poster${entry.loop ? " + loop" : ""}`);
  }

  await browser.close();
  await rm(TMP, { recursive: true, force: true });
  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), ads: manifest }, null, 2) + "\n");
  console.log(`\nWrote ${Object.keys(manifest).length} posters and ${Object.values(manifest).filter((m) => m.loop).length} loops to public/gallery`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
