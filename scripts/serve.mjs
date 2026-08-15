import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 4173);
const types = { ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8" };

createServer((request, response) => {
  const requested = request.url === "/" ? "/index.html" : request.url;
  const path = normalize(join("dist", requested));
  if (!path.startsWith("dist/")) {
    response.writeHead(404).end();
    return;
  }
  const stream = createReadStream(path);
  stream.on("error", () => response.writeHead(404).end());
  response.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream" });
  stream.pipe(response);
}).listen(port, "127.0.0.1", () => console.log(`serving http://127.0.0.1:${port}`));
