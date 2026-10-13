import { chromium } from "playwright";

async function checkSteady() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.mouse.move(720, 450);

  // Warmup scroll slightly so velocity reaches steady state
  for (let i = 0; i < 15; i++) {
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(16);
  }

  // Now record DURING constant velocity scrolling (next 30 events)
  await page.evaluate(() => {
    window.__steadyRecords = [];
    let lastT = performance.now();
    window.__steadyActive = true;
    function rLoop(now) {
      if (!window.__steadyActive) return;
      window.__steadyRecords.push({
        t: now,
        dt: now - lastT,
        scrollY: window.scrollY,
        hero: window.__seq ? window.__seq.hero : 0,
      });
      lastT = now;
      requestAnimationFrame(rLoop);
    }
    requestAnimationFrame(rLoop);
  });

  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(16);
  }

  const records = await page.evaluate(() => {
    window.__steadyActive = false;
    return window.__steadyRecords || [];
  });

  const advances = [];
  const heroCuts = [46, 83, 137];
  for (let i = 1; i < records.length; i++) {
    const prev = records[i - 1];
    const curr = records[i];
    const dFrame = Math.abs(curr.hero - prev.hero);
    const isNearCut = heroCuts.some((cut) => Math.abs(curr.hero - cut) <= 4);
    if (!isNearCut && dFrame > 0.05) {
      advances.push(dFrame);
    }
  }

  advances.sort((a, b) => a - b);
  const median = advances[Math.floor(advances.length / 2)];
  const max = Math.max(...advances);
  const min = Math.min(...advances);
  const ratio = (max / median).toFixed(2);

  console.log(`Steady advances count: ${advances.length}`);
  console.log(`Min: ${min?.toFixed(3)}, Median: ${median?.toFixed(3)}, Max: ${max?.toFixed(3)}, Ratio: ${ratio}`);

  await browser.close();
}

checkSteady().catch(console.error);
