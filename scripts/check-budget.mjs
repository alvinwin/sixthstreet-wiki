import { gzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";

const RAW_WARNING = 16 * 1024;
const RAW_HARD_LIMIT = 24 * 1024;
const GZIP_HARD_LIMIT = 10 * 1024;
const HERO_RAW_HARD_LIMIT = 300 * 1024;
const shellFiles = ["dist/index.html", "dist/styles.css"];
const heroFiles = ["dist/assets/hero.webp", "dist/assets/hero-mobile.webp"];

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
console.log(`hero assets (hero.webp + hero-mobile.webp): ${heroRawBytes} B raw`);

if (rawBytes > RAW_HARD_LIMIT) {
  throw new Error(`site shell exceeds the 24 KiB raw limit by ${rawBytes - RAW_HARD_LIMIT} B`);
}

if (gzipBytes > GZIP_HARD_LIMIT) {
  throw new Error(`site shell exceeds the 10 KiB gzip limit by ${gzipBytes - GZIP_HARD_LIMIT} B`);
}

if (heroRawBytes > HERO_RAW_HARD_LIMIT) {
  throw new Error(`hero assets exceed the 300 KiB raw limit by ${heroRawBytes - HERO_RAW_HARD_LIMIT} B`);
}

if (rawBytes > RAW_WARNING) {
  console.warn(`warning: site shell is ${rawBytes - RAW_WARNING} B above the 16 KiB raw target`);
}
