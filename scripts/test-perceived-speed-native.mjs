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

  console.log("Sampling Hero Canvas at steady velocity...");

  const results = await page.evaluate(async () => {
    const canvas = document.querySelector("#hero canvas");
    const offscreen = document.createElement("canvas");
    offscreen.width = 64;
    offscreen.height = 36;
    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
    let prevPixels = null;
    const pixelCount = 64 * 36;
    const samples = [];

    let lastT = performance.now();
    let isSampling = true;

    // Dispatch steady wheel events inside browser
    const wheelInterval = setInterval(() => {
      window.dispatchEvent(new WheelEvent("wheel", { deltaY: 40, bubbles: true, cancelable: true }));
    }, 16);

    return new Promise((resolve) => {
      function loop(now) {
        if (!isSampling) return;

        const dt = now - lastT;
        lastT = now;

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
            // Normalize speed to 16.67ms frame baseline
            const normDt = Math.max(1, dt) / 16.67;
            speed = Math.round(((sumDiff / pixelCount) / normDt) * 100) / 100;
          }
          prevPixels = new Uint8ClampedArray(imgData);
        }

        const target = (window.__seq && window.__seq.heroTarget) || 0;
        const displayed = (window.__seq && window.__seq.hero) || 0;

        samples.push({
          time: Math.round(now),
          dt: Math.round(dt * 10) / 10,
          target: Math.round(target * 100) / 100,
          displayed: Math.round(displayed * 100) / 100,
          error: Math.round(Math.abs(displayed - target) * 100) / 100,
          speed,
        });

        if (displayed > 80 || samples.length > 200) {
          isSampling = false;
          clearInterval(wheelInterval);
          resolve(samples);
        } else {
          requestAnimationFrame(loop);
        }
      }
      requestAnimationFrame(loop);
    });
  });

  await browser.close();

  // Filter steady scrolling window (displayed > 5)
  const steady = results.filter((s) => s.displayed > 5 && s.speed > 0);
  const speeds = steady.map((s) => s.speed);
  speeds.sort((a, b) => a - b);
  const medianSpeed = speeds[Math.floor(speeds.length / 2)] || 1;
  const maxSpeed = Math.max(...speeds);
  const ratio = Math.round((maxSpeed / medianSpeed) * 100) / 100;
  const bursts = steady.filter((s) => s.speed > 2.2 * medianSpeed);
  const maxError = Math.max(...steady.map((s) => s.error));

  console.log({
    samples: steady.length,
    medianSpeed,
    maxSpeed,
    ratio,
    burstsCount: bursts.length,
    maxError,
  });

  if (bursts.length > 0) {
    console.table(bursts);
  }
}

run().catch(console.error);
