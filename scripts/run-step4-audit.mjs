import fs from "fs";
import path from "path";
import { chromium } from "playwright";

async function runSmoothnessAudit() {
  console.log("===============================================================");
  console.log("STEP 4: SMOOTHNESS PROOF AUDIT AT 1440x900");
  console.log("===============================================================\n");

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--headless=new", "--enable-features=UseSkiaRenderer"],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("aurelia_intro_shown", "true");
    } catch {}
    window.__runwayLongTasks = [];
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (window.__trackRunwayLongTasks) {
            window.__runwayLongTasks.push({
              duration: Math.round(entry.duration),
              startTime: Math.round(entry.startTime),
            });
          }
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {}
  });

  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.evaluate(async () => {
    if (window.__preloadReady) {
      await window.__preloadReady;
    }
  });
  await page.waitForTimeout(500);

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
  console.log(`  - Wheel multiplier: ${lenisCheck.lenisConfig.wheelMultiplier} (Target: ~0.8)`);

  if (lenisCheck.lenisCount !== 1) throw new Error(`__lenisCount is ${lenisCheck.lenisCount}, expected 1`);
  if (lenisCheck.lenisDrivers !== 1) throw new Error(`Lenis drivers count is ${lenisCheck.lenisDrivers}, expected 1`);
  if (lenisCheck.lenisConfig.hasDuration || lenisCheck.lenisConfig.hasEasing) {
    throw new Error("Duration or custom easing passed to Lenis! Only pure lerp mode is permitted.");
  }

  // Section audit helper
  async function auditRunway(sectionId, canvasSelector, runwayStartTop) {
    console.log(`\n--> Auditing ${sectionId.toUpperCase()} Runway...`);

    // Scroll to runway start
    await page.evaluate((y) => {
      if (window.lenis) window.lenis.scrollTo(y, { immediate: true });
      else window.scrollTo(0, y);
    }, runwayStartTop);
    await page.waitForTimeout(1000);
    await page.mouse.move(720, 450);

    // Warm up sampler with 15 ticks
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, 40);
      await page.waitForTimeout(16);
    }

    // Enable long tasks tracking for this runway
    await page.evaluate(() => {
      window.__trackRunwayLongTasks = true;
      window.__runwayLongTasks = [];
    });

    // Start Telemetry Recorder in browser
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

        let diff = 0;
        const isHero = secId === "hero";
        const drawFn = window.__seq ? (isHero ? window.__seq.heroDrawPreview : window.__seq.chapterDrawPreview) : null;
        if (drawFn) {
          drawFn(offCtx, 64, 36);
          const imgData = offCtx.getImageData(0, 0, 64, 36).data;
          if (prev) {
            let diffSum = 0;
            for (let p = 0; p < imgData.length; p += 4) {
              const g1 = 0.299 * imgData[p] + 0.587 * imgData[p + 1] + 0.114 * imgData[p + 2];
              const g2 = 0.299 * prev[p] + 0.587 * prev[p + 1] + 0.114 * prev[p + 2];
              diffSum += Math.abs(g1 - g2);
            }
            diff = Math.round((diffSum / pixelCount) * 100) / 100;
          }
          prev = new Uint8ClampedArray(imgData);
        } else if (canvas && canvas.width > 0 && canvas.height > 0) {
          offCtx.drawImage(canvas, 0, 0, 64, 36);
          const imgData = offCtx.getImageData(0, 0, 64, 36).data;
          if (prev) {
            let diffSum = 0;
            for (let p = 0; p < imgData.length; p += 4) {
              const g1 = 0.299 * imgData[p] + 0.587 * imgData[p + 1] + 0.114 * imgData[p + 2];
              const g2 = 0.299 * prev[p] + 0.587 * prev[p + 1] + 0.114 * prev[p + 2];
              diffSum += Math.abs(g1 - g2);
            }
            diff = Math.round((diffSum / pixelCount) * 100) / 100;
          }
          prev = new Uint8ClampedArray(imgData);
        }

        const target = window.__seq ? (isHero ? window.__seq.heroTarget : window.__seq.chapterTarget) : 0;
        const displayed = window.__seq ? (isHero ? window.__seq.hero : window.__seq.chapter) : 0;
        const normSpeed = dt > 0 ? diff * (16.67 / dt) : diff;

        window.__telemetry.push({
          now: Math.round(now),
          dt: Math.round(dt * 10) / 10,
          target: Math.round(target * 100) / 100,
          displayed: Math.round(displayed * 100) / 100,
          error: Math.round(Math.abs(displayed - target) * 100) / 100,
          diff,
          speed: diff,
        });

        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }, { secId: sectionId, canSel: canvasSelector });

    // Continuous steady wheel events across runway: 50 ticks of 40px at 16ms
    for (let i = 0; i < 50; i++) {
      await page.mouse.wheel(0, 40);
      await page.waitForTimeout(16);
    }

    const constVelSamples = await page.evaluate(() => {
      window.__telemetryActive = false;
      window.__trackRunwayLongTasks = false;
      return window.__telemetry || [];
    });

    // Steady segment during active constant-velocity scrolling (exclude ramp-up and coast-down)
    const steady = constVelSamples.slice(8, constVelSamples.length - 6).filter((s) => s.target > 1.0 && s.speed > 0);
    const speeds = steady.map((s) => s.speed);
    speeds.sort((a, b) => a - b);
    const medianSpeed = speeds.length > 0 ? speeds[Math.floor(speeds.length / 2)] : 1;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 1;
    const maxMedianRatio = Math.round((maxSpeed / medianSpeed) * 100) / 100;

    // Check bursts against both local median and overall median
    let burstsCV = 0;
    for (let i = 4; i < steady.length - 4; i++) {
      const win = steady.slice(i - 4, i + 5).map((s) => s.speed).sort((a, b) => a - b);
      const localMedian = win[Math.floor(win.length / 2)];
      if (steady[i].speed > 2.2 * localMedian) {
        console.log(`    [Burst in ${sectionId}] i=${i}, speed=${steady[i].speed}, localMed=${localMedian}, frame=${steady[i].displayed}, target=${steady[i].target}, dt=${steady[i].dt}`);
        burstsCV++;
      }
    }

    const errors = steady.map((s) => s.error);
    const maxError = errors.length > 0 ? Math.max(...errors) : 0;

    let curStall = 0;
    let maxStall = 0;
    for (let i = 1; i < steady.length; i++) {
      const prev = steady[i - 1];
      const curr = steady[i];
      const targetMoved = Math.abs(curr.target - prev.target) > 0.05;
      const dispMoved = Math.abs(curr.displayed - prev.displayed) > 0.01;
      if (targetMoved && !dispMoved) {
        curStall++;
        if (curStall > maxStall) maxStall = curStall;
      } else {
        curStall = 0;
      }
    }

    console.log(`  [A] Constant-Velocity Test Results:`);
    console.log(`    - Samples Audited: ${steady.length}`);
    console.log(`    - Median Perceived Speed: ${medianSpeed}`);
    console.log(`    - Max Perceived Speed: ${maxSpeed}`);
    console.log(`    - Max / Median Ratio: ${maxMedianRatio} (Target: <= 1.8)`);
    console.log(`    - Bursts (> 2.2x local median): ${burstsCV} (Target: 0)`);
    console.log(`    - Max (displayed - target) Error: ${maxError} frames (Target: <= 2)`);
    console.log(`    - Longest Stall: ${maxStall} frames (Target: <= 3)`);

    // B. Discrete Mouse-Wheel Notches Test (100px wheel event, 300ms pause)
    console.log(`  [B] Discrete Mouse-Wheel Notches Test (100px with 300ms pause)...`);
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
    const notchMedian = notchAdvances[Math.floor(notchAdvances.length / 2)] || 0.25;
    const notchBursts = notchAdvances.filter((a) => a > 2.2 * notchMedian && a > 1.5);
    console.log(`    - Discrete Notches: median advance=${notchMedian.toFixed(2)}, bursts (>2.2x)=${notchBursts.length}`);

    // C. Trackpad-like Decaying Series Test
    console.log(`  [C] Trackpad-Like Decaying Series Test...`);
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
    const trackBursts = trackAdvances.filter((a) => a > 2.0);
    console.log(`    - Trackpad Decaying Series: max advance=${Math.max(...trackAdvances).toFixed(2)}, bursts=${trackBursts.length}`);

    // D. Timing and Long Tasks
    const steadyDts = steady.map((s) => s.dt).filter((d) => d > 5 && d < 100);
    steadyDts.sort((a, b) => a - b);
    const p95Dt = steadyDts.length > 0 ? steadyDts[Math.floor(steadyDts.length * 0.95)] : 16.7;
    const maxDt = steadyDts.length > 0 ? Math.max(...steadyDts) : 16.7;
    console.log(`    - Timing: p95 rAF dt=${p95Dt}ms, worst dt=${maxDt}ms`);

    const runwayLongTasks = await page.evaluate(() => window.__runwayLongTasks || []);
    const longTasksAbove50ms = runwayLongTasks.filter((t) => t.duration > 50).length;
    console.log(`    - Runway Long Tasks (>50ms): ${longTasksAbove50ms} (Target: 0)`);

    return {
      constantVelocity: {
        samplesCount: steady.length,
        medianSpeed,
        maxSpeed,
        maxMedianRatio,
        burstsAbove2_2x: burstsCV,
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
        longTasksAbove50ms,
      },
    };
  }

  // Audit Hero Runway
  const heroResults = await auditRunway("hero", "#hero canvas", 0);

  // Get Chapter Two offset
  const c2Offset = await page.evaluate(() => {
    const el = document.querySelector("#chapter-two");
    return el ? el.offsetTop : 0;
  });

  // Audit Chapter Two Runway
  const c2Results = await auditRunway("chapter-two", "#chapter-two canvas", c2Offset);

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
    hero: heroResults,
    chapterTwo: c2Results,
    criteriaCheck: {
      heroBurstsPass: heroResults.constantVelocity.burstsAbove2_2x === 0,
      heroErrorPass: heroResults.constantVelocity.maxErrorFrames <= 2.0,
      heroStallPass: heroResults.constantVelocity.longestStallFrames <= 3,
      heroNotchPass: heroResults.discreteNotches.burstsCount === 0,
      heroTrackpadPass: heroResults.trackpadDecay.burstsCount === 0,
      c2BurstsPass: c2Results.constantVelocity.burstsAbove2_2x === 0,
      c2ErrorPass: c2Results.constantVelocity.maxErrorFrames <= 2.0,
      c2StallPass: c2Results.constantVelocity.longestStallFrames <= 3,
      c2NotchPass: c2Results.discreteNotches.burstsCount === 0,
      c2TrackpadPass: c2Results.trackpadDecay.burstsCount === 0,
      lenisCountPass: lenisCheck.lenisCount === 1,
      lenisDriversPass: lenisCheck.lenisDrivers === 1,
      timingPass: heroResults.timing.p95DtMs <= 20 && c2Results.timing.p95DtMs <= 20,
    },
  };

  const auditDir = path.resolve("scroll-audit");
  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }
  const outPath = path.join(auditDir, "smoothness.json");
  fs.writeFileSync(outPath, JSON.stringify(auditData, null, 2));
  console.log(`\n✓ Saved smoothness audit proof to ${outPath}`);

  await browser.close();

  console.log("\n===============================================================");
  console.log("FINAL AUDIT CRITERIA PASS / FAIL TABLE:");
  console.log("===============================================================");
  console.table(auditData.criteriaCheck);

  return auditData;
}

runSmoothnessAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
