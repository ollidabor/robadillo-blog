# robadillo.com

Personal site and blog. A statically exported Next.js app: `npm run build`
produces a folder of HTML, CSS and JS, and that folder is the entire website.
No database, no API, no server-side code running anywhere.

Live at **[robadillo.com](https://robadillo.com)**.

---

## Why it's built this way

The constraint driving every decision here was *nothing that can be
compromised at runtime*. A static export has no request handler to exploit, no
connection string to leak and no secret to rotate. Everything else follows:

| Decision | Reason |
| --- | --- |
| `output: "export"` | No serverless functions, no runtime secrets, portable to any static host |
| Posts as MDX files in `content/` | Publishing is a commit; history and review come free |
| Click-to-load YouTube embeds | Zero third-party requests until a visitor presses play |
| Tweets stored as data, not embeds | No X script on the page, no card that breaks when a post is deleted |
| Fonts self-hosted via `next/font` | No request to Google at runtime, no visitor IP in their logs |
| Syntax highlighting at build time | Shiki runs during the build; no highlighter ships to the browser |
| No analytics | Nothing to disclose, nothing to warn about, no cookie banner |
| A Go CLI for authoring | Validates content before a commit can break the build |

The full reasoning, including what this design does *not* protect against, is
in **[docs/SECURITY.md](docs/SECURITY.md)**.

## Quick start

You need **Node 20.9+** and **Go 1.25+**. If you have neither, see
[Installing the toolchain](#installing-the-toolchain) below.

```bash
git clone git@github.com:ollidabor/robadillo-blog.git
cd robadillo-blog

npm install
npm run hooks:install   # installs the pre-commit content check
npm run dev             # http://localhost:3000
```

To check what CI will check, before pushing:

```bash
npm run check           # validate → typecheck → build
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload. Drafts are visible here. |
| `npm run build` | Production build into `out/`. Drafts are excluded. |
| `npm run preview` | Serve `out/` locally, so you see exactly what deploys. |
| `npm run check` | Everything CI runs: validate, typecheck, build. |
| `npm run new -- "Title"` | Scaffold a post. Takes `-date`, `-draft`, `-tags`. |
| `npm run validate` | Check frontmatter, duplicate slugs, dead internal links. |
| `npm run thumbs` | Download YouTube thumbnails into `public/thumbs/`. |
| `npm run stats` | Word counts and tag distribution. |
| `npm run typecheck` | `tsc --noEmit`. |

## Layout

```
content/              Everything you edit to change the site
  site.ts               Name, tagline, nav, social links, canonical URL
  about.mdx             The /about page copy
  posts/*.mdx           Blog posts — one file per post
  projects.ts           The /projects list
  videos.ts             YouTube videos for /al-dia
  tweets.ts             Posts worth reading, for /al-dia
  types.ts              The shape of all of the above

src/
  app/                  Routes (Next.js App Router)
    page.tsx              /
    about/                /about
    blog/                 /blog and /blog/[slug]
    projects/             /projects
    al-dia/               /al-dia
    rss.xml/              /rss.xml
    sitemap.ts            /sitemap.xml
    robots.ts             /robots.txt
    globals.css           The entire design system — all theme tokens live here
  components/           React components
  lib/
    posts.ts              Reads and validates content/posts at build time
    thumbs.ts             Resolves local thumbnails
    format.ts             Date formatting

tools/blogctl/        The authoring CLI, in Go. Zero dependencies.
public/               Static files served as-is
docs/                 The documentation you're probably looking for
vercel.json           Security headers and caching
```

## Documentation

- **[docs/CONTENT.md](docs/CONTENT.md)** — writing posts, adding projects,
  videos and tweets
- **[docs/CUSTOMIZING.md](docs/CUSTOMIZING.md)** — colours, fonts, typography,
  nav, adding a page
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Vercel plus a custom domain at
  Porkbun, step by step
- **[docs/SECURITY.md](docs/SECURITY.md)** — threat model, every control, and
  how to verify each one
- **[tools/blogctl/README.md](tools/blogctl/README.md)** — the CLI

## Installing the toolchain

Node, via [nvm](https://github.com/nvm-sh/nvm) (no `sudo`, contained in
`~/.nvm`):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# then, in a new shell:
nvm install 22 && nvm alias default 22
```

Go, from [go.dev/dl](https://go.dev/dl/). Either the `.pkg` installer, or
without `sudo`:

```bash
curl -fsSLO https://go.dev/dl/go1.25.1.darwin-arm64.tar.gz
tar -C "$HOME/.local" -xzf go1.25.1.darwin-arm64.tar.gz
export PATH="$HOME/.local/go/bin:$PATH"   # add this to ~/.zshrc
```

Go is only needed for the authoring CLI. The site builds and deploys without
it — `npm run build` never calls it, and CI runs the two independently.

## Forking this

The code is MIT; the writing in `content/` is not. Replace `content/` with your
own and start from [docs/CUSTOMIZING.md](docs/CUSTOMIZING.md). See
[LICENSE](LICENSE).
