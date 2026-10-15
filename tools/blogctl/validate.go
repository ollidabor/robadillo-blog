package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

var (
	// Markdown and MDX links pointing inside the site: [text](/blog/foo)
	internalLink = regexp.MustCompile(`]\((/[^)\s"]*)`)
	videoID      = regexp.MustCompile(`\bid:\s*"([A-Za-z0-9_-]{11})"`)
)

// cmdValidate is the gate. It runs in the pre-commit hook and in CI, and it
// reports every problem it finds rather than stopping at the first, so one run
// tells you everything you need to fix.
func cmdValidate(root string) error {
	posts, problems := loadPosts(root)

	problems = append(problems, checkDuplicateSlugs(posts)...)
	problems = append(problems, checkInternalLinks(root, posts)...)

	warnings := checkThumbnails(root)
	warnings = append(warnings, checkPlaceholderNotes(root)...)

	for _, w := range warnings {
		fmt.Printf("  ! %s\n", w)
	}

	if len(problems) == 0 {
		published := 0
		for _, p := range posts {
			if !p.Frontmatter.Draft {
				published++
			}
		}
		fmt.Printf("  ✓ %d posts (%d published, %d draft), content valid\n",
			len(posts), published, len(posts)-published)
		if len(warnings) > 0 {
			fmt.Printf("  ✓ %d warning(s) above are not fatal\n", len(warnings))
		}
		return nil
	}

	for _, p := range problems {
		fmt.Printf("  ✗ %s\n", p)
	}
	return fmt.Errorf("%d problem(s) found", len(problems))
}

func loadPosts(root string) ([]*Post, []string) {
	dir := postsDir(root)

	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, []string{fmt.Sprintf("%s does not exist", rel(root, dir))}
		}
		return nil, []string{fmt.Sprintf("cannot read %s: %v", rel(root, dir), err)}
	}

	var (
		posts    []*Post
		problems []string
	)

	for _, entry := range entries {
		name := entry.Name()
		if entry.IsDir() || strings.HasPrefix(name, ".") || !mdxFileExt.MatchString(name) {
			continue
		}

		post, issues := parsePost(filepath.Join(dir, name), name)
		for _, issue := range issues {
			problems = append(problems, fmt.Sprintf("content/posts/%s: %s", name, issue))
		}
		if post != nil {
			posts = append(posts, post)
		}
	}

	sort.Slice(posts, func(i, j int) bool {
		return posts[i].Frontmatter.Date > posts[j].Frontmatter.Date
	})
	return posts, problems
}

func checkDuplicateSlugs(posts []*Post) []string {
	seen := make(map[string]string, len(posts))
	var problems []string

	for _, post := range posts {
		if other, ok := seen[post.Slug]; ok {
			problems = append(problems, fmt.Sprintf(
				"content/posts/%s and content/posts/%s both resolve to /blog/%s",
				other, post.File, post.Slug))
			continue
		}
		seen[post.Slug] = post.File
	}
	return problems
}

// checkInternalLinks catches the most common rot in a static site: a link to a
// page you renamed. External links are left alone on purpose — a validator
// that makes network calls can't run offline or in a pre-commit hook.
func checkInternalLinks(root string, posts []*Post) []string {
	routes := map[string]bool{
		"/":            true,
		"/about":       true,
		"/blog":        true,
		"/projects":    true,
		"/al-dia":      true,
		"/rss.xml":     true,
		"/sitemap.xml": true,
		"/robots.txt":  true,
	}
	for _, post := range posts {
		routes["/blog/"+post.Slug] = true
	}

	var problems []string
	for _, post := range posts {
		for _, match := range internalLink.FindAllStringSubmatch(post.Body, -1) {
			target := match[1]

			// Drop the fragment; anchors are generated from headings and are
			// not worth modelling here.
			if i := strings.Index(target, "#"); i >= 0 {
				target = target[:i]
			}
			if target == "" {
				continue
			}
			target = strings.TrimSuffix(target, "/")
			if target == "" {
				target = "/"
			}

			// Files that live in public/ are fine if they're actually there.
			if filepath.Ext(target) != "" && !routes[target] {
				if _, err := os.Stat(filepath.Join(root, "public", target)); err == nil {
					continue
				}
			}

			if !routes[target] {
				problems = append(problems, fmt.Sprintf(
					"content/posts/%s: link to %s goes nowhere", post.File, target))
			}
		}
	}
	return problems
}

// checkThumbnails is a warning, not an error: a missing thumbnail degrades to
// a gradient placeholder rather than breaking the page.
func checkThumbnails(root string) []string {
	ids, err := videoIDs(root)
	if err != nil {
		return []string{fmt.Sprintf("could not read content/videos.ts: %v", err)}
	}

	var warnings []string
	for _, id := range ids {
		if _, err := os.Stat(filepath.Join(thumbsDir(root), id+".jpg")); err != nil {
			warnings = append(warnings, fmt.Sprintf(
				"no thumbnail for video %s — run `npm run thumbs`", id))
		}
	}
	return warnings
}

// checkPlaceholderNotes flags the note `blogctl add` writes when -note is
// omitted. A warning, like a missing thumbnail: the page still renders, it
// just says TODO in public.
func checkPlaceholderNotes(root string) []string {
	var warnings []string
	for _, name := range []string{"videos.ts", "tweets.ts"} {
		raw, err := os.ReadFile(filepath.Join(root, "content", name))
		if err != nil {
			continue
		}
		if n := strings.Count(string(raw), notePlaceholder); n > 0 {
			warnings = append(warnings, fmt.Sprintf(
				"content/%s: %d note(s) still say %q", name, n, notePlaceholder))
		}
	}
	return warnings
}

// videoIDs scrapes the ids out of content/videos.ts. A regex rather than a
// TypeScript parse: the file is ours, the shape is fixed by content/types.ts,
// and the alternative is shipping a JS runtime inside a Go binary.
func videoIDs(root string) ([]string, error) {
	raw, err := os.ReadFile(filepath.Join(root, "content", "videos.ts"))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	var ids []string
	for _, match := range videoID.FindAllStringSubmatch(string(raw), -1) {
		ids = append(ids, match[1])
	}
	return ids, nil
}
