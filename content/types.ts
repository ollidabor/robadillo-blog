/**
 * Shapes for every piece of hand-authored content on the site.
 * Editing content means editing the files next to this one — nothing else.
 */

export type NavItem = {
  href: string;
  label: string;
};

export type SocialLink = {
  label: string;
  href: string;
  /** Key into the icon map in src/components/SocialIcon.tsx */
  icon: "github" | "linkedin" | "x" | "email" | "rss";
};

export type SiteConfig = {
  /** Canonical origin, no trailing slash. Used for OG tags, sitemap and RSS. */
  url: string;
  name: string;
  /** Shown in the browser tab and as the OG site name. */
  title: string;
  /** One line under your name on the home page. */
  tagline: string;
  /** Two or three sentences for meta description and the home intro. */
  description: string;
  location: string;
  locale: string;
  nav: NavItem[];
  socials: SocialLink[];
};

export type Project = {
  slug: string;
  name: string;
  /** One sentence. What it is, not how it works. */
  summary: string;
  /** The interesting part — why you built it, what it taught you. */
  detail?: string;
  tech: string[];
  /** Years or a range, e.g. "2026" or "2024 — 2025". */
  period: string;
  status: "live" | "archived" | "wip";
  links?: { label: string; href: string }[];
};

export type Video = {
  /** The 11-character YouTube id, from the ?v= parameter. */
  id: string;
  title: string;
  /** Why it's here, in your words. */
  note: string;
  channel: string;
};

/**
 * Tweets are stored as plain data, not live embeds: no third-party script,
 * no tracking pixel, and the card keeps working when the post is deleted or
 * the embed API changes. See docs/CONTENT.md for the reasoning.
 */
export type Tweet = {
  id: string;
  author: { name: string; handle: string };
  /** The text, as written. Line breaks are preserved. */
  text: string;
  /** ISO date, e.g. "2026-09-18". */
  date: string;
  /** Permalink to the original post. */
  href: string;
  /** Your take on why it matters. Optional. */
  note?: string;
};
