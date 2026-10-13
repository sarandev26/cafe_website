import fs from "fs";
import path from "path";
import sharp from "sharp";

async function detectCutsForDir(dir, name) {
  console.log(`==> Analyzing ${name} frame sequence in ${dir} for scene cuts...`);

  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return [];
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => /^frame_\d{4}\.webp$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  console.log(`Found ${files.length} frames in ${dir}`);
  if (files.length === 0) return [];

  const processedFrames = [];
  const WIDTH = 64;
  const HEIGHT = 36;
  const PIXELS = WIDTH * HEIGHT;

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(dir, files[i]);
    const buffer = await sharp(filePath)
      .resize(WIDTH, HEIGHT, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer();
    processedFrames.push(buffer);
  }

  // Compute Mean Absolute Difference (MAD) between consecutive frames
  const diffs = [];
  for (let i = 0; i < processedFrames.length - 1; i++) {
    const cur = processedFrames[i];
    const nxt = processedFrames[i + 1];
    let sumDiff = 0;
    for (let p = 0; p < PIXELS; p++) {
      sumDiff += Math.abs(cur[p] - nxt[p]);
    }
    const mad = sumDiff / PIXELS;
    diffs.push({
      frameIndex: i,
      nextIndex: i + 1,
      mad,
    });
  }

  // Find local diff spikes with rolling window
  const cutCandidates = [];
  for (let i = 2; i < diffs.length - 2; i++) {
    const local = (diffs[i - 2].mad + diffs[i - 1].mad + diffs[i + 1].mad + diffs[i + 2].mad) / 4;
    const ratio = diffs[i].mad / (local || 0.001);
    if (ratio > 1.35 && diffs[i].mad > 5.0) {
      cutCandidates.push({
        cutFrame: diffs[i].frameIndex,
        nextFrame: diffs[i].nextIndex,
        diffScore: Math.round(diffs[i].mad * 100) / 100,
        ratio: Math.round(ratio * 100) / 100,
      });
    }
  }

  // Clustered cuts: ensure at least 12 frames between separate scene cuts
  const finalCuts = [];
  for (const c of cutCandidates) {
    const existsNearby = finalCuts.find((fc) => Math.abs(fc.cutFrame - c.cutFrame) < 12);
    if (!existsNearby) {
      finalCuts.push(c);
    } else if (c.diffScore > existsNearby.diffScore) {
      existsNearby.cutFrame = c.cutFrame;
      existsNearby.nextFrame = c.nextFrame;
      existsNearby.diffScore = c.diffScore;
      existsNearby.ratio = c.ratio;
    }
  }

  finalCuts.sort((a, b) => a.cutFrame - b.cutFrame);
  console.log(`\nDetected Scene Cuts for ${name}:`, finalCuts.map((c) => c.cutFrame));
  console.table(finalCuts);

  // Update manifest if exists
  const manifestPath = path.join(dir, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.cutIndices = finalCuts.map((c) => c.cutFrame);
    manifest.cuts = finalCuts;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    console.log(`Updated ${manifestPath}`);
  }

  return finalCuts;
}

async function main() {
  await detectCutsForDir(path.resolve("public/hero"), "Hero");
  await detectCutsForDir(path.resolve("public/chapter-two"), "Chapter Two");
}

main().catch((err) => {
  console.error("Error detecting cuts:", err);
  process.exit(1);
});
