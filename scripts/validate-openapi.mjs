import { readFile } from "node:fs/promises";

const document = JSON.parse(await readFile(new URL("../docs/openapi.json", import.meta.url), "utf8"));
if (document.openapi !== "3.0.3" || !document.info?.title || !document.paths?.["/api/v1/jobs/search"] || !document.paths?.["/api/v1/metrics"]) {
  throw new Error("OpenAPI document is missing required metadata or paths.");
}
for (const [path, item] of Object.entries(document.paths)) {
  if (!path.startsWith("/api/v1/") || typeof item !== "object") throw new Error(`Invalid path: ${path}`);
}
console.info(`Validated OpenAPI ${document.openapi}: ${Object.keys(document.paths).length} paths.`);
