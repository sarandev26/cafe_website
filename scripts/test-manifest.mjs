import fs from "fs";
import path from "path";

const heroManifest = JSON.parse(fs.readFileSync("public/hero/manifest.json", "utf8"));
const c2Manifest = JSON.parse(fs.readFileSync("public/chapter-two/manifest.json", "utf8"));

console.log("Hero Manifest cutIndices:", heroManifest.cutIndices);
console.log("Chapter Two Manifest cutIndices:", c2Manifest.cutIndices);
