import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("aurelia_intro_shown", "true");
    } catch {}
  });

  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Scroll to Chapter Two runway start
  const c2Top = await page.evaluate(() => {
    const el = document.querySelector("#chapter-two");
    return el ? el.offsetTop : 0;
  });

  await page.evaluate((y) => {
    if (window.lenis) window.lenis.scrollTo(y, { immediate: true });
    else window.scrollTo(0, y);
  }, c2Top);
  await page.waitForTimeout(600);

  // Position mouse over Chapter Two
  await page.mouse.move(720, 450);

  // Start telemetry recording in page
  await page.evaluate(() => {
    window.__c2Samples = [];
    const canvas = document.querySelector("#chapter-two canvas");
    const offscreen = document.createElement("canvas");
    offscreen.width = 64;
    offscreen.height = 36;
    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
    let prevPixels = null;
    const pixelCount = 64 * 36;

    window.__recordActive = true;
    function loop(now) {
      if (!window.__recordActive) return;

      let speed = 0;
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        offCtx.drawImage(canvas, 0, 0, 64, 36);
        const imgData = offCtx.getImageData(0, 0, 64, 36).data;
        if (prevPixels) {
          let sumDiff = 0;
          for (let p = 0; p < imgData.length; p += 4) {
            const g1 = 0.299 * imgData[p] + 0.587 * imgData[p + 1] + 0.114 * imgData[p + 2];
            const g2 = 0.299 * prevPixels[p] + 0.587 * prevPixels[p + 1] + 0.114 * prevPixels[p + 2];
            sumDiff += Math.abs(g1 - g2);
          }
          speed = Math.round((sumDiff / pixelCount) * 100) / 100;
        }
        prevPixels = new Uint8ClampedArray(imgData);
      }

      const target = (window.__seq && window.__seq.chapterTarget) || 0;
      const displayed = (window.__seq && window.__seq.chapter) || 0;

      window.__c2Samples.push({
        time: now,
        scrollY: window.scrollY,
        target: Math.round(target * 100) / 100,
        displayed: Math.round(displayed * 100) / 100,
        error: Math.round(Math.abs(displayed - target) * 100) / 100,
        speed,
      });

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });

  // Scroll with real wheel events: 40px every 16ms for 50 ticks
  for (let i = 0; i < 50; i++) {
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(16);
  }

  await page.waitForTimeout(400);

  const samples = await page.evaluate(() => {
    window.__recordActive = false;
    return window.__c2Samples || [];
  });

  await browser.close();

  const activeSamples = samples.filter((s) => s.target > 0.5 && s.speed > 0);
  const speeds = activeSamples.map((s) => s.speed);
  speeds.sort((a, b) => a - b);
  const medianSpeed = speeds[Math.floor(speeds.length / 2)] || 1;
  const maxSpeed = Math.max(...speeds);
  const ratio = Math.round((maxSpeed / medianSpeed) * 100) / 100;
  const maxError = Math.max(...activeSamples.map((s) => s.error));

  console.log({
    samplesCount: activeSamples.length,
    medianSpeed,
    maxSpeed,
    ratio,
    maxError,
    sampleMid: activeSamples.slice(Math.floor(activeSamples.length / 2), Math.floor(activeSamples.length / 2) + 5),
  });
}

run().catch(console.error);
