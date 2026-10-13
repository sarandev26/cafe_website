import fs from "fs";
import path from "path";
import crypto from "crypto";

const PUBLIC_IMAGES_DIR = path.resolve("public/images");
const IMAGES_TS = path.resolve("lib/images.ts");
const CONTENT_TS = path.resolve("lib/content.ts");

console.log("==> Running Aurelia Image Integrity & De-duplication Check...\n");

// 1. Hash every file in public/images
const files = fs.readdirSync(PUBLIC_IMAGES_DIR).filter((f) => f.endsWith(".webp") || f.endsWith(".jpg") || f.endsWith(".png"));
const fileHashes = new Map();
const duplicatesByHash = [];

for (const file of files) {
  const filePath = path.join(PUBLIC_IMAGES_DIR, file);
  const buffer = fs.readFileSync(filePath);
  const hash = crypto.createHash("md5").update(buffer).digest("hex");

  if (fileHashes.has(hash)) {
    duplicatesByHash.push({
      file,
      matching: fileHashes.get(hash),
      hash,
    });
  } else {
    fileHashes.set(hash, file);
  }
}

if (duplicatesByHash.length > 0) {
  console.error("❌ FAILED: Duplicate file contents found in public/images:");
  for (const dup of duplicatesByHash) {
    console.error(`  - "${dup.file}" has identical content hash to "${dup.matching}"`);
  }
} else {
  console.log(`✓ All ${files.length} files in public/images have unique content hashes.`);
}

// 2. Extract all image paths referenced in lib/images.ts and lib/content.ts
function extractImagePaths(filePath) {
  const code = fs.readFileSync(filePath, "utf-8");
  const regex = /["'](\/images\/[^"']+)["']/g;
  const paths = [];
  let match;
  while ((match = regex.exec(code)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

const manifestPaths = extractImagePaths(IMAGES_TS);
const contentPaths = extractImagePaths(CONTENT_TS);

// 3. Check for missing files on disk
const missingFiles = [];
const allReferenced = new Set([...manifestPaths, ...contentPaths]);

for (const relPath of allReferenced) {
  const absPath = path.resolve("public", relPath.replace(/^\//, ""));
  if (!fs.existsSync(absPath)) {
    missingFiles.push({ relPath, absPath });
  }
}

if (missingFiles.length > 0) {
  console.error("❌ FAILED: Missing image files on disk:");
  for (const m of missingFiles) {
    console.error(`  - "${m.relPath}" not found at ${m.absPath}`);
  }
} else {
  console.log(`✓ All ${allReferenced.size} referenced image paths exist on disk.`);
}

// 4. Check for duplicate image usage across the manifest
const seenPaths = new Map();
const duplicateUsage = [];

for (const relPath of manifestPaths) {
  const count = (seenPaths.get(relPath) || 0) + 1;
  seenPaths.set(relPath, count);
  if (count === 2) {
    duplicateUsage.push(relPath);
  }
}

if (duplicateUsage.length > 0) {
  console.error("❌ FAILED: Duplicate image paths found in lib/images.ts manifest:");
  for (const d of duplicateUsage) {
    console.error(`  - "${d}" is reused in multiple slots`);
  }
} else {
  console.log(`✓ Zero duplicate image paths in lib/images.ts manifest (${manifestPaths.length} unique assignments).`);
}

// Final Verdict
if (duplicatesByHash.length > 0 || missingFiles.length > 0 || duplicateUsage.length > 0) {
  console.error("\n❌ Image verification FAILED.");
  process.exit(1);
} else {
  console.log("\n✨ Image verification PASSED successfully! 100% unique images across the entire site.");
  process.exit(0);
}
