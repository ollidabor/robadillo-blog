import type { Tweet } from "./types";

/**
 * Stored as data, on purpose. See docs/CONTENT.md — no embed script means no
 * third-party tracking on the page and no broken cards when a post disappears.
 *
 * Add one with `npm run add -- "<x.com url>" -note "…"`. Newest first.
 */
export const tweets: Tweet[] = [
  {
    id: "2110047081414987957",
    author: { name: "Anthropic", handle: "AnthropicAI" },
    text: "New on our Engineering blog: Creating in-house source control. \n\nIn May, we merged around 2,500 code changes per day. In September, we merged more than 30,000 per day. As a result, we became bottlenecked by developer infrastructure built for human (rather than agent) scale.…",
    date: "2026-10-13",
    href: "https://x.com/AnthropicAI/status/2110047081414987957",
  },
];
