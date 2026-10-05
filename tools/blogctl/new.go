package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const template = `---
title: %q
date: %s
summary: "One sentence. This is the card text on /blog and the meta description, so write it for someone who hasn't decided to read yet."
tags: [%s]%s
---

Open with the concrete thing that happened. Not "in this post we will explore" —
the actual system, the actual number, the actual bad Tuesday.

## The first real heading

Body copy. Code blocks get a language and, optionally, a title:

` + "```ts title=\"example.ts\"" + `
export function thing(): void {
  // ...
}
` + "```" + `

<Callout>
Use this for the aside you'd otherwise put in parentheses.
</Callout>

## What I'd do differently

End with what you'd tell yourself. That's the part people keep.
`

func cmdNew(root string, args []string) error {
	fs := flag.NewFlagSet("new", flag.ContinueOnError)
	date := fs.String("date", time.Now().Format("2006-01-02"), "publish date (YYYY-MM-DD)")
	draft := fs.Bool("draft", false, "mark the post as a draft")
	tags := fs.String("tags", "", "comma-separated tags")

	if err := fs.Parse(args); err != nil {
		return err
	}

	title := strings.TrimSpace(strings.Join(fs.Args(), " "))
	if title == "" {
		return fmt.Errorf("a title is required: blogctl new \"My post title\"")
	}
	if !isoDate.MatchString(*date) {
		return fmt.Errorf("-date must be YYYY-MM-DD, got %q", *date)
	}

	slug := slugify(title)
	if slug == "" {
		return fmt.Errorf("the title %q produced an empty slug — use at least one letter or digit", title)
	}

	// Quote each tag so the generated frontmatter parses identically in both
	// validators regardless of what the tag contains.
	tagList := `"draft"`
	if *tags != "" {
		var quoted []string
		for _, tag := range strings.Split(*tags, ",") {
			if tag = strings.TrimSpace(tag); tag != "" {
				quoted = append(quoted, fmt.Sprintf("%q", tag))
			}
		}
		if len(quoted) > 0 {
			tagList = strings.Join(quoted, ", ")
		}
	}

	draftLine := ""
	if *draft {
		draftLine = "\ndraft: true"
	}

	if err := os.MkdirAll(postsDir(root), 0o755); err != nil {
		return err
	}

	path := filepath.Join(postsDir(root), fmt.Sprintf("%s-%s.mdx", *date, slug))
	if _, err := os.Stat(path); err == nil {
		return fmt.Errorf("%s already exists — pick a different title or date", rel(root, path))
	}

	body := fmt.Sprintf(template, title, *date, tagList, draftLine)

	// O_EXCL so a concurrent run can't clobber a file between the stat above
	// and the write.
	file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return err
	}
	defer file.Close()

	if _, err := file.WriteString(body); err != nil {
		return err
	}

	fmt.Printf("  ✓ %s\n", rel(root, path))
	fmt.Printf("    → /blog/%s\n", slug)
	fmt.Printf("    Replace the summary and tags before committing; `blogctl validate` will remind you.\n")
	return nil
}
