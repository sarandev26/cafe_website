import fs from "fs";
import path from "path";
import { chromium } from "playwright";

async function measurePerceivedSpeed() {
  console.log("===============================================================");
  console.log("STEP 1C: MEASURING GROUND TRUTH PERCEIVED SPEED IN BROWSER");
  console.log("===============================================================\n");

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

  // Measure Hero Runway
  console.log("--> Sampling Hero Canvas at Constant Velocity (40px / 16ms)...");

  const heroResults = await page.evaluate(async () => {
    const heroEl = document.querySelector("#hero");
    const canvas = document.querySelector("#hero canvas");
    if (!heroEl || !canvas) return { error: "Hero canvas not found" };

    const heroH = heroEl.offsetHeight;
    const vh = window.innerHeight;
    const scrollMax = heroH - vh;

    // Create 64x36 offscreen canvas
    const offscreen = document.createElement("canvas");
    offscreen.width = 64;
    offscreen.height = 36;
    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });

    let prevPixels = null;
    const samples = [];
    const pixelCount = 64 * 36;

    let currentY = 0;
    const stepPx = 40;
    const stepInterval = 16;

    return new Promise((resolve) => {
      let isSampling = true;

      const sampleFrame = () => {
        if (!isSampling) return;

        // Draw current hero canvas downscaled to 64x36
        offCtx.drawImage(canvas, 0, 0, 64, 36);
        const imgData = offCtx.getImageData(0, 0, 64, 36).data;

        // Compute MAD from previous frame
        let speed = 0;
        if (prevPixels) {
          let sumDiff = 0;
          for (let p = 0; p < imgData.length; p += 4) {
            // Grayscale diff
            const grayNow = 0.299 * imgData[p] + 0.587 * imgData[p + 1] + 0.114 * imgData[p + 2];
            const grayPrev = 0.299 * prevPixels[p] + 0.587 * prevPixels[p + 1] + 0.114 * prevPixels[p + 2];
            sumDiff += Math.abs(grayNow - grayPrev);
          }
          speed = Math.round((sumDiff / pixelCount) * 100) / 100;
        }
        prevPixels = new Uint8ClampedArray(imgData);

        const targetFrame = (window.__seq && window.__seq.heroTarget) || (currentY / scrollMax) * 192;
        const displayedFrame = (window.__seq && window.__seq.hero) || 0;

        samples.push({
          time: Math.round(performance.now()),
          targetFrame: Math.round(targetFrame * 100) / 100,
          displayedFrame: Math.round(displayedFrame * 100) / 100,
          error: Math.round(Math.abs(displayedFrame - targetFrame) * 100) / 100,
          speed,
        });

        if (currentY >= scrollMax) {
          isSampling = false;
          resolve(samples);
        } else {
          requestAnimationFrame(sampleFrame);
        }
      };

      requestAnimationFrame(sampleFrame);

      // Wheel dispatch interval
      const intervalId = setInterval(() => {
        currentY = Math.min(scrollMax, currentY + stepPx);
        if (window.lenis) {
          window.lenis.scrollTo(currentY, { immediate: false });
        } else {
          window.scrollTo(0, currentY);
        }

        if (currentY >= scrollMax) {
          clearInterval(intervalId);
          setTimeout(() => {
            isSampling = false;
            resolve(samples);
          }, 600);
        }
      }, stepInterval);
    });
  });

  // Analyze Hero results
  console.log(`Hero samples collected: ${heroResults.length}`);

  // Calculate speeds & bursts
  const speeds = heroResults.map((s) => s.speed).filter((s) => s > 0);
  speeds.sort((a, b) => a - b);
  const medianSpeed = speeds[Math.floor(speeds.length / 2)] || 1;
  const maxSpeed = speeds[speeds.length - 1] || 1;
  const ratio = Math.round((maxSpeed / medianSpeed) * 100) / 100;

  // Find bursts > 2.2x local median
  const bursts = [];
  for (let i = 0; i < heroResults.length; i++) {
    const s = heroResults[i];
    if (s.speed > 2.2 * medianSpeed && s.speed > 2.0) {
      bursts.push({
        index: i,
        time: s.time,
        displayedFrame: s.displayedFrame,
        targetFrame: s.targetFrame,
        speed: s.speed,
        ratio: Math.round((s.speed / medianSpeed) * 10) / 10,
      });
    }
  }

  const maxError = Math.max(...heroResults.map((s) => s.error));
  const errorGt2 = heroResults.filter((s) => s.error > 2).length;

  console.log(`\nHERO GROUND TRUTH ANALYSIS:`);
  console.log(`  - Median Perceived Speed: ${medianSpeed}`);
  console.log(`  - Max Perceived Speed: ${maxSpeed}`);
  console.log(`  - Max / Median Ratio: ${ratio}`);
  console.log(`  - Max (displayed - target) Error: ${maxError} frames`);
  console.log(`  - Frames with Error > 2: ${errorGt2}`);
  console.log(`  - Bursts (> 2.2x median): ${bursts.length}`);
  if (bursts.length > 0) {
    console.log(`  - Detected Bursts:`);
    console.table(bursts);
  }

  // Measure Chapter Two
  console.log("\n--> Sampling Chapter Two Canvas at Constant Velocity (40px / 16ms)...");

  // Scroll to Chapter Two runway start
  const c2Offset = await page.evaluate(() => {
    const el = document.querySelector("#chapter-two");
    return el ? el.offsetTop : 0;
  });

  await page.evaluate((y) => {
    if (window.lenis) window.lenis.scrollTo(y, { immediate: true });
    else window.scrollTo(0, y);
  }, c2Offset);
  await page.waitForTimeout(1000);

  const c2Results = await page.evaluate(async (baseY) => {
    const c2El = document.querySelector("#chapter-two");
    const canvas = document.querySelector("#chapter-two canvas");
    if (!c2El || !canvas) return { error: "Chapter two canvas not found" };

    const c2H = c2El.offsetHeight;
    const vh = window.innerHeight;
    const scrollMax = c2H - vh;

    const offscreen = document.createElement("canvas");
    offscreen.width = 64;
    offscreen.height = 36;
    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });

    let prevPixels = null;
    const samples = [];
    const pixelCount = 64 * 36;

    let currentRelY = 0;
    const stepPx = 40;
    const stepInterval = 16;

    return new Promise((resolve) => {
      let isSampling = true;

      const sampleFrame = () => {
        if (!isSampling) return;

        offCtx.drawImage(canvas, 0, 0, 64, 36);
        const imgData = offCtx.getImageData(0, 0, 64, 36).data;

        let speed = 0;
        if (prevPixels) {
          let sumDiff = 0;
          for (let p = 0; p < imgData.length; p += 4) {
            const grayNow = 0.299 * imgData[p] + 0.587 * imgData[p + 1] + 0.114 * imgData[p + 2];
            const grayPrev = 0.299 * prevPixels[p] + 0.587 * prevPixels[p + 1] + 0.114 * prevPixels[p + 2];
            sumDiff += Math.abs(grayNow - grayPrev);
          }
          speed = Math.round((sumDiff / pixelCount) * 100) / 100;
        }
        prevPixels = new Uint8ClampedArray(imgData);

        const targetFrame = (window.__seq && window.__seq.chapterTarget) || (currentRelY / scrollMax) * 192;
        const displayedFrame = (window.__seq && window.__seq.chapter) || 0;

        samples.push({
          time: Math.round(performance.now()),
          targetFrame: Math.round(targetFrame * 100) / 100,
          displayedFrame: Math.round(displayedFrame * 100) / 100,
          error: Math.round(Math.abs(displayedFrame - targetFrame) * 100) / 100,
          speed,
        });

        if (currentRelY >= scrollMax) {
          isSampling = false;
          resolve(samples);
        } else {
          requestAnimationFrame(sampleFrame);
        }
      };

      requestAnimationFrame(sampleFrame);

      const intervalId = setInterval(() => {
        currentRelY = Math.min(scrollMax, currentRelY + stepPx);
        const absY = baseY + currentRelY;
        if (window.lenis) {
          window.lenis.scrollTo(absY, { immediate: false });
        } else {
          window.scrollTo(0, absY);
        }

        if (currentRelY >= scrollMax) {
          clearInterval(intervalId);
          setTimeout(() => {
            isSampling = false;
            resolve(samples);
          }, 600);
        }
      }, stepInterval);
    });
  }, c2Offset);

  const c2Speeds = c2Results.map((s) => s.speed).filter((s) => s > 0);
  c2Speeds.sort((a, b) => a - b);
  const c2MedianSpeed = c2Speeds[Math.floor(c2Speeds.length / 2)] || 1;
  const c2MaxSpeed = c2Speeds[c2Speeds.length - 1] || 1;
  const c2Ratio = Math.round((c2MaxSpeed / c2MedianSpeed) * 100) / 100;

  const c2Bursts = [];
  for (let i = 0; i < c2Results.length; i++) {
    const s = c2Results[i];
    if (s.speed > 2.2 * c2MedianSpeed && s.speed > 2.0) {
      c2Bursts.push({
        index: i,
        time: s.time,
        displayedFrame: s.displayedFrame,
        targetFrame: s.targetFrame,
        speed: s.speed,
        ratio: Math.round((s.speed / c2MedianSpeed) * 10) / 10,
      });
    }
  }

  const c2MaxError = Math.max(...c2Results.map((s) => s.error));
  const c2ErrorGt2 = c2Results.filter((s) => s.error > 2).length;

  console.log(`\nCHAPTER TWO GROUND TRUTH ANALYSIS:`);
  console.log(`  - Median Perceived Speed: ${c2MedianSpeed}`);
  console.log(`  - Max Perceived Speed: ${c2MaxSpeed}`);
  console.log(`  - Max / Median Ratio: ${c2Ratio}`);
  console.log(`  - Max (displayed - target) Error: ${c2MaxError} frames`);
  console.log(`  - Frames with Error > 2: ${c2ErrorGt2}`);
  console.log(`  - Bursts (> 2.2x median): ${c2Bursts.length}`);
  if (c2Bursts.length > 0) {
    console.log(`  - Detected Bursts:`);
    console.table(c2Bursts);
  }

  await browser.close();
}

measurePerceivedSpeed().catch(console.error);
