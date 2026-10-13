import sharp from "sharp";

async function compareCuts() {
  // Check hero frames 45, 46, 47, 48
  for (const f of [45, 46, 47, 48, 82, 83, 84, 85, 136, 137, 138, 139]) {
    const pad = String(f).padStart(4, "0");
    const meta = await sharp(`public/hero/frame_${pad}.webp`).metadata();
    console.log(`Hero Frame ${f}: ${meta.width}x${meta.height}`);
  }

  // Check chapter two frames 84, 85, 86, 87, 149, 150, 151, 152
  for (const f of [84, 85, 86, 87, 149, 150, 151, 152]) {
    const pad = String(f).padStart(4, "0");
    const meta = await sharp(`public/chapter-two/frame_${pad}.webp`).metadata();
    console.log(`Chapter Two Frame ${f}: ${meta.width}x${meta.height}`);
  }
}

compareCuts().catch(console.error);
