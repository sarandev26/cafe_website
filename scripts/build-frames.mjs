import fs from "fs";
import path from "path";
import sharp from "sharp";

const SETS = [
  {
    section: "hero",
    dir: path.resolve("public/hero"),
  },
  {
    section: "chapter-two",
    dir: path.resolve("public/chapter-two"),
  },
];

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

async function processSet(setInfo) {
  const { section, dir } = setInfo;
  console.log(`\n========================================`);
  console.log(`Processing set: ${section} in ${dir}`);
  console.log(`========================================`);

  if (!fs.existsSync(dir)) {
    throw new Error(`Directory does not exist: ${dir}`);
  }

  const allFiles = fs.readdirSync(dir);
  const rawImages = allFiles.filter((f) => /\.(jpe?g|png)$/i.test(f)).sort(naturalSort);
  const webpFrames = allFiles.filter((f) => /^frame_\d{4}\.webp$/i.test(f)).sort(naturalSort);

  if (rawImages.length === 0 && webpFrames.length > 0 && fs.existsSync(path.join(dir, "manifest.json"))) {
    console.log(`Set ${section} is already converted (${webpFrames.length} WebP frames). Skipping conversion.`);
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
    return manifest;
  }

  const imageFiles = (rawImages.length > 0 ? rawImages : webpFrames).sort(naturalSort);

  if (imageFiles.length === 0) {
    throw new Error(`No image files found in ${dir}`);
  }

  // 1. Inspect first file
  const firstFilePath = path.join(dir, imageFiles[0]);
  const meta = await sharp(firstFilePath).metadata();
  const ext = path.extname(imageFiles[0]);
  console.log(`Folder: ${path.relative(process.cwd(), dir)}`);
  console.log(`Section: ${section}`);
  console.log(`Frame count: ${imageFiles.length}`);
  console.log(`File pattern: ${imageFiles[0]} ... ${imageFiles[imageFiles.length - 1]}`);
  console.log(`Extension: ${ext}`);
  console.log(`Dimensions: ${meta.width} × ${meta.height}`);

  // Determine target dimensions
  let targetWidth = meta.width;
  let targetHeight = meta.height;
  if (targetWidth > 1920) {
    const scale = 1920 / targetWidth;
    targetWidth = 1920;
    targetHeight = Math.round((meta.height || 1080) * scale);
  }

  // 2. Convert and normalize files
  const WIDTH_THUMB = 64;
  const HEIGHT_THUMB = 36;
  const PIXELS_THUMB = WIDTH_THUMB * HEIGHT_THUMB;
  const thumbBuffers = [];

  console.log(`Converting ${imageFiles.length} frames to WebP (q=88, ${targetWidth}x${targetHeight})...`);
  for (let i = 0; i < imageFiles.length; i++) {
    const srcFile = path.join(dir, imageFiles[i]);
    const padIndex = String(i + 1).padStart(4, "0");
    const destName = `frame_${padIndex}.webp`;
    const destPath = path.join(dir, destName);

    let pipeline = sharp(srcFile);
    if (meta.width > 1920) {
      pipeline = pipeline.resize(targetWidth, targetHeight, { fit: "cover" });
    }

    const webpBuffer = await pipeline.webp({ quality: 88, effort: 4 }).toBuffer();
    fs.writeFileSync(destPath, webpBuffer);

    // Generate downscaled grayscale for cut detection directly from buffer
    const thumb = await sharp(webpBuffer)
      .resize(WIDTH_THUMB, HEIGHT_THUMB, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer();
    thumbBuffers.push(thumb);

    if ((i + 1) % 50 === 0 || i + 1 === imageFiles.length) {
      process.stdout.write(`  [${i + 1}/${imageFiles.length}] converted\r`);
    }
  }
  console.log(`\nAll frames converted.`);

  // 3. Cut Detection
  console.log(`Analyzing cuts for ${section}...`);
  const diffs = [];
  for (let i = 0; i < thumbBuffers.length - 1; i++) {
    const cur = thumbBuffers[i];
    const nxt = thumbBuffers[i + 1];
    let sum = 0;
    for (let p = 0; p < PIXELS_THUMB; p++) {
      sum += Math.abs(cur[p] - nxt[p]);
    }
    const mad = sum / PIXELS_THUMB;
    diffs.push({ frameIndex: i, nextIndex: i + 1, mad });
  }

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

  // Filter cuts with min distance 12 frames
  const finalCuts = [];
  for (const c of cutCandidates) {
    const nearby = finalCuts.find((fc) => Math.abs(fc.cutFrame - c.cutFrame) < 12);
    if (!nearby) {
      finalCuts.push(c);
    } else if (c.diffScore > nearby.diffScore) {
      nearby.cutFrame = c.cutFrame;
      nearby.nextFrame = c.nextFrame;
      nearby.diffScore = c.diffScore;
      nearby.ratio = c.ratio;
    }
  }

  finalCuts.sort((a, b) => a.cutFrame - b.cutFrame);
  const cutIndices = finalCuts.map((c) => c.cutFrame);

  console.log(`Detected cut indices for ${section}:`, cutIndices);
  if (finalCuts.length > 0) {
    console.table(finalCuts);
  }

  // 4. Remove original files that are not frame_*.webp or manifest.json
  const currentFiles = fs.readdirSync(dir);
  for (const f of currentFiles) {
    if (!/^frame_\d{4}\.webp$/.test(f) && f !== "manifest.json") {
      try {
        fs.unlinkSync(path.join(dir, f));
      } catch (err) {
        // Ignore or retry
      }
    }
  }

  // 5. Write manifest.json
  const manifest = {
    section,
    count: imageFiles.length,
    width: targetWidth,
    height: targetHeight,
    filePattern: "frame_%04d.webp",
    cutIndices,
    cuts: finalCuts,
  };

  const manifestPath = path.join(dir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  return manifest;
}

async function generateMobileVariants(setInfo) {
  const { section, dir } = setInfo;
  const mobileDir = path.join(dir, "mobile");
  if (!fs.existsSync(mobileDir)) {
    fs.mkdirSync(mobileDir, { recursive: true });
  }

  const allFiles = fs.readdirSync(dir);
  const webpFrames = allFiles.filter((f) => /^frame_\d{4}\.webp$/i.test(f)).sort(naturalSort);

  const existingMobile = fs.existsSync(mobileDir)
    ? fs.readdirSync(mobileDir).filter((f) => /^frame_\d{4}\.webp$/i.test(f))
    : [];

  if (existingMobile.length === webpFrames.length && webpFrames.length > 0) {
    console.log(`Mobile variant for ${section} is already complete (${existingMobile.length} frames). Skipping.`);
    return;
  }

  console.log(`Generating mobile variant (960px WebP) for ${section} (${webpFrames.length} frames)...`);
  for (let i = 0; i < webpFrames.length; i++) {
    const srcPath = path.join(dir, webpFrames[i]);
    const destPath = path.join(mobileDir, webpFrames[i]);

    if (!fs.existsSync(destPath)) {
      await sharp(srcPath)
        .resize(960, null, { fit: "inside" })
        .webp({ quality: 80, effort: 3 })
        .toFile(destPath);
    }

    if ((i + 1) % 50 === 0 || i + 1 === webpFrames.length) {
      process.stdout.write(`  [${i + 1}/${webpFrames.length}] mobile converted\r`);
    }
  }
  console.log(`\nMobile frames for ${section} generated.`);
}

async function main() {
  for (const s of SETS) {
    await processSet(s);
    await generateMobileVariants(s);
  }
  console.log("\n✓ All frame sets and mobile variants successfully built!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
