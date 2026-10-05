// Command blogctl is the authoring tool for robadillo.com.
//
// It does the things a static site still needs a program for: scaffolding a
// post with valid frontmatter, rejecting content that would break the build,
// and pulling YouTube thumbnails down so the site never has to ask a third
// party for them at render time.
//
// It has no dependencies outside the standard library — one fewer supply chain
// in a repo whose whole point is not having much to attack.
//
// Usage:
//
//	blogctl new "Post title"   scaffold content/posts/<date>-<slug>.mdx
//	blogctl validate           check every post, fail on anything broken
//	blogctl thumbs             download thumbnails for content/videos.ts
//	blogctl stats              word counts and tag distribution
package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const usage = `blogctl — authoring tool for this site

Usage:
  blogctl new <title>     Scaffold a new post in content/posts/
  blogctl validate        Validate all content; non-zero exit on any problem
  blogctl thumbs          Download YouTube thumbnails into public/thumbs/
  blogctl stats           Show word counts and tag distribution
  blogctl help            Show this message

Flags:
  new  -date YYYY-MM-DD   Publish date (default: today)
       -draft             Mark the post as a draft
       -tags a,b,c        Comma-separated tags
`

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintf(os.Stderr, "blogctl: %v\n", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	if len(args) == 0 {
		fmt.Print(usage)
		return nil
	}

	root, err := repoRoot()
	if err != nil {
		return err
	}

	switch args[0] {
	case "new":
		return cmdNew(root, args[1:])
	case "validate":
		return cmdValidate(root)
	case "thumbs":
		return cmdThumbs(root)
	case "stats":
		return cmdStats(root)
	case "help", "-h", "--help":
		fmt.Print(usage)
		return nil
	default:
		return fmt.Errorf("unknown command %q (try `blogctl help`)", args[0])
	}
}

// repoRoot walks up from the working directory looking for package.json, so
// the tool behaves the same whether it's run from the repo root, from
// tools/blogctl, or from a git hook.
func repoRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for {
		if _, err := os.Stat(filepath.Join(dir, "package.json")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", errors.New("could not find the repo root (no package.json in any parent directory)")
		}
		dir = parent
	}
}

func postsDir(root string) string  { return filepath.Join(root, "content", "posts") }
func thumbsDir(root string) string { return filepath.Join(root, "public", "thumbs") }

// rel shortens an absolute path for display.
func rel(root, path string) string {
	if r, err := filepath.Rel(root, path); err == nil {
		return r
	}
	return path
}

// slugify turns a human title into a URL segment. ASCII-only on purpose: the
// accented characters common in Spanish titles become their base letter rather
// than being percent-encoded in every link to the post.
func slugify(title string) string {
	replacements := map[rune]string{
		'á': "a", 'à': "a", 'ä': "a", 'â': "a", 'ã': "a",
		'é': "e", 'è': "e", 'ë': "e", 'ê': "e",
		'í': "i", 'ì': "i", 'ï': "i", 'î': "i",
		'ó': "o", 'ò': "o", 'ö': "o", 'ô': "o", 'õ': "o",
		'ú': "u", 'ù': "u", 'ü': "u", 'û': "u",
		'ñ': "n", 'ç': "c",
	}

	var b strings.Builder
	for _, r := range strings.ToLower(title) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
		case replacements[r] != "":
			b.WriteString(replacements[r])
		default:
			b.WriteByte('-')
		}
	}

	// Collapse runs of hyphens and trim the ends.
	out := b.String()
	for strings.Contains(out, "--") {
		out = strings.ReplaceAll(out, "--", "-")
	}
	return strings.Trim(out, "-")
}
