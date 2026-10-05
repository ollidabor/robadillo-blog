# Security

This is a static personal blog. It holds no user data, has no accounts, no
forms and no database. Saying so up front matters, because security advice
written for an application is mostly wasted here — and it hides the handful of
things that genuinely do apply.

So: what is actually at risk, what's done about it, and what isn't.

---

## 1. Threat model

What an attacker could plausibly want:

| Threat | Realistic? | What stands in the way |
| --- | --- | --- |
| Deface the site | Yes | Compromise GitHub or Vercel. Both need 2FA; `main` is protected |
| Serve malware to visitors | Yes | Same path, plus a compromised npm package in the build |
| Supply-chain attack via a dependency | Yes — the most likely one | Lockfile, `npm audit` in CI, Dependabot, few dependencies |
| Steal credentials or secrets | No | There are none. Not "well-protected" — absent |
| Exfiltrate a database | No | There is no database |
| XSS against a visitor | Barely | No user input anywhere; CSP blocks external script origins |
| Clickjack the site into a phishing frame | Yes | `frame-ancestors 'none'` + `X-Frame-Options: DENY` |
| Downgrade a visitor to HTTP and MITM | Yes, on hostile networks | HSTS with a two-year max-age |
| Track visitors through embeds | Yes, by default | Click-to-load embeds; tweets stored as data |
| Deanonymise a visitor via your own analytics | Yes, by default | No analytics at all |

Read that table as a prioritisation. **The realistic attacks are against the
accounts and the build pipeline, not against the website.** That's where to
spend effort.

---

## 2. The architecture is the main control

`next.config.ts` sets `output: "export"`. `next build` produces a folder of
HTML, CSS, JS and images, and that folder is the whole site.

What this removes, not mitigates:

- **No request handler.** Nothing parses visitor input on a server, so there is
  no injection surface — no SQLi, no SSRF, no path traversal, no deserialization
  bug, no template injection.
- **No secrets at runtime.** No API keys, no connection strings, no signing
  keys. There is no `.env` file to leak and nothing to rotate. Vercel's
  Environment Variables for this project are empty, and `.gitignore` blocks
  `.env*` as a backstop.
- **No database.** No credentials, no backups to secure, no migration that can
  drop a table.
- **No user input.** No forms, no comments, no search box, no newsletter
  signup. `form-action 'none'` in the CSP is enforceable precisely because
  nothing on the site posts anywhere.
- **No authentication.** No sessions, no cookies, no password reset flow —
  historically one of the richest sources of bugs in a small site.
- **Trivial rollback.** Every deployment is an immutable folder that still
  exists. Reverting is promoting an older one, which takes seconds and cannot
  fail halfway.

The remaining attack surface is: the two accounts that can publish, and the
packages that run during the build.

---

## 3. Response headers

Set in `vercel.json`. They go there, not in `next.config.ts`, because the
`headers()` option in Next's config is ignored under `output: "export"` —
there's no server left to apply it.

### `Content-Security-Policy`

```
default-src 'self';
base-uri 'none';
object-src 'none';
form-action 'none';
frame-ancestors 'none';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
media-src 'self';
worker-src 'self';
manifest-src 'self';
frame-src https://www.youtube-nocookie.com;
upgrade-insecure-requests
```

| Directive | Why |
| --- | --- |
| `default-src 'self'` | Anything not named below may only load from this origin |
| `base-uri 'none'` | Blocks an injected `<base>` tag from re-pointing every relative URL on the page |
| `object-src 'none'` | No Flash, no applets, no `<embed>` |
| `form-action 'none'` | Nothing can submit anywhere. There are no forms, so this costs nothing and defeats injected phishing forms |
| `frame-ancestors 'none'` | The site cannot be framed. Kills clickjacking |
| `script-src 'self' 'unsafe-inline'` | External script origins are blocked. See the honest note below |
| `style-src 'self' 'unsafe-inline'` | Shiki writes `style="--shiki-light:…"` on every syntax token |
| `img-src 'self' data:` | Images are local, including YouTube thumbnails |
| `font-src 'self'` | Fonts are self-hosted by `next/font`. No `fonts.gstatic.com` |
| `connect-src 'self'` | No `fetch`/XHR/WebSocket to anywhere else — the directive an exfiltration payload would need |
| `frame-src https://www.youtube-nocookie.com` | The only third-party origin the site permits, and only in an iframe |
| `upgrade-insecure-requests` | Any stray `http://` subresource is fetched over HTTPS |

### The honest note about `'unsafe-inline'`

`script-src` includes `'unsafe-inline'`, and that is a real weakening of the
policy. Here's why it's there and why it's an acceptable trade here.

Next.js App Router streams its React payload to the browser as a series of
inline `<script>` blocks (`self.__next_f.push([...])`). Their contents differ
on every page, so they cannot be pinned with hashes. The normal answer is a
per-request **nonce** — which needs a server to generate one. A static export
doesn't have one. You can verify this for yourself:

```bash
npm run build
grep -c '__next_f' out/blog/hola-mundo/index.html     # several, all page-specific
```

