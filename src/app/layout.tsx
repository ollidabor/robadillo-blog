import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { site } from "@content/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

/* next/font downloads and self-hosts these at build time. Nothing is fetched
   from fonts.googleapis.com at runtime, which keeps the CSP free of a
   third-party style/font origin and the visitor's IP out of Google's logs. */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-face",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.title} — ${site.tagline}`,
    template: `%s — ${site.title}`,
  },
  description: site.description,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  openGraph: {
    type: "website",
    locale: site.locale,
    url: site.url,
    siteName: site.title,
    title: `${site.title} — ${site.tagline}`,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${site.url}/rss.xml` },
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

/**
 * Runs before first paint so the correct theme is on <html> immediately.
 * Without it, a visitor who chose dark sees a white flash on every navigation.
 *
 * It is deliberately tiny and contains no interpolated values — see
 * docs/SECURITY.md for how its hash is pinned in the Content-Security-Policy.
 */
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="page-glow flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-fg"
        >
          Skip to content
        </a>

        <Header />

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:px-6">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
