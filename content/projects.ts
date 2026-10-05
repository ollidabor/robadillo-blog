import type { Project } from "./types";

/**
 * Newest first. The home page shows the first three.
 */
export const projects: Project[] = [
  {
    slug: "robadillo-com",
    name: "robadillo.com",
    summary:
      "This site. A statically exported Next.js blog with a Go CLI for authoring.",
    detail:
      "Every page is a file on a CDN — no database, no API, no runtime secrets. The interesting constraint was keeping it that way: embeds are click-to-load, tweets are stored as data instead of scripts, and a small Go binary validates frontmatter before anything reaches main.",
    tech: ["Next.js", "React", "TypeScript", "Tailwind", "Go"],
    period: "2026",
    status: "live",
    links: [
      { label: "Source", href: "https://github.com/ollidabor/robadillo-blog" },
    ],
  },
  {
    slug: "etsy-notifications",
    name: "Push notification infrastructure",
    summary:
      "FCM → Braze migration and end-to-end experimentation for a marketplace with ~90M buyers.",
    detail:
      "Replacing the delivery layer under a live notification system without dropping messages or double-sending them. Most of the work was in the seams: idempotency, backfills, and a shadow-write period long enough to trust the numbers.",
    tech: ["PHP", "Braze", "FCM", "Experimentation"],
    period: "2024 — 2025",
    status: "archived",
  },
  {
    slug: "kavak-checkout",
    name: "E-commerce surface, Car Purchase → Checkout",
    summary:
      "Owned the buy-flow for a used-car marketplace across 5+ countries, ~2M daily views.",
    detail:
      "Five countries meant five sets of payment rules, tax rules and inventory quirks pretending to be one product. The win was a contract layer that let each market diverge where it had to and nowhere else.",
    tech: ["Node.js", "NestJS", "TypeScript", "PostgreSQL", "AWS"],
    period: "2021 — 2024",
    status: "archived",
  },
];