The options were: keep the static export and accept `'unsafe-inline'`, or
re-introduce a server-rendered middleware layer to issue nonces. The first was
chosen, because `'unsafe-inline'` only matters if an attacker can already
inject markup into a page — and on this site:

- All content is MDX in git, written by one person and reviewed in a diff
- Nothing is interpolated into a page from a URL parameter, a cookie, or a
  fetch at runtime
- There is no user input of any kind to inject through

So the precondition for the weakness simply doesn't exist. Meanwhile the
directive still does the job that matters: `script-src 'self'` means no script
can be loaded **from another origin**, which is how third-party script
injection actually happens in practice.

What `'unsafe-inline'` costs you is defence-in-depth — the layer that would
save you if a content-injection bug appeared later. If the site ever grows a
form, a search box, a comment system, or renders anything from a query
parameter, revisit this before shipping it, because the assumption above stops
being true.

> One inline script on the site is ours: the ~120-byte theme script in
> `src/app/layout.tsx`, which reads `localStorage` before first paint to avoid
> a white flash. It's deliberately tiny, interpolates nothing, and sits in a
> `try/catch`.

### The rest

| Header | Value | Why |
| --- | --- | --- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Two years. Browsers refuse HTTP to this host, so a downgrade attack on a café network fails |
| `X-Content-Type-Options` | `nosniff` | Stops a browser guessing a response is JavaScript when the server said otherwise |
| `X-Frame-Options` | `DENY` | Redundant with `frame-ancestors` for modern browsers; free for old ones |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Outbound links see `https://robadillo.com`, never which post the visitor came from |
| `Permissions-Policy` | camera, mic, geolocation, payment, USB, MIDI, serial, bluetooth, display-capture, idle-detection, local-fonts all `()` | Hardware the site never uses is denied outright, including to the YouTube iframe |
| `Cross-Origin-Opener-Policy` | `same-origin` | Severs `window.opener` for popups |
| `X-DNS-Prefetch-Control` | `off` | No speculative DNS lookups leaking which links exist |
| `X-Permitted-Cross-Domain-Policies` | `none` | Old Flash/PDF cross-domain policy, closed for completeness |

`Permissions-Policy` deliberately **omits** `autoplay`, `fullscreen`,
`picture-in-picture` and `encrypted-media`. Their default is `self`, which the
iframe's `allow` attribute then delegates. Listing them as `()` would break the
video player.

`Cross-Origin-Embedder-Policy` is deliberately **not** set. It would require
every cross-origin resource to opt in via CORP, and the YouTube iframe doesn't
— enabling it would break the one external thing on the site.

### Preloading HSTS

