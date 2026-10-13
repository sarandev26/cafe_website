import { chromium } from "playwright";

async function check() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  const res = await page.evaluate(() => {
    const balanceSec = document.querySelector("#balance");
    const wordSpan = Array.from(balanceSec.querySelectorAll("span")).find(
      (s) => (s.textContent || "").trim() === "BALANCE"
    );
    const spanStyle = window.getComputedStyle(wordSpan);
    const parentStyle = window.getComputedStyle(wordSpan.parentElement);
    const grandStyle = window.getComputedStyle(wordSpan.parentElement.parentElement);

    const underlineEls = Array.from(balanceSec.querySelectorAll("hr, .underline, [class*='underline']")).map(
      (el) => el.outerHTML.slice(0, 80)
    );

    return {
      textDecorationLine: spanStyle.textDecorationLine,
      borderBottomWidth: spanStyle.borderBottomWidth,
      borderBottomStyle: spanStyle.borderBottomStyle,
      parentBorderBottom: parentStyle.borderBottomWidth,
      underlineEls,
    };
  });

  console.log("Balance inspection:", res);

  // Test mouse move and wheel
  await page.mouse.move(720, 450);
  console.log("Initial scrollY:", await page.evaluate(() => window.scrollY));
  for (let i = 0; i < 20; i++) {
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(400);
  console.log("scrollY after wheel:", await page.evaluate(() => window.scrollY));
  console.log("window.__seq:", await page.evaluate(() => window.__seq));

  await browser.close();
}

check().catch(console.error);
