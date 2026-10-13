import fs from "fs";
import path from "path";
import sharp from "sharp";

const SETS = [
  { name: "hero", dir: "public/hero", count: 193 },
  { name: "chapter-two", dir: "public/chapter-two", count: 193 },
];

async function getGrayscaleThumbnail(filePath) {
  const { data, info } = await sharp(filePath)
    .resize(64, 36, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function movingAverage(arr, windowSize = 3) {
  const result = [];
  const half = Math.floor(windowSize / 2);
  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(arr.length - 1, i + half); j++) {
      sum += arr[j];
      count++;
    }
    result.push(sum / count);
  }
  return result;
}

function getLocalMedians(arr, windowSize = 15) {
  const result = [];
  const half = Math.floor(windowSize / 2);
  for (let i = 0; i < arr.length; i++) {
    const windowVals = [];
    for (let j = Math.max(0, i - half); j <= Math.min(arr.length - 1, i + half); j++) {
      windowVals.push(arr[j]);
    }
    windowVals.sort((a, b) => a - b);
    const mid = Math.floor(windowVals.length / 2);
    result.push(windowVals[mid]);
  }
  return result;
}

async function analyzeSet(setInfo) {
  console.log(`\n======================================================`);
  console.log(`Analyzing footage motion for: ${setInfo.name.toUpperCase()}`);
  console.log(`======================================================`);

  const files = [];
  for (let i = 1; i <= setInfo.count; i++) {
    const pad = String(i).padStart(4, "0");
    const filePath = path.join(setInfo.dir, `frame_${pad}.webp`);
    if (fs.existsSync(filePath)) {
      files.push(filePath);
    }
  }

  console.log(`Loaded ${files.length} frames.`);

  // Downscale and extract raw pixel buffers
  const thumbs = [];
  for (let i = 0; i < files.length; i++) {
    thumbs.push(await getGrayscaleThumbnail(files[i]));
  }

  // Compute MAD between consecutive frames
  const diffs = [];
  const pixelCount = 64 * 36;
  for (let i = 0; i < thumbs.length - 1; i++) {
    const a = thumbs[i].data;
    const b = thumbs[i + 1].data;
    let sumDiff = 0;
    for (let p = 0; p < pixelCount; p++) {
      sumDiff += Math.abs(a[p] - b[p]);
    }
    const mad = sumDiff / pixelCount;
    diffs.push(Math.round(mad * 100) / 100);
  }

  const smoothed = movingAverage(diffs, 3);
  const localMedians = getLocalMedians(diffs, 15);

  let nearDuplicates = 0;
  const spikes = [];

  for (let i = 0; i < diffs.length; i++) {
    const d = diffs[i];
    const med = Math.max(0.2, localMedians[i]);
    const ratio = d / med;

    if (d < 0.25) {
      nearDuplicates++;
    }

    if (ratio > 2.2 && d > 4.0) {
      spikes.push({
        pair: `${i + 1} -> ${i + 2}`,
        frameIndex: i,
        diff: d,
        localMedian: Math.round(med * 100) / 100,
        ratio: Math.round(ratio * 10) / 10,
      });
    }
  }

  // Sort spikes by difference descending
  const sortedSpikes = [...spikes].sort((a, b) => b.diff - a.diff);

  console.log(`\nResults for ${setInfo.name}:`);
  console.log(`  - Total Consecutive Pairs: ${diffs.length}`);
  console.log(`  - Near-Duplicate Frames (diff < 0.25): ${nearDuplicates}`);
  console.log(`  - Motion Spikes (> 2.2x local median): ${spikes.length}`);
  if (sortedSpikes.length > 0) {
    console.log(`  - Top Spikes:`);
    console.table(sortedSpikes.slice(0, 8));
  } else {
    console.log(`  - No significant motion spikes detected.`);
  }

  // Save to public/seq/<set>/motion.json
  const outDir = path.join("public", "seq", setInfo.name);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outputData = {
    set: setInfo.name,
    count: files.length,
    nearDuplicates,
    spikesCount: spikes.length,
    spikes: sortedSpikes,
    rawDiffs: diffs,
    smoothedDiffs: smoothed.map((v) => Math.round(v * 100) / 100),
    localMedians: localMedians.map((v) => Math.round(v * 100) / 100),
  };

  fs.writeFileSync(path.join(outDir, "motion.json"), JSON.stringify(outputData, null, 2));
  console.log(`  -> Saved motion curve to ${path.join(outDir, "motion.json")}`);

  return outputData;
}

async function main() {
  for (const s of SETS) {
    await analyzeSet(s);
  }
}

main().catch(console.error);
