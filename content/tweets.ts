import type { Tweet } from "./types";

/**
 * Stored as data, on purpose. See docs/CONTENT.md — no embed script means no
 * third-party tracking on the page and no broken cards when a post disappears.
 *
 * Newest first.
 */
export const tweets: Tweet[] = [
  {
    id: "placeholder-1",
    author: { name: "Kelsey Hightower", handle: "kelseyhightower" },
    text: "You don't need a service mesh. You need to delete three services.",
    date: "2026-09-18",
    href: "https://x.com/kelseyhightower",
    note: "Replace these with real posts you care about — id, text, date and link are all you need.",
  },
  {
    id: "placeholder-2",
    author: { name: "Rich Harris", handle: "Rich_Harris" },
    text: "The fastest code is the code you didn't ship.",
    date: "2026-09-02",
    href: "https://x.com/Rich_Harris",
  },
];
