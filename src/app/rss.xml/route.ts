import { site } from "@content/site";
import { getAllPosts } from "@/lib/posts";

/**
 * `output: "export"` only permits route handlers that render once at build
 * time, which is exactly what a feed of static posts needs.
 */
export const dynamic = "force-static";

/** XML has five reserved characters. Escape all of them, in this order. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET(): Response {
  const posts = getAllPosts().filter((post) => !post.draft);
  const updated = posts[0]?.date;

  const items = posts
    .map((post) => {
      const url = `${site.url}/blog/${post.slug}`;
      return `    <item>
      <title>${esc(post.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${new Date(`${post.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(post.summary)}</description>
${post.tags.map((tag) => `      <category>${esc(tag)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.title)}</title>
    <link>${esc(site.url)}</link>
    <description>${esc(site.description)}</description>
    <language>en</language>
    <atom:link href="${esc(site.url)}/rss.xml" rel="self" type="application/rss+xml" />
${updated ? `    <lastBuildDate>${new Date(`${updated}T12:00:00Z`).toUTCString()}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
