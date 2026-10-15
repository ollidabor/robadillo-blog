import type { Video } from "./types";

/**
 * YouTube videos worth your time. These render as click-to-load cards:
 * nothing is requested from YouTube until a visitor presses play.
 *
 * Add one with `npm run add -- "<youtube url>" -note "…"`: it fills in the
 * title and channel and downloads the thumbnail locally.
 */
export const videos: Video[] = [
  {
    id: "W6aOdLlEz1w",
    title: "Should You Still Become a Software Engineer in 2026? GitHub VP",
    channel: "Jean Lee",
    note: "A really interesting video",
  },
];
