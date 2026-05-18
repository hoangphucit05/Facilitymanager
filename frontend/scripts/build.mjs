/**
 * Copy frontend/src → frontend/dist (production static bundle).
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dist = join(root, "dist");

if (!existsSync(src)) {
  console.error("Missing src/ — run from frontend root.");
  process.exit(1);
}

if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
}

mkdirSync(dist, { recursive: true });
cpSync(src, dist, { recursive: true });
console.log("Built:", dist);
