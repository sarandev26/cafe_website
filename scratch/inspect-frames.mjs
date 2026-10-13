import { chromium } from "playwright";

async function inspectFrames() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Set intro shown in session storage before navigation so loader is bypassed immediately
  await page.addInitScript(() => {
    sessionStorage.setItem("aurelia_intro_shown", "true");
  });

  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000); // 1s is enough when intro is bypassed
  await page.mouse.move(720, 450);

  // Warmup scroll slightly so velocity reaches steady state
  for (let i = 0; i < 20; i++) {
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
        t: Math.round(now),
        dt: Math.round((now - lastT) * 10) / 10,
        scrollY: Math.round(window.scrollY),
        hero: Math.round((window.__seq ? window.__seq.hero : 0) * 100) / 100,
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
    const dFrame = Math.round((curr.hero - prev.hero) * 100) / 100;
    const isNearCut = heroCuts.some((cut) => Math.abs(curr.hero - cut) <= 4);
    if (!isNearCut && dFrame > 0.05) {
      advances.push(dFrame);
    }
    if (i <= 20) {
      console.log(`[#${i}] dt=${curr.dt}ms, scrollY=${curr.scrollY}, hero=${curr.hero}, dFrame=${dFrame}`);
    }
  }

  advances.sort((a, b) => a - b);
  const median = advances[Math.floor(advances.length / 2)];
  const max = Math.max(...advances);
  const min = Math.min(...advances);
  const ratio = (max / median).toFixed(2);

  console.log(`\nSteady advances count: ${advances.length}`);
  console.log(`Min: ${min}, Median: ${median}, Max: ${max}, Ratio: ${ratio}`);

  await browser.close();
}

inspectFrames().catch(console.error);
