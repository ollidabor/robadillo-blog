# Security policy

## Reporting a vulnerability

Please open a [private security
advisory](https://github.com/ollidabor/robadillo-blog/security/advisories/new)
rather than a public issue. I'll respond as soon as I reasonably can — this is
a personal blog, not a product, so there's no SLA behind that.

## Scope

This repository builds a statically exported site. It has no server-side code,
no database, no accounts and no user input. The design, the threat model, and
the trade-offs made on purpose are documented in
**[docs/SECURITY.md](docs/SECURITY.md)** — please read it before reporting.

Already known and accepted, with reasoning in that document:

- `'unsafe-inline'` in the `script-src` CSP directive
- No cookie banner, on a site that sets no cookies
- No `Cross-Origin-Embedder-Policy`, which would break the video player

Out of scope: anything requiring a compromised GitHub, Vercel or registrar
account; denial of service; and findings against Vercel's own infrastructure,
which belong in [their programme](https://vercel.com/security).
