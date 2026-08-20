import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await Promise.all([
  cp("index.html", "dist/index.html"),
  cp("styles.css", "dist/styles.css"),
  cp("terms.css", "dist/terms.css"),
  cp("terms", "dist/terms", { recursive: true }),
  cp("assets", "dist/assets", { recursive: true })
]);

console.log("built dist/");
