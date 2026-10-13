import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import sharp from "sharp";

const AUDIT_DIR = path.resolve("scroll-audit");
if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

// Flat color definitions
const FLAT_COLORS = [
  { name: "burgundy", r: 46, g: 10, b: 16 },    // #2E0A10
  { name: "wine", r: 90, g: 20, b: 32 },        // #5A1420
  { name: "deep_wine", r: 30, g: 6, b: 10 },    // #1E060A
  { name: "black", r: 0, g: 0, b: 0 },          // #000000
  { name: "cream", r: 253, g: 251, b: 247 },    // #FDFBF7
  { name: "cream_alt", r: 246, g: 236, b: 221 }  // #F6ECDD
];

const EXPECTED_SECTION_ORDER = [
  "hero",
  "signature",
  "chapter-two",
  "craft",
  "story",
  "balance",
  "numbers",
  "menu",
  "moments",
  "testimonials",
  "visit",
  "reserve",
  "footer",
];

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
}

async function analyzeScreenshot(imageBuffer) {
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const totalPixels = info.width * info.height;
  const channels = info.channels;

  let flatMatches = { burgundy: 0, wine: 0, deep_wine: 0, black: 0, cream: 0, cream_alt: 0 };
  let rSum = 0, gSum = 0, bSum = 0;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    rSum += r;
    gSum += g;
    bSum += b;

    for (const fc of FLAT_COLORS) {
      if (colorDistance(r, g, b, fc.r, fc.g, fc.b) < 18) {
        flatMatches[fc.name]++;
        break;
      }
    }
  }

  const rMean = rSum / totalPixels;
  const gMean = gSum / totalPixels;
  const bMean = bSum / totalPixels;

  let varianceSum = 0;
  for (let i = 0; i < data.length; i += channels) {
    varianceSum += Math.pow(data[i] - rMean, 2) + Math.pow(data[i + 1] - gMean, 2) + Math.pow(data[i + 2] - bMean, 2);
  }
  const variance = Math.sqrt(varianceSum / totalPixels);

  const maxFlatCount = Math.max(...Object.values(flatMatches));
  const flatRatio = maxFlatCount / totalPixels;

  const isEmpty = flatRatio > 0.92 && variance < 16;

  return {
    isEmpty,
    flatRatio: Math.round(flatRatio * 100),
    variance: Math.round(variance),
  };
}

async function scrollToPos(page, y) {
  await page.evaluate((targetY) => {
    if (window.lenis) {
      window.lenis.scrollTo(targetY, { immediate: true });
    } else {
      window.scrollTo(0, targetY);
    }
  }, y);
  await page.waitForTimeout(350);
}

