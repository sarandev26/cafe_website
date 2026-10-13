import fs from "fs";
import path from "path";

function gaussianSmooth(arr, radius = 4, sigma = 2.0) {
  const result = [];
  const kernel = [];
  let kernelSum = 0;

  for (let i = -radius; i <= radius; i++) {
    const w = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(w);
    kernelSum += w;
  }

  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      const idx = i + k;
      let val;
      if (idx < 0) {
        val = arr[0] + idx * (arr[1] - arr[0]);
      } else if (idx >= arr.length) {
        val = arr[arr.length - 1] + (idx - (arr.length - 1)) * (arr[arr.length - 1] - arr[arr.length - 2]);
      } else {
        val = arr[idx];
      }
      sum += val * kernel[k + radius];
    }
    result.push(sum / kernelSum);
  }
  return result;
}

function buildTimeMap(setName) {
  const motionPath = path.resolve(`public/seq/${setName}/motion.json`);
  if (!fs.existsSync(motionPath)) {
    throw new Error(`motion.json not found for ${setName}`);
  }

  const motionData = JSON.parse(fs.readFileSync(motionPath, "utf-8"));
  const rawDiffs = motionData.rawDiffs;
  const count = motionData.count; // Total frames (e.g. 193)
  const numSteps = rawDiffs.length; // 192 transitions

  // Smooth the motion curve
  const smoothed = gaussianSmooth(rawDiffs, 4, 2.0);

  // Mean motion
  const meanMotion = smoothed.reduce((a, b) => a + b, 0) / smoothed.length;

  // Weight for each frame transition: proportional to motion, clamped to [0.5, 2.0] of mean
  const weights = smoothed.map((m) => {
    const ratio = m / meanMotion;
    return Math.max(0.5, Math.min(2.0, ratio));
  });

  // Cumulative scroll distance for each frame index 0 .. count - 1
  const cumScroll = [0];
  let totalScroll = 0;
  for (let i = 0; i < weights.length; i++) {
    totalScroll += weights[i];
    cumScroll.push(totalScroll);
  }

  // Normalize cumScroll to [0, 1] (progress)
  const progressPerFrame = cumScroll.map((s) => s / totalScroll);

  // Now build monotonic mapping: progress in [0, 1] -> frame position in [0, count - 1]
  // We sample 1001 points (progress = 0.000, 0.001, ..., 1.000)
  const SAMPLES = 1000;
  const mapTable = [];

  for (let s = 0; s <= SAMPLES; s++) {
    const p = s / SAMPLES;

    // Find interval in progressPerFrame
    let low = 0;
    let high = progressPerFrame.length - 1;

    while (low < high - 1) {
      const mid = Math.floor((low + high) / 2);
      if (progressPerFrame[mid] <= p) {
        low = mid;
      } else {
        high = mid;
      }
    }

    const p0 = progressPerFrame[low];
    const p1 = progressPerFrame[high];
    const t = p1 > p0 ? (p - p0) / (p1 - p0) : 0;
    const framePos = low + t * (high - low);
    mapTable.push(Math.max(0, Math.min(count - 1, framePos)));
  }

  // Smooth the map table gently with Gaussian to remove any quantization kinks
  const smoothedMap = gaussianSmooth(mapTable, 5, 2.5);

  // Ensure strict monotonicity and boundary pinning
  smoothedMap[0] = 0;
  smoothedMap[smoothedMap.length - 1] = count - 1;
  for (let i = 1; i < smoothedMap.length; i++) {
    if (smoothedMap[i] < smoothedMap[i - 1]) {
      smoothedMap[i] = smoothedMap[i - 1];
    }
  }

  const outDir = path.resolve(`public/seq/${setName}`);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "timemap.json");
  const payload = {
    set: setName,
    count,
    samples: SAMPLES,
    table: smoothedMap.map((v) => Math.round(v * 1000) / 1000),
  };

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`✓ Built motion-equalized time map for ${setName} -> ${outPath}`);
  console.log(`  Start frame: ${smoothedMap[0]}, End frame: ${smoothedMap[smoothedMap.length - 1]}, Total samples: ${smoothedMap.length}`);
}

function main() {
  buildTimeMap("hero");
  buildTimeMap("chapter-two");
}

main();
