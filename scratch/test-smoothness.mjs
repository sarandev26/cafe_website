import { chromium } from "playwright";

async function checkSmoothness() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  await page.mouse.move(720, 450);

  // Start telemetry
  await page.evaluate(() => {
    window.__smoothnessRecords = [];
    let lastT = performance.now();
    window.__smoothnessActive = true;
    function rLoop(now) {
      if (!window.__smoothnessActive) return;
      window.__smoothnessRecords.push({
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

  // Continuous wheel scrolling: 40px every 16ms for 50 ticks
  for (let i = 0; i < 50; i++) {
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(16);
  }
  // Wait for Lenis smoothing to finish glide
  await page.waitForTimeout(800);

  const records = await page.evaluate(() => {
    window.__smoothnessActive = false;
    return window.__smoothnessRecords || [];
  });

  const advances = [];
  const dts = [];
  const heroCuts = [46, 83, 137];

  for (let i = 1; i < records.length; i++) {
    const prev = records[i - 1];
    const curr = records[i];
    const dFrame = Math.abs(curr.hero - prev.hero);
    const dt = curr.dt;

    dts.push(dt);

    const isNearCut = heroCuts.some((cut) => Math.abs(curr.hero - cut) <= 4);
    // Focus on active movement frames
    if (!isNearCut && dFrame > 0.01) {
      advances.push(dFrame);
    }
  }

  advances.sort((a, b) => a - b);
  dts.sort((a, b) => a - b);

  const median = advances[Math.floor(advances.length / 2)];
  const max = Math.max(...advances);
  const ratio = (max / median).toFixed(2);
  const p95Dt = dts[Math.floor(dts.length * 0.95)].toFixed(1);
  const maxDt = Math.max(...dts).toFixed(1);

  console.log(`Recorded ${records.length} frames.`);
  console.log(`Median advance: ${median?.toFixed(3)}, Max advance: ${max?.toFixed(3)}, Ratio: ${ratio}`);
  console.log(`Frame timing p95: ${p95Dt}ms, max: ${maxDt}ms`);

  await browser.close();
}

checkSmoothness().catch(console.error);
