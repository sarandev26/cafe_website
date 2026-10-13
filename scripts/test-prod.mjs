async function test() {
  const res = await fetch("http://localhost:3000");
  const html = await res.text();
  console.log("Status:", res.status);
  console.log("HTML length:", html.length);

  const sections = (html.match(/data-section="([^"]+)"/g) || []).map((s) => s.replace(/data-section="|"/g, ""));
  console.log("Sections found on production page:", sections);

  const checks = {
    hasHero: sections.includes("hero"),
    hasSignatures: sections.includes("signatures"),
    hasCraft: sections.includes("craft"),
    hasStory: sections.includes("story"),
    hasIngredients: sections.includes("ingredients"),
    hasStats: sections.includes("stats"),
    hasMenu: sections.includes("menu"),
    hasGallery: sections.includes("gallery"),
    hasTestimonials: sections.includes("testimonials"),
    hasVisit: sections.includes("visit"),
    hasFooter: sections.includes("footer"),
    noEstEyebrowInHero: !html.includes("EST. 2026 · SPECIALTY COFFEE HOUSE"),
    noStepInside: !html.includes("Step inside."),
    noNewsletterInput: !html.includes("Enter your email address"),
    hasGoogleMapEmbed: html.includes("https://www.google.com/maps"),
    hasReserveTableCard: html.includes("Reserve your table"),
    hasChefsPicks: html.includes("Chef&#x27;s Picks") || html.includes("Chef's Picks"),
    hasIndianRupeePrices: html.includes("₹280") && html.includes("₹310") && html.includes("₹420"),
  };

  console.log("\nAutomated Health Checks:");
  for (const [key, val] of Object.entries(checks)) {
    console.log(`  ${val ? "✓" : "❌"} ${key}: ${val}`);
  }

  // Test reservation API endpoint
  console.log("\nTesting /api/enquiry reservation endpoint...");
  const apiRes = await fetch("http://localhost:3000/api/enquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Dev Verification User",
      email: "guest@example.in",
      phone: "+91 98765 43210",
      date: "2026-10-15",
      time: "11:00",
      guests: 2,
      message: "Corner booth requested",
    }),
  });
  const apiData = await apiRes.json();
  console.log("API Status:", apiRes.status, "Response:", apiData);
}

test().catch(console.error);