The header already says `preload`, but that's only a declaration of intent.
Actually submitting `robadillo.com` to
[hstspreload.org](https://hstspreload.org) hard-codes it into browsers, and
**removal takes months**. Submit only once you're sure every subdomain you will
ever use can serve HTTPS. There's no hurry.

---

## 4. Third-party requests

**Target state: loading any page of this site makes zero requests to any host
other than `robadillo.com`.**

That is currently true, and it's an invariant worth protecting because it's the
kind of thing that erodes one convenient `<script>` tag at a time.

How each temptation was handled:

| Normally | Here |
| --- | --- |
| Google Fonts `<link>` | `next/font` downloads and self-hosts at build time. No visitor IP reaches Google |
| YouTube `<iframe>` | Click-to-load facade over a locally-committed thumbnail. The iframe mounts on click, and only then, pointed at `youtube-nocookie.com` |
| X/Twitter embed script | Tweets stored as data in `content/tweets.ts` and rendered as our own card |
| Analytics | None |
| Shields/badges, Gravatar, CDN-hosted libraries | None |
| Syntax highlighter in the browser | Shiki runs at build time; nothing ships |

Verify the invariant after any change:

```bash
npm run build
grep -rhoE 'https?://[a-z0-9.-]+' out --include='*.html' | sort -u
```

The only hosts that should appear are `robadillo.com`, `schema.org` (a JSON-LD
namespace identifier — never fetched), and the destinations of links you
deliberately added. A hostname showing up under `src=` or `href=` on a
`<script>`, `<link rel=stylesheet>` or `<img>` is a regression.

Because there are no third-party requests and no analytics, the site sets **no
cookies** and uses browser storage only for the one theme preference, which
never leaves the device. Hence no cookie banner — not as an omission, but
because there is nothing to consent to.

---

## 5. Supply chain

This is the realistic attack path, so it gets the most attention.

**Few dependencies, chosen for it.** Ten runtime packages. The Go CLI has
**zero** module dependencies — standard library only. `.prose` typography is
~80 hand-written lines of CSS instead of `@tailwindcss/typography`; reading
time is four lines instead of a package; the three social icons are inline SVG
instead of an icon library. Each of those is one fewer maintainer whose npm
account can be phished.

**Pinned installs.** `package-lock.json` is committed and CI runs `npm ci`,
which installs exactly what's pinned and fails if the lockfile and
`package.json` disagree.

**Audited in CI.** `npm audit --audit-level=high` runs on every push and fails
the build. Note that this blocks the *merge*, not a Vercel deploy — Vercel
builds independently, which is what branch protection on `main` is for.

**Updated on a schedule.** `.github/dependabot.yml` opens weekly npm PRs
grouped into framework and everything-else, plus monthly Actions and Go
updates. CI runs on each, so the usual review is: read the changelog, see
green, merge.

**Pinned Actions and no write token.** The CI workflow declares
`permissions: contents: read` and sets `persist-credentials: false` on
checkout, so a compromised step has no repo-write token to use.

**Build-time-only vulnerabilities still count.** This project started on
Next.js 15, which pinned a PostCSS version carrying four advisories. PostCSS
only ever processed our own CSS, so none were exploitable — the project moved
to Next.js 16 anyway. Reasoning your way out of an advisory is a decision to
revisit, not a conclusion to file away.

---

## 6. Accounts and repo

The accounts are the crown jewels: either one can publish arbitrary content to
`robadillo.com`.

- **2FA on GitHub, Vercel and Porkbun.** Prefer a passkey or TOTP over SMS.
- **Registrar lock at Porkbun.** Domain transfer lock on, and 2FA on that
  account. A stolen domain is worse than a defaced site — it's your identity,
  your email, and your certificates.
- **Scope the Vercel GitHub app to this repository only.** Not "all
  repositories".
- **Branch protection on `main`:** require a PR, require CI to pass, no force
  pushes. The same rules you'd want on a repo with collaborators, for the same
  reason — a stolen laptop with a warm SSH key is a collaborator.
- **Secret scanning and Dependabot alerts on** (free for public repos).
- **Pre-commit backstop.** `.githooks/pre-commit` refuses to commit a `.env`
  file or a diff containing something shaped like an AWS key, a GitHub token,
  an OpenAI key or a PEM private key. It is a seatbelt, not a scanner: the real
  control is that the site needs no secrets.

### Things not to commit

Obvious in principle, easy in practice when a post includes a screenshot:

- Screenshots with internal URLs, dashboards, ticket numbers, colleagues' names
  or real customer data. Crop and redact before committing — git keeps the
  original forever, and rewriting history on a pushed public repo is a bad day.
- Real identifiers in example code. Use obviously-fake values.
- Your primary email address in plain text. See the note in
  [CUSTOMIZING.md](CUSTOMIZING.md#a-note-on-your-email-address).
- Anything an employer would consider confidential. A static site is maximally
  indexable; that's the point of it.

---

## 7. What this does not protect against

Stated plainly, because a security doc that only lists wins is marketing.

- **A compromised GitHub or Vercel account.** Either one can publish whatever
  it likes. Nothing in this repo prevents that; 2FA and branch protection are
  the whole defence.
- **A malicious npm package executing during the build.** It runs with the
  build's privileges and could alter the output. Few dependencies, a lockfile
  and Dependabot reduce the odds; they don't eliminate them.
- **Vercel itself.** They terminate TLS and serve the bytes. Using a host means
  trusting the host.
- **A compromised registrar account.** Someone who controls DNS controls the
  domain, certificates included.
- **Content injection, if the site ever grows an input.** The `'unsafe-inline'`
  trade in §3 depends on there being no user input. Adding one changes that
  calculation.
- **Denial of service.** Vercel's Hobby plan has fair-use limits. A determined
  flood can exhaust them and the site goes quiet until the window resets. For a
  personal blog that's an acceptable outcome, not a mitigated one.
- **Anything in the YouTube iframe, after you click play.** At that point
  you're on Google's page, under Google's rules. That's exactly why it takes a
  click.

---

## 8. Verifying all of it

```bash
# Build what gets deployed
npm run check

# No third-party hosts in the output
grep -rhoE 'https?://[a-z0-9.-]+' out --include='*.html' | sort -u

# Headers on the live site
curl -sI https://robadillo.com | grep -iE \
  'content-security|strict-transport|x-content-type|x-frame|referrer|permissions|cross-origin|x-dns|x-permitted'

# HTTP is redirected, not served
curl -sI http://robadillo.com | head -1

# No vulnerable dependencies
npm audit --audit-level=high

# No secrets in history (requires gitleaks)
gitleaks detect --no-banner
```

External graders, roughly annually or after any change to `vercel.json`:

- [securityheaders.com](https://securityheaders.com) — expect A or A+
- [Mozilla Observatory](https://developer.mozilla.org/en-US/observatory)
- [SSL Labs](https://www.ssllabs.com/ssltest/) — Vercel's TLS config, expect A+

Observatory and securityheaders.com both deduct for `'unsafe-inline'` in
`script-src`. That deduction is correct and §3 explains why it's accepted here.

---

## 9. Reporting something

Found a problem with the site? Open a
[private security advisory](https://github.com/ollidabor/robadillo-blog/security/advisories/new)
on the repo rather than a public issue.

It's a static blog, so please don't send reports about missing headers on
`/_next/static/`, the lack of a cookie banner on a site that sets no cookies,
or `'unsafe-inline'` in `script-src` — that last one is documented above as a
known, accepted trade.