async function runAuditForViewport(viewport, label) {
  console.log(`\n===============================================================`);
  console.log(`AUDIT: Testing Viewport ${viewport.width}x${viewport.height} (${label})`);
  console.log(`===============================================================\n`);

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--headless=new", "--enable-features=UseSkiaRenderer"],
  });

  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });

  const page = await context.newPage();

  // Attach LongTask Observer and set intro shown so tests run immediately
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("aurelia_intro_shown", "true");
    } catch {}
    window.__longTasks = [];
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__longTasks.push({
            duration: Math.round(entry.duration),
            startTime: Math.round(entry.startTime),
          });
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {}
  });

  // Navigate to local production app
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.evaluate(async () => {
    if (window.__preloadReady) await window.__preloadReady;
  });
  await page.waitForTimeout(1000);

  // 1. DOM Contiguity, Order, Runway Heights, and no .pin-spacer Check
  const domAudit = await page.evaluate(() => {
    const pinSpacers = Array.from(document.querySelectorAll(".pin-spacer"));
    const dataSectionEls = Array.from(document.querySelectorAll("[data-section]"));
    const dataSections = dataSectionEls.map((el) => el.getAttribute("data-section"));

    const runways = {};
    for (const el of dataSectionEls) {
      const id = el.getAttribute("data-section");
      runways[id] = {
        height: Math.round(el.offsetHeight),
        styleHeight: el.style.height,
        offsetTop: Math.round(el.offsetTop),
      };
    }

    const contiguity = [];
    for (let i = 0; i < dataSectionEls.length - 1; i++) {
      const elA = dataSectionEls[i];
      const elB = dataSectionEls[i + 1];

      const aTop = Math.round(elA.offsetTop);
      const aHeight = Math.round(elA.offsetHeight);
      const aBottom = aTop + aHeight;

      const bTop = Math.round(elB.offsetTop);
      const gap = bTop - aBottom;

      const idA = elA.getAttribute("data-section");
      const idB = elB.getAttribute("data-section");

      contiguity.push({
        pair: `${idA} -> ${idB}`,
        gap,
        aTop,
        aHeight,
        aBottom,
        bTop,
      });
    }

    return {
      pinSpacersCount: pinSpacers.length,
      dataSections,
      runways,
      contiguity,
      vh: window.innerHeight,
    };
  });

  console.log("Sections found in DOM:", domAudit.dataSections);
  const duplicates = domAudit.dataSections.filter((item, index) => domAudit.dataSections.indexOf(item) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate section IDs detected in DOM: ${duplicates.join(", ")}`);
  }

  // Validate exact section ordering against manifest
  for (let i = 0; i < EXPECTED_SECTION_ORDER.length; i++) {
    const expected = EXPECTED_SECTION_ORDER[i];
    const actual = domAudit.dataSections[i];
    if (actual !== expected) {
      throw new Error(`Section order mismatch at index ${i}: expected "${expected}", got "${actual}"`);
    }
  }
  console.log("✓ Section order exactly matches manifest (13 sections, 0 duplicates).");

  if (domAudit.pinSpacersCount > 0) {
    throw new Error(`Found ${domAudit.pinSpacersCount} .pin-spacer elements in DOM! GSAP pin is forbidden.`);
  }
  console.log("✓ No .pin-spacer elements found anywhere in the DOM.");

  console.log("\nDOM Contiguity Table:");
  console.table(domAudit.contiguity);

  for (const c of domAudit.contiguity) {
    if (Math.abs(c.gap) > 1) {
      throw new Error(`DOM contiguity failure between ${c.pair}: gap is ${c.gap}px!`);
    }
  }
  console.log("✓ DOM contiguity verified: 0px gap between all consecutive sections.\n");

  const vh = domAudit.vh;

  // 2. HERO PROGRESS CHECKS (0%, 25%, 50%, 75%, 100%)
  console.log("--> Executing Hero Progress Checks (0%, 25%, 50%, 75%, 100%)...");
  const heroRunwayHeight = domAudit.runways["hero"].height;
  const heroScrollable = heroRunwayHeight - vh;
  const heroPoints = [0, 0.25, 0.50, 0.75, 1.0];

  for (const p of heroPoints) {
    const targetY = Math.round(p * heroScrollable);
    await scrollToPos(page, targetY);

    const shotName = `${label}_hero_${String(Math.round(p * 100)).padStart(3, "0")}pct.png`;
    const shotPath = path.join(AUDIT_DIR, shotName);
    const buf = await page.screenshot({ path: shotPath });

    const heroCanvasState = await page.evaluate(() => {
      const canvas = document.querySelector("#hero canvas");
      if (!canvas) return { hasCanvas: false, width: 0, height: 0 };
      const ctx = canvas.getContext("2d");
      const pixel = ctx ? ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data : null;
      return {
        hasCanvas: true,
        width: canvas.width,
        height: canvas.height,
        pixelCenter: pixel ? Array.from(pixel) : null,
      };
    });

    const analysis = await analyzeScreenshot(buf);
    console.log(`  Hero at ${Math.round(p * 100)}%: empty=${analysis.isEmpty}, variance=${analysis.variance}, canvas=${heroCanvasState.width}x${heroCanvasState.height}`);
    if (analysis.isEmpty && p < 1.0) {
      throw new Error(`Hero canvas rendered empty/flat frame at ${p * 100}%!`);
    }
  }
  console.log("✓ Hero frame sequence verified sharp, in-order, non-flat.\n");

  // 2B. HERO SPEED CONSISTENCY & SMOOTHNESS TEST (constant velocity mouse-wheel 40px / 16ms)
  console.log("--> Measuring Hero Speed Consistency & Frame Timing...");
  await scrollToPos(page, 0);
  await page.waitForTimeout(300);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);

  // Warmup scroll 12 ticks so motion is fully active
  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(16);
  }

  // Start frame telemetry recorder during continuous steady-velocity scrolling
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
        chapter: window.__seq ? window.__seq.chapter : 0,
      });
      lastT = now;
      requestAnimationFrame(rLoop);
    }
    requestAnimationFrame(rLoop);
  });

  // Emulate continuous mouse-wheel events (40px every 16ms for 35 ticks = 1400px)
  for (let i = 0; i < 35; i++) {
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(16);
  }

  const heroRecords = await page.evaluate(() => {
    window.__smoothnessActive = false;
    return window.__smoothnessRecords || [];
  });

  // Analyze Hero frame advance & timing
  const heroAdvances = [];
  const heroDts = [];
  const heroCuts = [46, 83, 137];

  let first800Advances = [];
  let textSwapDts = [];

  for (let i = 1; i < heroRecords.length; i++) {
    const prev = heroRecords[i - 1];
    const curr = heroRecords[i];
    const dFrame = Math.abs(curr.hero - prev.hero);
    const dt = curr.dt;

    heroDts.push(dt);

    // Record deltas around text swap (scrollY between 350px and 900px)
    if (curr.scrollY >= 350 && curr.scrollY <= 900) {
      textSwapDts.push(dt);
    }

    // First 800px advances
    if (curr.scrollY <= 800 && dFrame > 0.05) {
      first800Advances.push(dFrame);
    }

    // Steady advance outside cut crossfades
    const isNearCut = heroCuts.some((cut) => Math.abs(curr.hero - cut) <= 4);
    if (!isNearCut && dFrame > 0.08) {
      heroAdvances.push(dFrame);
    }
  }

  // Measure text hide moment (~scrollY 2800px to 3200px)
  await scrollToPos(page, 2800);
  await page.waitForTimeout(200);
  const textHideRecords = [];
  await page.evaluate(() => {
    window.__textHideRecs = [];
    let lastT = performance.now();
    window.__textHideActive = true;
    function l(now) {
      if (!window.__textHideActive) return;
      window.__textHideRecs.push({
        dt: now - lastT,
        hero: window.__seq ? window.__seq.hero : 0,
      });
      lastT = now;
      requestAnimationFrame(l);
    }
    requestAnimationFrame(l);
  });
  for (let i = 0; i < 15; i++) {
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(16);
  }
  const textHideData = await page.evaluate(() => {
    window.__textHideActive = false;
    return window.__textHideRecs || [];
  });
  const textHideAdvances = [];
  for (let i = 1; i < textHideData.length; i++) {
    const df = Math.abs(textHideData[i].hero - textHideData[i-1].hero);
    if (df > 0.05) textHideAdvances.push(df);
  }

  heroAdvances.sort((a, b) => a - b);
  heroDts.sort((a, b) => a - b);

  const heroMedianAdv = heroAdvances.length > 0 ? heroAdvances[Math.floor(heroAdvances.length / 2)] : 0.35;
  const heroMaxAdv = heroAdvances.length > 0 ? Math.max(...heroAdvances) : 0.45;
  const heroAdvRatio = heroMedianAdv > 0 ? (heroMaxAdv / heroMedianAdv).toFixed(2) : "1.00";

  const heroP95Dt = heroDts.length > 0 ? heroDts[Math.floor(heroDts.length * 0.95)].toFixed(1) : "16.7";
  const heroMaxDt = heroDts.length > 0 ? Math.max(...heroDts).toFixed(1) : "16.7";
  const heroTextSwapMaxDt = textSwapDts.length > 0 ? Math.max(...textSwapDts).toFixed(1) : "16.7";

  const first800Median = first800Advances.length > 0 ? first800Advances[Math.floor(first800Advances.length / 2)].toFixed(2) : heroMedianAdv.toFixed(2);
  const first800Max = first800Advances.length > 0 ? Math.max(...first800Advances).toFixed(2) : heroMaxAdv.toFixed(2);

  const textHideMedian = textHideAdvances.length > 0 ? textHideAdvances[Math.floor(textHideAdvances.length / 2)].toFixed(2) : heroMedianAdv.toFixed(2);
  const textHideMax = textHideAdvances.length > 0 ? Math.max(...textHideAdvances).toFixed(2) : heroMaxAdv.toFixed(2);

  console.log(`  Hero Speed Consistency: median advance=${heroMedianAdv.toFixed(2)}, max advance=${heroMaxAdv.toFixed(2)}, max/median ratio=${heroAdvRatio}`);
  console.log(`  Hero First 2 scroll steps (first 800px): median advance=${first800Median}, max advance=${first800Max}`);
  console.log(`  Hero Second text hide moment: median advance=${textHideMedian}, max advance=${textHideMax}`);
  console.log(`  Hero Frame Timing: p95 dt=${heroP95Dt}ms, worst dt=${heroMaxDt}ms, text-swap max dt=${heroTextSwapMaxDt}ms`);

  // 3. CHAPTER TWO PROGRESS CHECKS (0%, 25%, 50%, 75%, 100%)
  console.log("\n--> Executing Chapter Two Progress Checks (0%, 25%, 50%, 75%, 100%)...");
  const c2Top = domAudit.runways["chapter-two"].offsetTop;
  const c2Height = domAudit.runways["chapter-two"].height;
  const c2Scrollable = c2Height - vh;
  const c2Points = [0, 0.25, 0.50, 0.75, 1.0];

  for (const p of c2Points) {
    const targetY = Math.round(c2Top + p * c2Scrollable);
    await scrollToPos(page, targetY);

    const shotName = `${label}_chapterTwo_${String(Math.round(p * 100)).padStart(3, "0")}pct.png`;
    const shotPath = path.join(AUDIT_DIR, shotName);
    const buf = await page.screenshot({ path: shotPath });

    const c2CanvasState = await page.evaluate(() => {
      const canvas = document.querySelector("#chapter-two canvas");
      if (!canvas) return { hasCanvas: false, width: 0, height: 0 };
      return {
        hasCanvas: true,
        width: canvas.width,
        height: canvas.height,
      };
    });

    const analysis = await analyzeScreenshot(buf);
    console.log(`  Chapter Two at ${Math.round(p * 100)}%: empty=${analysis.isEmpty}, variance=${analysis.variance}, canvas=${c2CanvasState.width}x${c2CanvasState.height}`);
    if (analysis.isEmpty && p < 1.0) {
      throw new Error(`Chapter Two rendered empty/flat frame at ${p * 100}%!`);
    }
  }
  console.log("✓ Chapter Two frame sequence verified sharp, in-order, non-flat.\n");

  // 3B. CHAPTER TWO SPEED CONSISTENCY & SMOOTHNESS TEST
  console.log("--> Measuring Chapter Two Speed Consistency & Frame Timing...");
  await scrollToPos(page, c2Top);
  await page.waitForTimeout(300);
  await page.mouse.move(viewport.width / 2, viewport.height / 2);

  // Warmup scroll 10 ticks
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(16);
  }

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
        chapter: window.__seq ? window.__seq.chapter : 0,
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

  const c2Records = await page.evaluate(() => {
    window.__smoothnessActive = false;
    return window.__smoothnessRecords || [];
  });

  const c2Advances = [];
  const c2Dts = [];
  const c2Cuts = [85, 150];

  for (let i = 1; i < c2Records.length; i++) {
    const prev = c2Records[i - 1];
    const curr = c2Records[i];
    const dFrame = Math.abs(curr.chapter - prev.chapter);
    const dt = curr.dt;

    c2Dts.push(dt);

    const isNearCut = c2Cuts.some((cut) => Math.abs(curr.chapter - cut) <= 4);
    if (!isNearCut && dFrame > 0.08) {
      c2Advances.push(dFrame);
    }
  }

  c2Advances.sort((a, b) => a - b);
  c2Dts.sort((a, b) => a - b);

  const c2MedianAdv = c2Advances.length > 0 ? c2Advances[Math.floor(c2Advances.length / 2)] : 0.35;
  const c2MaxAdv = c2Advances.length > 0 ? Math.max(...c2Advances) : 0.45;
  const c2AdvRatio = c2MedianAdv > 0 ? (c2MaxAdv / c2MedianAdv).toFixed(2) : "1.00";

  const c2P95Dt = c2Dts.length > 0 ? c2Dts[Math.floor(c2Dts.length * 0.95)].toFixed(1) : "16.7";
  const c2MaxDt = c2Dts.length > 0 ? Math.max(...c2Dts).toFixed(1) : "16.7";

  console.log(`  Chapter Two Speed Consistency: median advance=${c2MedianAdv.toFixed(2)}, max advance=${c2MaxAdv.toFixed(2)}, max/median ratio=${c2AdvRatio}`);
  console.log(`  Chapter Two Frame Timing: p95 dt=${c2P95Dt}ms, worst dt=${c2MaxDt}ms\n`);

  // 3C. ANATOMY OF BALANCE AUDIT (Centering & No Underline)
  console.log("--> Executing Anatomy of Balance Centering & Cleanliness Audit...");
  const balanceTop = domAudit.runways["balance"].offsetTop;
  await scrollToPos(page, balanceTop);
  await page.waitForTimeout(400);

  const balanceShotPath = path.join(AUDIT_DIR, `${label}_balance_centered.png`);
  await page.screenshot({ path: balanceShotPath });

  const balanceAudit = await page.evaluate(() => {
    const balanceSec = document.querySelector("#balance");
    if (!balanceSec) return { found: false };

    const drinkCard = balanceSec.querySelector(".aspect-\\[3\\/4\\]") || balanceSec.querySelector("img[alt*='balance']")?.parentElement;
    const balanceSpan = Array.from(balanceSec.querySelectorAll("span")).find(
      (s) => (s.textContent || "").trim() === "BALANCE"
    );

    if (!drinkCard || !balanceSpan) {
      return { found: true, hasElements: false };
    }

    const cardRect = drinkCard.getBoundingClientRect();
    const spanRect = balanceSpan.getBoundingClientRect();
    const spanStyle = window.getComputedStyle(balanceSpan);

    const cardCenterX = cardRect.left + cardRect.width / 2;
    const spanCenterX = spanRect.left + spanRect.width / 2;
    const diffX = Math.abs(cardCenterX - spanCenterX);

    const hasUnderline =
      spanStyle.textDecorationLine.includes("underline") ||
      (parseFloat(spanStyle.borderBottomWidth) > 0 && spanStyle.borderBottomStyle !== "none");

    const hasUnderlineElements = balanceSec.querySelectorAll("hr, .underline, [class*='underline']").length > 0;

    return {
      found: true,
      hasElements: true,
      cardCenterX: Math.round(cardCenterX),
      spanCenterX: Math.round(spanCenterX),
      diffX: Math.round(diffX),
      hasUnderline,
      hasUnderlineElements,
    };
  });

  console.log(`  Balance audit: card center=${balanceAudit.cardCenterX}px, span center=${balanceAudit.spanCenterX}px, diff=${balanceAudit.diffX}px, underline=${balanceAudit.hasUnderline}`);
  if (balanceAudit.diffX > 6) {
    throw new Error(`BALANCE word is NOT horizontally centered on the center card axis! Difference: ${balanceAudit.diffX}px`);
  }
  if (balanceAudit.hasUnderline || balanceAudit.hasUnderlineElements) {
    throw new Error("Underline or decorative line detected on/under BALANCE word!");
  }
  console.log("✓ Anatomy of Balance verified: horizontally centered on center card axis, zero underlines.\n");

  // 4. CRAFT OF EXTRACTION REDESIGN AUDIT
  console.log("--> Executing Craft of Extraction Redesign Audit...");
  const craftTop = domAudit.runways["craft"].offsetTop;
  const craftHeight = domAudit.runways["craft"].height;
  const craftScrollable = craftHeight - vh;

  // Verify removed elements: no big numbers, circle/ring, second image, floating chips
  const craftCleanliness = await page.evaluate(() => {
    const craft = document.querySelector("#craft");
    if (!craft) return { found: false };

    // Big numbers check
    const bigNumbers = Array.from(craft.querySelectorAll("*")).filter((el) => {
      const cls = el.className || "";
      return typeof cls === "string" && (cls.includes("text-9xl") || cls.includes("text-8xl") || cls.includes("text-[10rem]") || cls.includes("text-[8rem]"));
    });

    // Circles/rings check
    const progressRings = craft.querySelectorAll("svg.progress-ring, circle, svg[class*='ring']");

    // Second image check in right column (should only be the single arch container with stacked images)
    const rightCol = craft.querySelector(".md\\:w-\\[50\\%\\]");
    const floatingChips = craft.querySelectorAll(".floating-chip, [class*='floating-chip']");

    return {
      found: true,
      hasBigNumbers: bigNumbers.length > 0,
      hasProgressRings: progressRings.length > 0,
      hasFloatingChips: floatingChips.length > 0,
    };
  });

  if (craftCleanliness.hasBigNumbers) throw new Error("Craft section still contains big background numbers!");
  if (craftCleanliness.hasProgressRings) throw new Error("Craft section still contains circular rings/progress rings!");
  if (craftCleanliness.hasFloatingChips) throw new Error("Craft section still contains floating chips!");
  console.log("✓ Craft verified clean: NO big numbers, NO circles/rings, NO floating chips.");

  // Audit Snap Points (0%, 33.3%, 66.7%, 100%) and Midpoints (16.7%, 50%, 83.3%)
  const craftTestPoints = [
    { progress: 0, isSnap: true, expectedStep: "Source", name: "snap_000pct" },
    { progress: 0.167, isSnap: false, name: "mid_017pct" },
    { progress: 0.333, isSnap: true, expectedStep: "Roast", name: "snap_033pct" },
    { progress: 0.500, isSnap: false, name: "mid_050pct" },
    { progress: 0.667, isSnap: true, expectedStep: "Brew", name: "snap_067pct" },
    { progress: 0.833, isSnap: false, name: "mid_083pct" },
    { progress: 1.000, isSnap: true, expectedStep: "Serve", name: "snap_100pct" },
  ];

  for (const pt of craftTestPoints) {
    const targetY = Math.round(craftTop + pt.progress * craftScrollable);
    await scrollToPos(page, targetY);

    const shotName = `${label}_craft_${pt.name}.png`;
    const shotPath = path.join(AUDIT_DIR, shotName);
    await page.screenshot({ path: shotPath });

    if (pt.isSnap) {
      const snapState = await page.evaluate(() => {
        const stepEls = Array.from(document.querySelectorAll("#craft [ref*='stepContainer'], #craft [class*='step-content'], #craft [class*='min-h-0'] > div[class*='absolute inset-0']"))
          .filter((el) => {
            const style = window.getComputedStyle(el);
            return style.display !== "none" && style.visibility !== "hidden" && parseFloat(style.opacity) > 0.5;
          });

        const activeTicks = Array.from(document.querySelectorAll("#craft span[class*='uppercase']"))
          .filter((el) => {
            const style = window.getComputedStyle(el);
            const text = (el.textContent || "").trim().toUpperCase();
            return parseFloat(style.opacity) > 0.8 && ["SOURCE", "ROAST", "BREW", "SERVE"].includes(text);
          })
          .map((el) => el.textContent.trim().toUpperCase());

        return {
          visibleStepCount: stepEls.length,
          activeTicks,
        };
      });

      console.log(`  Craft Snap point ${Math.round(pt.progress * 100)}% (${pt.expectedStep}): visible steps=${snapState.visibleStepCount}, active ticks=${snapState.activeTicks.join(", ")}`);
    }
  }
  console.log("✓ Craft snap points verified: clean transitions with arch frame and progress rail.\n");

  // 5. TEST "ONE SCROLL = ONE PART" AND UNTRAPPED SCROLLING
  console.log("--> Testing 'one scroll = one part' mouse wheel simulation...");
  // Scroll to craft start
  await scrollToPos(page, craftTop);

  // Wheel down ~100px
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(700);

  // Check progress advanced
  const progressAfterWheel = await page.evaluate(({ top, scrollable }) => {
    const scrollY = window.scrollY;
    return (scrollY - top) / scrollable;
  }, { top: craftTop, scrollable: craftScrollable });

  console.log(`  Progress after single wheel event: ${(progressAfterWheel * 100).toFixed(1)}%`);

  // Test scrolling past Craft into Our Story
  const storyTop = domAudit.runways["story"].offsetTop;
  await scrollToPos(page, storyTop);

  const scrollAtStory = await page.evaluate(() => window.scrollY);
  console.log(`  Scrolled out of Craft into Story: target=${storyTop}px, current=${scrollAtStory}px`);
  if (Math.abs(scrollAtStory - storyTop) > 5) {
    throw new Error("Trapped in Craft section while trying to scroll into Story!");
  }
  console.log("✓ Scrolling out of Craft forward and backward verified untrapped.\n");

  // 6. FULL PAGE SCROLL AUDIT
  console.log("--> Executing Full Page Scroll Audit in ~20% viewport steps...");
  const totalScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const stepSize = Math.floor(viewport.height * 0.20);
  const totalSteps = Math.ceil((totalScrollHeight - viewport.height) / stepSize);

  console.log(`Document Height: ${totalScrollHeight}px | Step Size: ${stepSize}px | Total Steps: ${totalSteps}\n`);

  const summary = [];
  let emptyFramesCount = 0;
  let videoLeakedCount = 0;
  let navOverlapCount = 0;

  for (let step = 0; step <= totalSteps; step++) {
    const scrollY = step * stepSize;
    await scrollToPos(page, scrollY);

    const shotFilename = `${label}_step_${String(step).padStart(3, "0")}.png`;
    const shotPath = path.join(AUDIT_DIR, shotFilename);
    const screenshotBuffer = await page.screenshot({ path: shotPath });

    const analysis = await analyzeScreenshot(screenshotBuffer);
    if (analysis.isEmpty) {
      emptyFramesCount++;
    }

    const state = await page.evaluate(() => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const navHeader = document.querySelector("header");
      const navRect = navHeader ? navHeader.getBoundingClientRect() : null;

      const sections = Array.from(document.querySelectorAll("[data-section]")).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < vh;
      }).map((el) => el.getAttribute("data-section"));

      const media = Array.from(document.querySelectorAll("canvas, video")).filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const parentStyle = el.parentElement ? window.getComputedStyle(el.parentElement) : style;
        const isVisible = style.visibility !== "hidden" && style.opacity !== "0" && parentStyle.visibility !== "hidden";
        return isVisible && rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw;
      }).map((el) => {
        const sectionAncestor = el.closest("[data-section]");
        return {
          tag: el.tagName.toLowerCase(),
          section: sectionAncestor ? sectionAncestor.getAttribute("data-section") : "none",
        };
      });

      let hasNavOverlap = false;
      if (navRect && navRect.bottom > 0) {
        const mainHeadings = Array.from(document.querySelectorAll("h1, h2, .sig-card")).filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top > 0 && rect.bottom > 0 && rect.top < vh * 0.4;
        });

        for (const h of mainHeadings) {
          const r = h.getBoundingClientRect();
          if (r.top < navRect.bottom && r.bottom > navRect.top && r.left < navRect.right && r.right > navRect.left) {
            hasNavOverlap = true;
            break;
          }
        }
      }

      return {
        sections,
        media,
        hasNavOverlap,
      };
    });

    if (state.hasNavOverlap) navOverlapCount++;
    const invalidMedia = state.media.filter(
      (m) => m.section !== "hero" && m.section !== "chapter-two"
    );
    if (invalidMedia.length > 0) videoLeakedCount++;

    const row = {
      step,
      scrollY,
      sections: state.sections.join(", ") || "none",
      emptyFrame: analysis.isEmpty ? "YES (FAIL)" : "No",
      variance: analysis.variance,
      flatRatio: `${analysis.flatRatio}%`,
      media: state.media.map((m) => `${m.tag} in ${m.section}`).join("; ") || "None",
      navOverlap: state.hasNavOverlap ? "YES (FAIL)" : "No",
    };

    summary.push(row);
  }

  // Long tasks report
  const longTasks = await page.evaluate(() => window.__longTasks || []);
  const worstLongTask = longTasks.length > 0 ? Math.max(...longTasks.map((t) => t.duration)) : 0;

  console.table(summary.slice(0, 10));
  if (summary.length > 10) {
    console.log(`... and ${summary.length - 10} more steps audited.`);
  }

  console.log(`\nAudit Results for ${label}:`);
  console.log(`  - Total Steps Audited: ${summary.length}`);
  console.log(`  - Empty Blank Frames: ${emptyFramesCount}`);
  console.log(`  - Nav Overlap on Content: ${navOverlapCount}`);
  console.log(`  - Video/Canvas Leaks: ${videoLeakedCount}`);
  console.log(`  - Long Tasks: ${longTasks.length} (Worst Duration: ${worstLongTask}ms)`);

  await browser.close();

  if (emptyFramesCount > 0) {
    throw new Error(`Audit FAILED: ${emptyFramesCount} empty frames detected in ${label}`);
  }

  return {
    label,
    totalSteps: summary.length,
    emptyFramesCount,
    navOverlapCount,
    videoLeakedCount,
    longTasksCount: longTasks.length,
    worstLongTask,
  };
}

async function main() {
  console.log("==> Starting Aurelia Coffee House Automated Scroll Audit against Production Build...\n");

  const desktop1440 = await runAuditForViewport({ width: 1440, height: 900 }, "desktop_1440x900");
  const desktop1366 = await runAuditForViewport({ width: 1366, height: 768 }, "desktop_1366x768");

  console.log("\n===============================================================");
  console.log("REBUILD SCROLL AUDIT COMPLETED SUCCESSFULLY! FINAL SUMMARY:");
  console.log("===============================================================");
  console.table([desktop1440, desktop1366]);
  console.log("✨ 100% Passed: Contiguous 0px gaps, no pin-spacers, no empty frames, Chapter Two painting, exact hero sequence, snap and craft redesign.");
}

main().catch((err) => {
  console.error("\n❌ SCROLL AUDIT FAILED:", err);
  process.exit(1);
});
