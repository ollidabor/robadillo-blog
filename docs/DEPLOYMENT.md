# Deploying to robadillo.com

Target setup: GitHub → Vercel builds on every push to `main` → served at
`robadillo.com`, with DNS staying at Porkbun.

Vercel's **Hobby** plan covers this. It's free and explicitly for
non-commercial personal projects — which this is. If the site ever carries ads,
sells something, or represents a business, that moves it to Pro.

---

## Before you start

- A GitHub account with push access to `ollidabor/robadillo-blog`
- A Vercel account — sign in with GitHub, it saves a step later
- Access to the Porkbun account holding `robadillo.com`
- `npm run check` passing locally

---

## 1. Push the repo

```bash
cd robadillo-blog
git add .
git commit -m "Initial site"
git push -u origin main
```

## 2. Import into Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Authorise Vercel for GitHub if prompted. Grant access to **only this
   repository**, not all of them — Vercel never needs to read your other code.
3. Pick `ollidabor/robadillo-blog` → **Import**

On the configure screen:

| Setting | Value |
| --- | --- |
| Framework Preset | **Next.js** (detected automatically) |
| Build Command | leave default (`next build`) |
| Output Directory | **leave empty** |
| Install Command | leave default |
| Environment Variables | **none** |

Leave Output Directory empty on purpose. Vercel's Next.js preset reads
`output: "export"` from `next.config.ts` and finds `out/` itself; overriding it
by hand is the usual way this setup breaks.

There are no environment variables because the site has no secrets. If you ever
find yourself adding one, that's a signal the architecture changed — read
[SECURITY.md](SECURITY.md) first.

Click **Deploy**. Two or three minutes later you'll have a
`robadillo-blog-….vercel.app` URL. Open it and click around before touching
DNS.

## 3. Add the domain in Vercel

1. Project → **Settings** → **Domains**
2. **Add Domain** → `robadillo.com` → **Add**
3. Vercel offers to add `www.robadillo.com` too. **Say yes.** You want both
   claimed so one redirects to the other rather than returning a certificate
   error.
4. Vercel now shows the exact DNS records to create. **Leave this tab open.**

> The values are specific to your project. Vercel used to hand everyone
> `76.76.21.21` and `cname.vercel-dns.com`; it now issues a per-project A
> address and a per-project CNAME target like
> `d1d4fc829fe7bc7c.vercel-dns-017.com`. Copy what your dashboard shows — not
> a value from a tutorial, including this one.

## 4. Clear Porkbun's parking records

This is the step people miss. A freshly registered Porkbun domain ships with
records pointing at their parking page, and they will conflict with yours.

