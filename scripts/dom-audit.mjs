import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  const auditData = await page.evaluate(() => {
    // Collect all data-section and pin-spacer elements in document flow
    const elements = Array.from(document.querySelectorAll("main > [data-section], main > .pin-spacer, [data-section]"));
    
    // De-duplicate in order of appearance
    const uniqueElements = [];
    const seen = new Set();
    for (const el of elements) {
      if (!seen.has(el)) {
        seen.add(el);
        uniqueElements.push(el);
      }
    }

    const rects = uniqueElements.map((el, i) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const isPinSpacer = el.classList.contains("pin-spacer");
      const sectionChild = isPinSpacer ? el.querySelector("[data-section]") : null;
      const sectionId = el.getAttribute("data-section") || (sectionChild ? sectionChild.getAttribute("data-section") : "unknown");

      return {
        index: i,
        id: sectionId,
        tagName: el.tagName.toLowerCase(),
        isPinSpacer,
        offsetTop: Math.round(el.offsetTop),
        offsetHeight: Math.round(el.offsetHeight),
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    });

    // Compute gaps
    for (let i = 0; i < rects.length - 1; i++) {
      const current = rects[i];
      const next = rects[i + 1];
      const currentBottom = current.offsetTop + current.offsetHeight;
      const gap = next.offsetTop - currentBottom;
      current.gapToNext = gap;
    }

    return rects;
  });

  console.log("=== DOM AUDIT TABLE (BEFORE FIXES) ===");
  console.table(auditData);

  await browser.close();
}

main().catch(console.error);
