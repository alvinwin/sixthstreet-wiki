import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await Promise.all([
  cp("index.html", "dist/index.html"),
  cp("home.html", "dist/home.html"),
  cp("home.css", "dist/home.css"),
  cp("brief.css", "dist/brief.css"),
  cp("styles.css", "dist/styles.css"),
  cp("terms.css", "dist/terms.css"),
  cp("terms", "dist/terms", { recursive: true }),
  cp("assets", "dist/assets", { recursive: true }),
  cp("data", "dist/data", { recursive: true }),
  cp("src", "dist/src", { recursive: true })
]);

console.log("built dist/");
