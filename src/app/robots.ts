import type { MetadataRoute } from "next";
import { site } from "@content/site";

/* Metadata routes must opt into build-time rendering under `output: "export"`. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
