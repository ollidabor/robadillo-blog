# Writing content

Everything on the site comes from the `content/` directory. You never need to
open a component to publish something.

---

## Blog posts

### Start one

```bash
npm run new -- "A BFF is not a proxy"
```

That creates `content/posts/2026-10-01-a-bff-is-not-a-proxy.mdx` with valid
frontmatter and a skeleton. Flags:

```bash
npm run new -- -date 2026-11-04 -tags "go,tooling" -draft "Title here"
```

The filename carries the date so the directory sorts chronologically; the URL
does not. `2026-10-01-a-bff-is-not-a-proxy.mdx` is served at
`/blog/a-bff-is-not-a-proxy`.

### Frontmatter

```yaml
---
title: "A BFF is not a proxy"
date: 2026-09-14
summary: "The fastest way to ruin a backend-for-frontend is to treat it as a pass-through."
tags: ["architecture", "apis", "bff"]
draft: false
---
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Used as the `<h1>`, the page title and the OG title |
| `date` | yes | `YYYY-MM-DD`. Must match the filename prefix |
| `summary` | yes | Under 200 characters. The card text *and* the meta description |
| `tags` | yes | At least one. `["a", "b"]` or a YAML block list |
| `draft` | no | `true` hides it from production builds; visible in `npm run dev` |

An unknown key is an error, not a shrug. The rules are enforced in two places
that must agree — `tools/blogctl/frontmatter.go` and
`src/lib/posts.ts` — so adding a field means editing both.

### Markdown you can use

Standard Markdown plus GFM (tables, strikethrough, task lists, autolinks).

Code blocks take a language and an optional title:

````markdown
```ts title="checkout-summary.ts"
type CheckoutSummary = {
  displayPrice: Money;
};
```
````

Highlighting happens at build time via Shiki, in both themes at once. Nothing
ships to the browser to do it.

To highlight specific lines:

````markdown
```go {3-5}
func main() {
}
```
````

### Components available in MDX

Only what `src/components/Mdx.tsx` exposes. A post referencing anything else
fails the build — deliberately, since posts go through git anyway.

```mdx
<Callout>
The aside you'd otherwise put in parentheses.
</Callout>

<Callout kind="warn">
The one people should actually stop and read.
</Callout>
```

To add another, write the component and add it to the `components` object in
`src/components/Mdx.tsx`.

### Images

Put them in `public/images/` and reference them from the root:

```markdown
![A dashboard showing the shadow comparison](/images/shadow-diff.png)
```

There is no image optimizer — `output: "export"` has no server to run one. So
export at the size you need (1600px wide is plenty for the content column) and
compress before committing. A 2MB screenshot is a 2MB screenshot.

Always write real alt text. If the image is decorative, `alt=""` is the correct
answer, not a missing attribute.

### Internal links

`npm run validate` checks that every `](/…)` link resolves to a real route or a
file in `public/`. It deliberately does not check external links: a validator
that makes network calls can't run in a pre-commit hook or offline.

---

## Projects

Edit `content/projects.ts`. Newest first — the home page shows the first two,
`/projects` shows all of them.

```ts
{
  slug: "etsy-notifications",
  name: "Push notification infrastructure",
  summary: "One sentence. What it is, not how it works.",
  detail: "The interesting part — why you built it, what it taught you.",
  tech: ["PHP", "Braze", "FCM"],
  period: "2024 — 2025",
  status: "archived",          // "live" | "wip" | "archived"
  links: [{ label: "Source", href: "https://github.com/..." }],
}
```

`summary` is the hook and `detail` is optional. If `detail` says the same thing
as `summary` in more words, delete it.

---

## Videos and posts from a URL

```bash
npm run add -- "https://youtu.be/f84n5oFoZBc" -note "Why it's here."
npm run add -- "https://x.com/jack/status/20" -note "Why it's here."
```

That reads the title and channel (or the text, author and date) from the
site's public oEmbed endpoint, adds the entry at the top of
`content/videos.ts` or `content/tweets.ts`, and for a video downloads the
thumbnail too. No API key. Review the diff before committing — titles often
come with suffixes worth trimming.

`-note` is optional. Without it a video gets a `TODO` note, which `npm run
validate` warns about until you replace it. Running it twice with the same URL
is refused rather than duplicated. Deleted, private and age-restricted posts
can't be fetched; add those by hand as below.

## Videos

Edit `content/videos.ts`, then download the thumbnail:

```ts
{
  id: "y8OnoxKotPQ",          // from youtube.com/watch?v=THIS_PART
  title: "The Thirty Million Line Problem",
  channel: "Casey Muratori",
  note: "Why it's here, in your words.",
}
```

```bash
npm run thumbs
```

That writes `public/thumbs/<id>.jpg` and **you commit it**. The site renders
that local file; nothing is requested from `i.ytimg.com` at page load, and the
YouTube iframe is only mounted after a click.

If you forget, `npm run validate` warns and the card degrades to a gradient
placeholder — it won't break the build.

### Why click-to-load

A normal YouTube iframe pulls roughly 900KB of JavaScript and sets third-party
cookies on page load, for every visitor, whether or not they watch anything.
That's a real cost paid by everyone for the benefit of the few who press play.
It would also force `script-src https://www.youtube.com` into the CSP and
require a cookie notice in most jurisdictions.

---

## Tweets / posts

Edit `content/tweets.ts`. These are **stored as data, not embedded**:

```ts
{
  id: "1837201984512",
  author: { name: "Kelsey Hightower", handle: "kelseyhightower" },
  text: "You don't need a service mesh. You need to delete three services.",
  date: "2026-09-18",
  href: "https://x.com/kelseyhightower/status/1837201984512",
  note: "Optional: your take on why it matters.",
}
```

Copy the text, the handle, the date and the permalink. It takes about fifteen
seconds and it buys four things the official embed widget can't:

1. No third-party script, so no tracking of your visitors and no
   `script-src https://platform.twitter.com` in the CSP
2. No layout shift and no render-blocking fetch
3. The card still reads correctly when the post is deleted, the account goes
   private, or the embed API changes again
4. Your `note` sits next to it, which is the actual reason you saved it

Line breaks in `text` are preserved.

### If you want live embeds anyway

Add [`react-tweet`](https://github.com/vercel/react-tweet), which fetches at
build time in a server component — so it still ships no client script. You'd
be trading a paste for a build-time dependency on X's syndication API, which
has broken more than once. The data approach is why `content/tweets.ts` exists.

---

## Before you commit

```bash
npm run validate
```

The pre-commit hook runs this for you after `npm run hooks:install`. It also
blocks `.env` files and anything shaped like a credential — a backstop, since
the site needs no secrets at all.
