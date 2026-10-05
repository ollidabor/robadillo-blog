import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Static export: `next build` emits a plain folder of HTML/CSS/JS into `out/`.
   * No server, no serverless functions, no runtime secrets — the whole site is
   * files on a CDN. This is what keeps the attack surface near zero, and it
   * means the site can move to any static host without a rewrite.
   */
  output: "export",

  // Trailing slashes keep static hosts from guessing about /blog vs /blog/.
  trailingSlash: true,

  // next/image's optimizer needs a server; with `output: "export"` there isn't
  // one. We ship correctly-sized images instead (see docs/CONTENT.md).
  images: {
    unoptimized: true,
  },

  // Don't leak the framework version in response headers.
  poweredByHeader: false,

  // Fail the build on type errors instead of shipping a broken page.
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
