import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostFrontmatter = {
  title: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  summary: string;
  tags: string[];
  /** Drafts are skipped in production builds. */
  draft: boolean;
};

export type Post = PostFrontmatter & {
  slug: string;
  /** Raw MDX body, frontmatter stripped. */
  body: string;
  readingMinutes: number;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Frontmatter is the one place a typo can silently produce a broken page, so
 * we reject it loudly here. A bad post fails `next build` rather than shipping.
 * `blogctl validate` runs the same rules before you even commit.
 */
function parseFrontmatter(raw: unknown, file: string): PostFrontmatter {
  const fail = (msg: string): never => {
    throw new Error(`Invalid frontmatter in content/posts/${file}: ${msg}`);
  };

  if (typeof raw !== "object" || raw === null) {
    return fail("missing frontmatter block");
  }
  const data = raw as Record<string, unknown>;

  const title = data.title;
  if (typeof title !== "string" || title.trim() === "") {
    return fail("`title` is required and must be a non-empty string");
  }

  const date = data.date;
  // gray-matter turns unquoted YAML dates into Date objects; accept both.
  const dateStr =
    date instanceof Date
      ? date.toISOString().slice(0, 10)
      : typeof date === "string"
        ? date
        : fail("`date` is required");
  if (!ISO_DATE.test(dateStr)) {
    return fail(`\`date\` must be YYYY-MM-DD, got "${dateStr}"`);
  }

  const summary = data.summary;
  if (typeof summary !== "string" || summary.trim() === "") {
    return fail("`summary` is required — it's the card text and meta description");
  }
  if (summary.length > 200) {
    return fail(`\`summary\` is ${summary.length} chars; keep it under 200`);
  }

  const tags = data.tags ?? [];
  if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string")) {
    return fail("`tags` must be a list of strings");
  }

  const draft = data.draft ?? false;
  if (typeof draft !== "boolean") {
    return fail("`draft` must be true or false");
  }

  return { title, date: dateStr, summary, tags: tags as string[], draft };
}

/** ~220 wpm, rounded up, floor of 1. Close enough to be useful. */
function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function slugFromFilename(file: string): string {
  // 2026-10-01-hola-mundo.mdx -> hola-mundo
  return file
    .replace(/\.mdx?$/, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

let cache: Post[] | null = null;

/**
 * Every post, newest first. Drafts are included only outside production so you
 * can see them with `npm run dev` without them leaking into a deploy.
 */
export function getAllPosts(): Post[] {
  if (cache) return cache;

  if (!fs.existsSync(POSTS_DIR)) {
    cache = [];
    return cache;
  }

  const posts = fs
    .readdirSync(POSTS_DIR)
    .filter((file) => /\.mdx?$/.test(file) && !file.startsWith("."))
    .map((file) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      const { data, content } = matter(raw);
      const frontmatter = parseFrontmatter(data, file);
      return {
        ...frontmatter,
        slug: slugFromFilename(file),
        body: content,
        readingMinutes: readingTime(content),
      };
    })
    .filter((post) => !post.draft || process.env.NODE_ENV !== "production")
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const seen = new Set<string>();
  for (const post of posts) {
    if (seen.has(post.slug)) {
      throw new Error(
        `Duplicate post slug "${post.slug}" — two files resolve to /blog/${post.slug}`,
      );
    }
    seen.add(post.slug);
  }

  cache = posts;
  return cache;
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}

/** Tags across all posts, most used first. */
export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
