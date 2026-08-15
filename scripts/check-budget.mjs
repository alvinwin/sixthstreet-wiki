import { gzipSync } from "node:zlib";
import { readFile, readdir } from "node:fs/promises";

const RAW_WARNING = 16 * 1024;
const RAW_HARD_LIMIT = 24 * 1024;
const GZIP_HARD_LIMIT = 10 * 1024;

const files = await readdir("dist");
const buffers = await Promise.all(files.map((file) => readFile(`dist/${file}`)));
const rawBytes = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
const gzipBytes = buffers.reduce((sum, buffer) => sum + gzipSync(buffer).byteLength, 0);

console.log(`site shell: ${rawBytes} B raw, ${gzipBytes} B gzip`);

if (rawBytes > RAW_HARD_LIMIT) {
  throw new Error(`site shell exceeds the 24 KiB raw limit by ${rawBytes - RAW_HARD_LIMIT} B`);
}

if (gzipBytes > GZIP_HARD_LIMIT) {
  throw new Error(`site shell exceeds the 10 KiB gzip limit by ${gzipBytes - GZIP_HARD_LIMIT} B`);
}

if (rawBytes > RAW_WARNING) {
  console.warn(`warning: site shell is ${rawBytes - RAW_WARNING} B above the 16 KiB raw target`);
}
