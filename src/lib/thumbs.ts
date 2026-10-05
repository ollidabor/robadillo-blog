import fs from "node:fs";
import path from "node:path";

/**
 * Resolves a locally-downloaded YouTube thumbnail, or null if it hasn't been
 * fetched yet. Runs at build time only — never ship a request to i.ytimg.com.
 *
 * Populate the folder with `npm run thumbs`.
 */
export function thumbnailFor(videoId: string): string | null {
  const rel = path.join("thumbs", `${videoId}.jpg`);
  const abs = path.join(process.cwd(), "public", rel);
  return fs.existsSync(abs) ? `/${rel.split(path.sep).join("/")}` : null;
}
