# blogctl

The authoring CLI for this site. Scaffolds posts, validates content, and pulls
YouTube thumbnails down so the site never has to ask a third party for them.

It uses **only the Go standard library**. Zero module dependencies, which means
nothing to audit and nothing for Dependabot to find in a repo whose whole point
is not having much to attack.

## Why Go, in a TypeScript repo

A fair question, and the honest answer is that it's a judgement call rather
than a necessity. What it buys:

- **It runs before `node_modules` exists.** The pre-commit hook and the CI
  content job need no `npm install`, so validation is fast and independent of
  the JavaScript build.
- **A single static binary.** `go build` and the hook works on any machine with
  no runtime to match.
- **Two independent implementations of the frontmatter rules.** The Go parser
  and `src/lib/posts.ts` check the same contract from different directions. A
  disagreement between them is a signal that the contract is underspecified.

What it costs: a second toolchain to install, and two places to edit when the
frontmatter schema changes. If that trade stops being worth it, `npm run
validate` can be reimplemented in TypeScript and `tools/` deleted — the site
builds without it.

## Usage

Via npm, from the repo root:

```bash
npm run new -- "Post title"    # scaffold a post
npm run validate               # check everything
npm run thumbs                 # download YouTube thumbnails
npm run stats                  # word counts and tags
```

Or directly:

```bash
go -C tools/blogctl run . validate
```

Or build it once and put it on your `PATH`:

```bash
go build -C tools/blogctl -o "$(go env GOPATH)/bin/blogctl" .
blogctl validate
```

It finds the repo root by walking up from the working directory looking for
`package.json`, so it behaves the same from anywhere in the tree.

## Commands

### `new <title>`

Creates `content/posts/<date>-<slug>.mdx` with valid frontmatter and a
skeleton. Accented characters are transliterated, so *"Qué aprendí"* becomes
`que-aprendi` rather than something percent-encoded in every link.

```bash
blogctl new -date 2026-11-04 -tags "go,tooling" -draft "Title here"
```

| Flag | Default | |
| --- | --- | --- |
| `-date` | today | Publish date, `YYYY-MM-DD` |
| `-draft` | false | Marks the post as a draft |
| `-tags` | `draft` | Comma-separated tags |

Refuses to overwrite an existing file.

### `validate`

Exits non-zero if anything is wrong, and reports **every** problem rather than
stopping at the first — one run tells you everything to fix.

Errors:

- Missing, unclosed or unparseable frontmatter
- Missing `title`, `date`, `summary` or `tags`
- `date` not `YYYY-MM-DD`, or not matching the filename prefix
- `summary` over 200 characters
- An unknown frontmatter key
- Two files resolving to the same `/blog/<slug>`
- An empty body
- An internal link (`](/…)`) pointing at a route that doesn't exist

Warnings (non-fatal):

- A video in `content/videos.ts` with no downloaded thumbnail

External links are deliberately not checked: a validator that makes network
calls can't run offline or in a pre-commit hook.

> Adding a route to the site means adding it to the `routes` map in
> `validate.go`, or links to it get reported as dead.

### `thumbs`

Downloads a thumbnail for every video id in `content/videos.ts` into
`public/thumbs/<id>.jpg`, trying `maxresdefault` → `sddefault` → `hqdefault`.
Skips anything already downloaded. Writes to a temp file and renames, so an
interrupted download can't leave a truncated JPEG that the site then renders.
Reads are bounded at 4 MiB.

Commit the results — they're what makes the site's zero-third-party-request
property hold.

### `stats`

Word counts per post and the tag distribution. No purpose beyond curiosity.

## Layout

| File | |
| --- | --- |
| `main.go` | Command dispatch, repo-root discovery, slugification |
| `frontmatter.go` | The YAML subset parser and per-post validation |
| `validate.go` | Loading posts, duplicate slugs, internal links, thumbnails |
| `new.go` | Scaffolding |
| `thumbs.go` | Thumbnail downloads |
| `stats.go` | Counting |

The frontmatter parser accepts a deliberately narrow YAML subset: `key: value`,
quoted scalars, `tags: [a, b]`, and block sequences. Anything else is an error
rather than a silent default — a silently-defaulted field is how a post ends up
live with no summary.

## Development

```bash
cd tools/blogctl
gofmt -l .        # must print nothing
go vet ./...
go build -o /dev/null .
```

CI runs all three.
