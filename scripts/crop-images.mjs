import sharp from "sharp";
import path from "path";

async function main() {
  const src = "C:/Users/SaranSM/.gemini/antigravity-ide/brain/927cd4fd-d4a6-4aa7-8c37-bf42710708e0/testimonial_3_1791803758091.jpg";

  // 1. menu-cortado.webp: close crop on the faceted cortado glass
  await sharp(src)
    .extract({ left: 340, top: 430, width: 340, height: 340 })
    .resize(600, 600)
    .webp({ quality: 90 })
    .toFile("public/images/menu-cortado.webp");
  console.log("✓ Created unique menu-cortado.webp");

  // 2. reserve-tall.webp: warm cafe table with coffee, candle, croissant, book
  await sharp(src)
    .extract({ left: 160, top: 0, width: 672, height: 896 })
    .resize(900, 1200)
    .webp({ quality: 90 })
    .toFile("public/images/reserve-tall.webp");
  console.log("✓ Created unique reserve-tall.webp");
}

main().catch(console.error);
