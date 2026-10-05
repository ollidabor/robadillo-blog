import type { SiteConfig } from "./types";

export const site: SiteConfig = {
  url: "https://robadillo.com",
  name: "Rod Hernández",
  title: "Rod Hernández",
  tagline: "Backend engineer. I make messy systems boring.",
  description:
    "Backend engineer with 10+ years building marketplaces, e-commerce, fintech and logistics platforms. I write about APIs, migrations that don't wake you up at 3am, and the unglamorous parts of scaling.",
  location: "Mexico City",
  locale: "es_MX",
  nav: [
    { href: "/blog", label: "Blog" },
    { href: "/projects", label: "Projects" },
    { href: "/al-dia", label: "Al día" },
    { href: "/about", label: "About" },
  ],
  socials: [
    { label: "GitHub", href: "https://github.com/ollidabor", icon: "github" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/rodrigo-hernandez-badillo/",
      icon: "linkedin",
    },
    { label: "RSS", href: "/rss.xml", icon: "rss" },
  ],
};
