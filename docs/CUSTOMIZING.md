# Customizing the site

Two files cover most of what you'd want to change: `content/site.ts` for who
you are, and `src/app/globals.css` for how it looks.

---

## 1. Make it yours

### `content/site.ts`

```ts
export const site: SiteConfig = {
  url: "https://robadillo.com",   // no trailing slash — used for OG, sitemap, RSS
  name: "Rod Hernández",
  title: "Rod Hernández",         // browser tab, OG site name
  tagline: "Backend engineer. I make messy systems boring.",
  description: "Two or three sentences…",  // meta description and home intro
  location: "Mexico City",
  locale: "es_MX",
  nav: [...],
  socials: [...],
};
```

`url` matters more than it looks. Every canonical tag, OG URL, sitemap entry
and RSS link is built from it. Get it wrong and search engines index the wrong
host.

### The rest

| What | Where |
| --- | --- |
| About page copy | `content/about.mdx` |
| Nav items | `site.nav` in `content/site.ts` |
| Social links | `site.socials` in `content/site.ts` |
| Footer | `src/components/Footer.tsx` |
| Home page sections | `src/app/page.tsx` |
| Favicon | `public/favicon.svg` |
| 404 page | `src/app/not-found.tsx` |

### A note on your email address

There is deliberately no email address in `site.socials`. Putting a plain
`mailto:` on a public page is how you get on scraper lists — this site is
static and crawlable by design, which cuts both ways. If you want one, an
`email` icon is already wired up:

```ts
{ label: "Email", href: "mailto:you@robadillo.com", icon: "email" }
```

Use an address you can filter or rotate, not your primary one.

---

## 2. Colours and theming

Everything visual comes from the token block at the top of
`src/app/globals.css`. Components reference semantic names (`bg-bg`,
`text-fg-muted`, `border-border`, `text-accent`) and never a raw colour, so
changing the palette is one edit in one place — and because the tokens flip
for dark mode, no component carries a `dark:` variant.

```css
:root {
  --bg: oklch(99% 0.004 95);          /* page background */
  --bg-subtle: oklch(96.5% 0.006 95); /* code blocks, chips, wells */
  --bg-elevated: oklch(100% 0 0);     /* cards */

  --fg: oklch(21% 0.012 260);         /* headings, body emphasis */
  --fg-muted: oklch(47% 0.012 260);   /* body copy */
  --fg-subtle: oklch(62% 0.01 260);   /* metadata, timestamps */

  --border: oklch(90% 0.006 260);
  --border-strong: oklch(82% 0.008 260);

  --accent: oklch(48% 0.14 135);      /* links, the play button, eyebrows */
  --accent-fg: oklch(99% 0.004 95);   /* text ON accent */
  --accent-subtle: oklch(94% 0.05 135);
}
```