1. [porkbun.com](https://porkbun.com) → **Domain Management** → `robadillo.com`
2. **DNS** → **Edit** (or "DNS Records")
3. **Delete** every existing `A`, `AAAA`, `ALIAS` and `CNAME` record for the
   root (`robadillo.com`) and for `www`. At the time of writing, a new Porkbun
   domain has three root `A` records in `207.207.210.x` and a `www` `CNAME` to
   `uixie.porkbun.com`.
4. Leave `NS` and `SOA` alone. Leave any `MX` or `TXT` records alone if you've
   set up email — deleting an `MX` record is how you stop receiving mail.
5. If **URL Forwarding** is on, turn it off. It overrides DNS.

## 5. Create the records at Porkbun

Using the values from the Vercel tab:

| Type | Host | Answer | TTL |
| --- | --- | --- | --- |
| `A` | *(blank — means the root)* | the IP Vercel shows for the apex | 600 |
| `CNAME` | `www` | the target Vercel shows for `www` | 600 |

Porkbun calls the name field **Host** and the value field **Answer**. A blank
Host means the apex. A trailing dot on the CNAME answer is fine either way.

Keep the TTL low (600s) until it's working. Raise it to 3600 afterwards if you
like; it rarely matters.

### Optional: a CAA record

A `CAA` record states which certificate authorities may issue for your domain,
so a misissuance elsewhere can't quietly produce a valid certificate for
`robadillo.com`.

| Type | Host | Answer |
| --- | --- | --- |
| `CAA` | *(blank)* | `0 issue "letsencrypt.org"` |

Add it **after** Vercel has issued your first certificate, not before — a CAA
record naming the wrong CA will block issuance and the failure is confusing.
Check which CA Vercel used first:

```bash
echo | openssl s_client -connect robadillo.com:443 -servername robadillo.com 2>/dev/null \
  | openssl x509 -noout -issuer
```

## 6. Wait, then verify

Propagation is usually minutes, occasionally an hour. Watch it from your side
rather than reloading the dashboard:

```bash
dig +short A robadillo.com
dig +short CNAME www.robadillo.com
```

When those show Vercel's values, the **Domains** page flips to *Valid
Configuration* and Vercel issues a Let's Encrypt certificate automatically.
Then:

```bash
curl -sI https://robadillo.com | head -1        # expect HTTP/2 200
curl -sI http://robadillo.com | head -1         # expect a 308 to https
curl -sI https://www.robadillo.com | head -1    # expect a 308 to the apex
```

## 7. Pick a canonical host

Vercel redirects between apex and `www` automatically, but make it explicit so
it can't change under you. In **Settings → Domains**, set `www.robadillo.com`
to **Redirect to robadillo.com** (308).

Then confirm `url` in `content/site.ts` matches the host you kept:

```ts
url: "https://robadillo.com",   // no trailing slash
```

Everything canonical — OG tags, the sitemap, RSS links — is built from that
string. If it disagrees with the live host, search engines index the wrong one.

## 8. Verify the security headers

```bash
curl -sI https://robadillo.com | grep -iE \
  'content-security|strict-transport|x-content-type|x-frame|referrer|permissions|cross-origin'
```

All seven should be present. If they aren't, `vercel.json` didn't ship — check
it's committed and that the deploy you're hitting is the newest one.

Then run the site through [securityheaders.com](https://securityheaders.com)
and [Mozilla Observatory](https://developer.mozilla.org/en-US/observatory). The
expected grade is A or A+. [SECURITY.md](SECURITY.md) explains each header and
the one deduction you may see.

## 9. Lock down the repo

Settings worth changing once, on GitHub:

1. **Branches** → add a ruleset for `main`: require a pull request, require the
   `CI` status checks to pass, block force pushes.
2. **Actions** → **General** → set workflow permissions to **read-only**.
3. **Code security** → enable **Dependabot alerts** and **secret scanning**
   (free on public repos). `.github/dependabot.yml` already handles updates.

And on Vercel:

4. **Settings → Git** → confirm the production branch is `main`.
5. **Settings → Deployment Protection** → leave preview deployments public or
   put them behind Vercel Authentication, your call. Note that a public
   preview URL is a real, crawlable copy of any draft post you push to a
   branch.
6. **Settings → Analytics / Speed Insights** → leave **off**. Both inject a
   client script; Speed Insights would also need `connect-src` opened up in
   the CSP. The site currently ships no analytics at all, which is why there's
   no cookie banner.

---

## The deploy loop, from here on

```bash
npm run new -- "Something I learned"
# write the post
npm run check          # validate, typecheck, build
git add . && git commit -m "Post: something I learned"
git push
```

Vercel builds and promotes it. Pushing to any other branch gives you a preview
URL instead, which is the easiest way to read a draft on your phone.

## Rolling back

**Vercel → Deployments** → find the last good one → **⋯** → **Promote to
Production**. It's instant, because every deployment is just a different folder
of static files that already exists. No rebuild, no migration.

---

## Troubleshooting

**"Invalid Configuration" on the Domains page.** A leftover `A`, `AAAA`,
`ALIAS` or `CNAME` record for the same host. Check with
`dig robadillo.com ANY +noall +answer` and delete the extras at Porkbun.

**The apex works but `www` doesn't.** `www` needs its own record and its own
entry in Vercel's Domains list. Both, not either.

**Certificate stuck on "pending".** Vercel needs the DNS record resolving
before Let's Encrypt will validate. Confirm with `dig` from a network other
than yours — [dnschecker.org](https://dnschecker.org) is fine for this. If a
`CAA` record exists, make sure it names the CA Vercel is actually using.

**Build passes locally, fails on Vercel.** Almost always a case-sensitivity
difference: macOS doesn't care about `Header.tsx` vs `header.tsx`, Vercel's
Linux builders do. The second likeliest cause is a dependency installed
locally but not committed to `package-lock.json`.

**A page 404s that exists locally.** `output: "export"` only renders routes it
knows about at build time. A dynamic route needs `generateStaticParams` — see
`src/app/blog/[slug]/page.tsx`.

**Headers missing on one path only.** The `source` patterns in `vercel.json`
are evaluated in order and the first match wins per header key. Check you
haven't shadowed `/(.*)` with a narrower rule above it.

---

## Moving off Vercel later

The build output is a plain folder, so the site itself is portable to any
static host: Cloudflare Pages, Netlify, GitHub Pages, S3 + CloudFront, an nginx
box.

The one thing that doesn't travel is `vercel.json`. Those headers are
platform-specific, and losing them silently is worse than the migration being
visible. On Cloudflare Pages or Netlify, the equivalent is a `public/_headers`
file; on nginx, `add_header` directives; on GitHub Pages, there is no
equivalent at all — you cannot set a CSP there, which is why it was ruled out.
