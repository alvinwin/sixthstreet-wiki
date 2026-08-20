import { gzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";

const RAW_WARNING = 160 * 1024;
const RAW_HARD_LIMIT = 192 * 1024;
const GZIP_HARD_LIMIT = 64 * 1024;
const HERO_RAW_HARD_LIMIT = 4 * 1024 * 1024;
const shellFiles = [
  "dist/index.html",
  "dist/home.css",
  "dist/brief.css",
  "dist/src/main.js",
  "dist/src/render-da.js",
  "dist/src/render-sd.js"
];
const heroFiles = ["dist/assets/hero.png", "dist/assets/hero.webp", "dist/assets/hero-mobile.webp"];

async function readRequired(file, label) {
  try {
    return await readFile(file);
  } catch (error) {
    throw new Error(`${label} is missing or unreadable at ${file}: ${error.message}`);
  }
}

const shellBuffers = await Promise.all(shellFiles.map((file) => readRequired(file, "site shell file")));
const heroBuffers = await Promise.all(heroFiles.map((file) => readRequired(file, "required hero asset")));
const rawBytes = shellBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
const gzipBytes = shellBuffers.reduce((sum, buffer) => sum + gzipSync(buffer).byteLength, 0);
const heroRawBytes = heroBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);

console.log(`site shell: ${rawBytes} B raw, ${gzipBytes} B gzip`);
console.log(`hero assets: ${heroRawBytes} B raw`);

if (rawBytes > RAW_HARD_LIMIT) {
  throw new Error(`site shell exceeds the 192 KiB raw limit by ${rawBytes - RAW_HARD_LIMIT} B`);
}

if (gzipBytes > GZIP_HARD_LIMIT) {
  throw new Error(`site shell exceeds the 64 KiB gzip limit by ${gzipBytes - GZIP_HARD_LIMIT} B`);
}

if (heroRawBytes > HERO_RAW_HARD_LIMIT) {
  throw new Error(`hero assets exceed the 4 MiB raw limit by ${heroRawBytes - HERO_RAW_HARD_LIMIT} B`);
}

if (rawBytes > RAW_WARNING) {
  console.warn(`warning: site shell is ${rawBytes - RAW_WARNING} B above the 160 KiB raw target`);
}