The values are [`oklch()`](https://oklch.com): lightness, chroma, hue. It makes
a palette easy to retune by hand — hold lightness and chroma, change the hue
angle, and you get the same palette in a different colour.

The default accent is a lime (`135°` light, `125°` dark). To make it blue,
change the hue on the three `--accent*` lines in each of the three blocks:

```css
--accent: oklch(48% 0.14 250);
--accent-subtle: oklch(94% 0.05 250);
```

`--ditto` and `--ditto-subtle` (a Ditto pink, hue `340°`) are used only by the
home page's hero grid (`src/components/HeroGrid.tsx`) — the digits that light
up under the pointer. Change the hue there to recolour the effect without
touching the accent.

### There are three blocks, and you need all three

```
:root                                          → light
@media (prefers-color-scheme: dark) :root:not([data-theme="light"])
                                               → dark, by OS preference
:root[data-theme="dark"]                       → dark, chosen with the toggle
```

The duplication is on purpose. The `:not([data-theme="light"])` guard is what
lets a visitor on a dark OS choose light and have it stick.

### Check your contrast

If you change `--fg-muted` or `--accent`, verify the result. Body copy needs
4.5:1 against its background and large text needs 3:1. The defaults pass in
both themes; a hue change at the same lightness usually stays safe, a
lightness change usually doesn't.

---

## 3. Typography

Fonts are declared in `src/app/layout.tsx`:

```ts
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono-face" });
```

To swap one, import a different family from `next/font/google`, keep the
`variable` name, and the mapping in `globals.css` picks it up:

```css
@theme inline {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-mono-face), ui-monospace, "SF Mono", monospace;
}
```

`next/font` downloads and self-hosts at build time. Nothing is fetched from
`fonts.googleapis.com` at runtime — which is why the CSP needs no third-party
font origin and why your visitors' IPs never reach Google. Keep it that way: a
`<link>` to Google Fonts would undo it.

### Body copy and the `.prose` block

The rendered body of a post is styled by the `.prose` rules in `globals.css` —
about eighty hand-written lines instead of `@tailwindcss/typography`. One
fewer dependency, and it reads the theme tokens directly.

The content measure is one token:

```css
--container-measure: 44rem;   /* ~70 characters at the current font size */
```

Used as `max-w-measure` on every page shell. Widen it and long posts get harder
to read; 60–75 characters is the range worth staying inside.

### Syntax highlighting themes

In `src/components/Mdx.tsx`:

```ts
theme: { light: "github-light", dark: "github-dark-dimmed" },
```

Any [Shiki bundled theme](https://shiki.style/themes) works. Both run in one
build pass and Shiki writes `--shiki-light` / `--shiki-dark` onto each token,
so switching theme in the browser costs no JavaScript.

---

## 4. Adding a page

Create a directory under `src/app/` with a `page.tsx`:

```tsx
// src/app/now/page.tsx
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Now",
  description: "What I'm working on at the moment.",
  alternates: { canonical: "/now" },
};

export default function NowPage() {
  return (
    <div className="mx-auto max-w-measure">
      <PageHeader eyebrow="Now" title="What I'm up to" />
      <div className="prose">
        <p>…</p>
      </div>
    </div>
  );
}
```

Then three follow-ups, all easy to forget:

1. Add it to `site.nav` in `content/site.ts` if it should be in the header
2. Add the route to `staticRoutes` in `src/app/sitemap.ts`
3. Add it to the `routes` map in `tools/blogctl/validate.go`, so internal links
   to it stop being reported as dead

### Pages whose copy lives in MDX

`/about` reads `content/about.mdx` and renders it through the same pipeline as
a post. Copy that pattern when you want to edit a page's words without opening
a component — `src/app/about/page.tsx` is twenty lines and shows the whole
thing.

---

## 5. Renaming `/al-dia`

The route is the directory name. To change it:

1. `git mv src/app/al-dia src/app/reading`
2. Update `site.nav` in `content/site.ts`
3. Update `staticRoutes` in `src/app/sitemap.ts`
4. Update the `routes` map in `tools/blogctl/validate.go`
5. Update the link in `content/posts/2026-10-01-hola-mundo.mdx`

Then `npm run validate` — step 5 is the one you'll miss, and it'll tell you.

If the old URL has been shared, add a redirect in `vercel.json`:

```json
"redirects": [
  { "source": "/al-dia", "destination": "/reading", "permanent": true }
]
```

---

## 6. Removing things you don't want

**The theme toggle** — delete `<ThemeToggle />` from
`src/components/Header.tsx` and the `themeScript` from
`src/app/layout.tsx`. The site then follows the OS preference only.

**The RSS feed** — delete `src/app/rss.xml/`, the `rss` entry in
`site.socials`, the `types` key in `layout.tsx`'s `alternates`, and `/rss.xml`
from the `routes` map in `validate.go`.

**The Go CLI** — delete `tools/`, the four Go-backed npm scripts, the `content`
job in `.github/workflows/ci.yml`, and `.githooks/pre-commit`. The site builds
without it; you lose the pre-commit validation, not any rendering. Note that
`src/lib/posts.ts` still validates frontmatter at build time, so bad content
fails the build either way — just later.

**The `/al-dia` page** — delete `src/app/al-dia/`, `content/videos.ts`,
`content/tweets.ts`, the two components, `src/lib/thumbs.ts`, and the
`thumbs` command from `tools/blogctl/`.
