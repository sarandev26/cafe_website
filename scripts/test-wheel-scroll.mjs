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
  await page.waitForTimeout(2000);

  // Position mouse over Hero
  await page.mouse.move(720, 450);

  // Start telemetry recording in page
  await page.evaluate(() => {
    window.__heroSamples = [];
    const canvas = document.querySelector("#hero canvas");
    const offscreen = document.createElement("canvas");
    offscreen.width = 64;
    offscreen.height = 36;
    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
    let prevPixels = null;
    const pixelCount = 64 * 36;

    window.__recordActive = true;
    function loop() {
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

      const target = (window.__seq && window.__seq.heroTarget) || 0;
      const displayed = (window.__seq && window.__seq.hero) || 0;

      window.__heroSamples.push({
        time: performance.now(),
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

  // Let damping settle
  await page.waitForTimeout(400);

  const samples = await page.evaluate(() => {
    window.__recordActive = false;
    return window.__heroSamples || [];
  });

  await browser.close();

  console.log(`Collected ${samples.length} samples.`);
  const activeSamples = samples.filter((s) => s.target > 0.5 && s.target < 180);
  console.log(`Active samples: ${activeSamples.length}`);

  const errors = activeSamples.map((s) => s.error);
  const maxError = Math.max(...errors);
  const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;

  const speeds = activeSamples.map((s) => s.speed).filter((s) => s > 0);
  speeds.sort((a, b) => a - b);
  const medianSpeed = speeds[Math.floor(speeds.length / 2)] || 1;
  const maxSpeed = Math.max(...speeds);
  const ratio = maxSpeed / medianSpeed;

  console.log({
    medianSpeed,
    maxSpeed,
    ratio: Math.round(ratio * 100) / 100,
    maxError,
    avgError: Math.round(avgError * 100) / 100,
    sampleStart: activeSamples.slice(0, 5),
    sampleMid: activeSamples.slice(Math.floor(activeSamples.length / 2), Math.floor(activeSamples.length / 2) + 5),
  });
}

run().catch(console.error);
