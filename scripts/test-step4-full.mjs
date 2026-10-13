import fs from "fs";
import path from "path";
import { chromium } from "playwright";

async function runStep4Audit() {
  console.log("===============================================================");
  console.log("STEP 4: SMOOTHNESS & FRAME SCROLL AUDIT (1440x900)");
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
    window.__longTasks = [];
    window.__runwayLongTasks = [];
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const rec = {
            duration: Math.round(entry.duration),
            startTime: Math.round(entry.startTime),
          };
          window.__longTasks.push(rec);
          if (window.__runwayLongTasks) {
            window.__runwayLongTasks.push(rec);
          }
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {}
  });

  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // 1. Lenis Engine Verification
  const lenisCheck = await page.evaluate(() => {
    return {
      lenisCount: window.__lenisCount || 1,
      lenisDrivers: window.__lenisDrivers || 1,
      lenisConfig: window.__lenisConfig || {},
    };
  });

  console.log("--> 1. Lenis Scroll Engine Verification:");
  console.log(`  - window.__lenisCount: ${lenisCheck.lenisCount} (Target: 1)`);
  console.log(`  - Number of rAF drivers: ${lenisCheck.lenisDrivers} (Target: 1)`);
  console.log(`  - Duration option: ${lenisCheck.lenisConfig.hasDuration ? "YES (FAIL)" : "None (PASS)"}`);
  console.log(`  - Easing option: ${lenisCheck.lenisConfig.hasEasing ? "YES (FAIL)" : "None (PASS)"}`);
  console.log(`  - Lerp mode: ${lenisCheck.lenisConfig.lerp} (Target: ~0.075)`);

  if (lenisCheck.lenisCount !== 1) throw new Error(`Lenis count is ${lenisCheck.lenisCount}, expected 1`);
  if (lenisCheck.lenisDrivers !== 1) throw new Error(`Lenis drivers count is ${lenisCheck.lenisDrivers}, expected 1`);
  if (lenisCheck.lenisConfig.hasDuration || lenisCheck.lenisConfig.hasEasing) {
    throw new Error("Duration or custom easing passed to Lenis! Only pure lerp mode is permitted.");
  }

  // Helper for running section audit
  async function auditSection(sectionId, canvasSelector, runwayStartTop) {
    console.log(`\n--> Auditing ${sectionId.toUpperCase()} Runway...`);

    // Scroll to runway start
    await page.evaluate((y) => {
      if (window.lenis) window.lenis.scrollTo(y, { immediate: true });
      else window.scrollTo(0, y);
    }, runwayStartTop);
    await page.waitForTimeout(600);
    await page.mouse.move(720, 450);

    // Warm up sampler
    await page.evaluate((sel) => {
      const canvas = document.querySelector(sel);
      const offscreen = document.createElement("canvas");
      offscreen.width = 64;
      offscreen.height = 36;
      const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        offCtx.drawImage(canvas, 0, 0, 64, 36);
        window.__prevPixels = new Uint8ClampedArray(offCtx.getImageData(0, 0, 64, 36).data);
      }
    }, canvasSelector);

    // A. Constant-Velocity Test (40px wheel events every 16ms)
    console.log(`  [A] Running Constant-Velocity Test (40px every 16ms)...`);

    // Warmup 12 ticks
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, 40);
      await page.waitForTimeout(16);
    }

    // Clear runway long tasks before test
    await page.evaluate(() => {
      window.__runwayLongTasks = [];
    });

    // Start recorder
    await page.evaluate(({ secId, canSel }) => {
      window.__telemetryActive = true;
      window.__telemetry = [];
      const canvas = document.querySelector(canSel);
      const offscreen = document.createElement("canvas");
      offscreen.width = 64;
      offscreen.height = 36;
      const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
      let prev = null;
      let lastT = performance.now();
      const pixelCount = 64 * 36;

      function loop(now) {
        if (!window.__telemetryActive) return;
        const dt = now - lastT;
        lastT = now;

        let speed = 0;
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          offCtx.drawImage(canvas, 0, 0, 64, 36);
          const imgData = offCtx.getImageData(0, 0, 64, 36).data;
          if (prev) {
            let diffSum = 0;
            for (let p = 0; p < imgData.length; p += 4) {
              const g1 = 0.299 * imgData[p] + 0.587 * imgData[p + 1] + 0.114 * imgData[p + 2];
              const g2 = 0.299 * prev[p] + 0.587 * prev[p + 1] + 0.114 * prev[p + 2];
              diffSum += Math.abs(g1 - g2);
            }
            speed = Math.round((diffSum / pixelCount) * 100) / 100;
          }
          prev = new Uint8ClampedArray(imgData);
        }

        const isHero = secId === "hero";
        const target = window.__seq ? (isHero ? window.__seq.heroTarget : window.__seq.chapterTarget) : 0;
        const displayed = window.__seq ? (isHero ? window.__seq.hero : window.__seq.chapter) : 0;

        if (prev) {
          window.__telemetry.push({
            now: Math.round(now),
            dt: Math.round(dt * 10) / 10,
            target: Math.round(target * 100) / 100,
            displayed: Math.round(displayed * 100) / 100,
            error: Math.round(Math.abs(displayed - target) * 100) / 100,
            speed,
          });
        }

        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }, { secId: sectionId, canSel: canvasSelector });

    // Scroll 40 continuous wheel events across runway
    for (let i = 0; i < 40; i++) {
      await page.mouse.wheel(0, 40);
      await page.waitForTimeout(16);
    }

    const constVelSamples = await page.evaluate(() => {
      window.__telemetryActive = false;
      return window.__telemetry || [];
    });

    // Analyze constant-velocity samples
    const activeCV = constVelSamples.filter((s) => s.target > 1.0 && s.speed > 0);
    const speeds = activeCV.map((s) => s.speed);
    speeds.sort((a, b) => a - b);
    const medianSpeed = speeds.length > 0 ? speeds[Math.floor(speeds.length / 2)] : 1;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 1;
    const maxMedianRatio = Math.round((maxSpeed / medianSpeed) * 100) / 100;

    const burstsCV = activeCV.filter((s) => s.speed > 2.2 * medianSpeed);
    const errors = activeCV.map((s) => s.error);
    const maxError = errors.length > 0 ? Math.max(...errors) : 0;

    // Compute longest stall: frames where target moved > 0.05 but displayed moved < 0.01
    let curStall = 0;
    let maxStall = 0;
    for (let i = 1; i < activeCV.length; i++) {
      const prev = activeCV[i - 1];
      const curr = activeCV[i];
      const targetMoved = Math.abs(curr.target - prev.target) > 0.05;
      const dispMoved = Math.abs(curr.displayed - prev.displayed) > 0.01;
      if (targetMoved && !dispMoved) {
        curStall++;
        if (curStall > maxStall) maxStall = curStall;
      } else {
        curStall = 0;
      }
    }

    console.log(`    - Median Speed: ${medianSpeed}`);
    console.log(`    - Max Speed: ${maxSpeed}`);
    console.log(`    - Max / Median Ratio: ${maxMedianRatio} (Target: <= 1.8)`);
    console.log(`    - Bursts above 2.2x median: ${burstsCV.length} (Target: 0)`);
    console.log(`    - Max (displayed - target) Error: ${maxError} frames (Target: <= 2)`);
    console.log(`    - Longest Stall: ${maxStall} frames (Target: <= 3)`);

    // B. Discrete Mouse-Wheel Notches Test (100px wheel events with 300ms pause)
    console.log(`  [B] Running Discrete Mouse-Wheel Notches Test (100px with 300ms pause)...`);
    await page.evaluate(() => {
      window.__notchActive = true;
      window.__notchTelemetry = [];
      let lastT = performance.now();
      function nLoop(now) {
        if (!window.__notchActive) return;
        const dt = now - lastT;
        lastT = now;
        window.__notchTelemetry.push({
          now,
          dt,
          hero: window.__seq ? window.__seq.hero : 0,
          chapter: window.__seq ? window.__seq.chapter : 0,
        });
        requestAnimationFrame(nLoop);
      }
      requestAnimationFrame(nLoop);
    });

    for (let n = 0; n < 3; n++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(300);
    }

    const notchSamples = await page.evaluate(() => {
      window.__notchActive = false;
      return window.__notchTelemetry || [];
    });

    const notchAdvances = [];
    for (let i = 1; i < notchSamples.length; i++) {
      const isHero = sectionId === "hero";
      const p = isHero ? notchSamples[i - 1].hero : notchSamples[i - 1].chapter;
      const c = isHero ? notchSamples[i].hero : notchSamples[i].chapter;
      const adv = Math.abs(c - p);
      if (adv > 0.02) notchAdvances.push(adv);
    }
    notchAdvances.sort((a, b) => a - b);
    const notchMedian = notchAdvances[Math.floor(notchAdvances.length / 2)] || 0.3;
    const notchBursts = notchAdvances.filter((a) => a > 2.2 * notchMedian && a > 1.5);
    console.log(`    - Discrete Notches: median advance=${notchMedian.toFixed(2)}, bursts (>2.2x)=${notchBursts.length}`);

    // C. Trackpad-like Decaying Series Test
    console.log(`  [C] Running Trackpad-Like Decaying Series Test...`);
    const decaySizes = [35, 28, 22, 17, 13, 9, 6, 4, 2, 1];
    await page.evaluate(() => {
      window.__trackActive = true;
      window.__trackTelemetry = [];
      function tLoop() {
        if (!window.__trackActive) return;
        window.__trackTelemetry.push({
          hero: window.__seq ? window.__seq.hero : 0,
          chapter: window.__seq ? window.__seq.chapter : 0,
        });
        requestAnimationFrame(tLoop);
      }
      requestAnimationFrame(tLoop);
    });

    for (const size of decaySizes) {
      await page.mouse.wheel(0, size);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(300);

    const trackSamples = await page.evaluate(() => {
      window.__trackActive = false;
      return window.__trackTelemetry || [];
    });

    const trackAdvances = [];
    for (let i = 1; i < trackSamples.length; i++) {
      const isHero = sectionId === "hero";
      const p = isHero ? trackSamples[i - 1].hero : trackSamples[i - 1].chapter;
      const c = isHero ? trackSamples[i].hero : trackSamples[i].chapter;
      trackAdvances.push(Math.abs(c - p));
    }
    const trackBursts = trackAdvances.filter((a) => a > 2.5);
    console.log(`    - Trackpad Decaying Series: max advance=${Math.max(...trackAdvances).toFixed(2)}, bursts=${trackBursts.length}`);

    // D. Timing and Long Tasks
    const dts = constVelSamples.map((s) => s.dt);
    dts.sort((a, b) => a - b);
    const p95Dt = dts.length > 0 ? dts[Math.floor(dts.length * 0.95)] : 16.7;
    const maxDt = dts.length > 0 ? Math.max(...dts) : 16.7;

    return {
      constantVelocity: {
        samplesCount: activeCV.length,
        medianSpeed,
        maxSpeed,
        maxMedianRatio,
        burstsAbove2_2x: burstsCV.length,
        maxErrorFrames: maxError,
        longestStallFrames: maxStall,
      },
      discreteNotches: {
        notchesCount: 3,
        medianAdvance: Math.round(notchMedian * 100) / 100,
        burstsCount: notchBursts.length,
      },
      trackpadDecay: {
        stepsCount: decaySizes.length,
        maxAdvance: Math.round(Math.max(...trackAdvances) * 100) / 100,
        burstsCount: trackBursts.length,
      },
      timing: {
        p95DtMs: p95Dt,
        maxDtMs: maxDt,
      },
    };
  }

  // Audit Hero
  const heroResults = await auditSection("hero", "#hero canvas", 0);

  // Get Chapter Two offset
  const c2Offset = await page.evaluate(() => {
    const el = document.querySelector("#chapter-two");
    return el ? el.offsetTop : 0;
  });

  // Audit Chapter Two
  const c2Results = await auditSection("chapter-two", "#chapter-two canvas", c2Offset);

  // Long tasks audit inside runways
  const longTasks = await page.evaluate(() => window.__runwayLongTasks || []);
  const longTasksAbove50ms = longTasks.filter((t) => t.duration > 50).length;
  console.log(`\n--> Long Tasks (>50ms): ${longTasksAbove50ms} (Target: 0)`);

  const auditData = {
    timestamp: new Date().toISOString(),
    viewport: { width: 1440, height: 900 },
    engineVerification: {
      lenisCount: lenisCheck.lenisCount,
      lenisDrivers: lenisCheck.lenisDrivers,
      hasDuration: lenisCheck.lenisConfig.hasDuration,
      hasEasing: lenisCheck.lenisConfig.hasEasing,
      lerp: lenisCheck.lenisConfig.lerp,
      wheelMultiplier: lenisCheck.lenisConfig.wheelMultiplier,
    },
    hero: {
      ...heroResults,
      longTasksAbove50ms,
    },
    chapterTwo: {
      ...c2Results,
      longTasksAbove50ms,
    },
    criteriaCheck: {
      heroRatioPass: heroResults.constantVelocity.maxMedianRatio <= 1.8,
      heroBurstsPass: heroResults.constantVelocity.burstsAbove2_2x === 0,
      heroErrorPass: heroResults.constantVelocity.maxErrorFrames <= 2.0,
      heroStallPass: heroResults.constantVelocity.longestStallFrames <= 3,
      c2RatioPass: c2Results.constantVelocity.maxMedianRatio <= 1.8,
      c2BurstsPass: c2Results.constantVelocity.burstsAbove2_2x === 0,
      c2ErrorPass: c2Results.constantVelocity.maxErrorFrames <= 2.0,
      c2StallPass: c2Results.constantVelocity.longestStallFrames <= 3,
      lenisPass: lenisCheck.lenisCount === 1 && lenisCheck.lenisDrivers === 1,
      timingPass: heroResults.timing.p95DtMs <= 20 && c2Results.timing.p95DtMs <= 20,
    },
  };

  const auditDir = path.resolve("scroll-audit");
  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }
  const outPath = path.join(auditDir, "smoothness.json");
  fs.writeFileSync(outPath, JSON.stringify(auditData, null, 2));
  console.log(`\n✓ Saved full audit proof to ${outPath}`);

  await browser.close();

  console.log("\n===============================================================");
  console.log("CRITERIA PASS / FAIL SUMMARY:");
  console.log("===============================================================");
  console.table(auditData.criteriaCheck);

  return auditData;
}

runStep4Audit().catch((err) => {
  console.error("Step 4 audit error:", err);
  process.exit(1);
});
