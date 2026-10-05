import type { MetadataRoute } from "next";
import { site } from "@content/site";
import { getAllPosts } from "@/lib/posts";

/* Rendered once at build time, like every other route here. */
export const dynamic = "force-static";

/**
 * Emitted as a static sitemap.xml at build time.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/blog", "/projects", "/al-dia", "/about"].map(
    (route) => ({
      url: `${site.url}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : 0.7,
    }),
  );

  const postRoutes = getAllPosts().map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T12:00:00Z`),
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...postRoutes];
}
