package main

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

// Frontmatter mirrors PostFrontmatter in src/lib/posts.ts. If you add a field
// there, add it here too — this is the check that runs before the commit, and
// the TypeScript one is the check that runs at build. They should agree.
type Frontmatter struct {
	Title   string
	Date    string
	Summary string
	Tags    []string
	Draft   bool
}

// Post is a parsed file on disk.
type Post struct {
	File        string // base name, e.g. 2026-10-01-hola-mundo.mdx
	Slug        string
	Frontmatter Frontmatter
	Body        string
}

var (
	isoDate     = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
	datePrefix  = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}-`)
	mdxFileExt  = regexp.MustCompile(`\.mdx?$`)
	flowSeqItem = regexp.MustCompile(`\s*,\s*`)
)

// parsePost reads one MDX file and splits frontmatter from body.
//
// The YAML subset accepted here is deliberately narrow: `key: value`, quoted
// scalars, `tags: [a, b]`, and block sequences. Anything else is an error
// rather than a silent default, because a silently-defaulted field is how a
// post ends up live with no summary.
func parsePost(path, base string) (*Post, []string) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, []string{fmt.Sprintf("cannot read file: %v", err)}
	}

	text := strings.ReplaceAll(string(raw), "\r\n", "\n")
	if !strings.HasPrefix(text, "---\n") {
		return nil, []string{"missing frontmatter block (the file must start with `---`)"}
	}

	end := strings.Index(text[4:], "\n---")
	if end < 0 {
		return nil, []string{"frontmatter block is never closed (expected a line with `---`)"}
	}
	head := text[4 : 4+end]
	body := strings.TrimPrefix(text[4+end+4:], "\n")

	fm, problems := parseFrontmatter(head)

	// Validation that needs the whole post, not just one field.
	if fm.Title == "" {
		problems = append(problems, "`title` is required")
	}
	if fm.Date == "" {
		problems = append(problems, "`date` is required")
	} else if !isoDate.MatchString(fm.Date) {
		problems = append(problems, fmt.Sprintf("`date` must be YYYY-MM-DD, got %q", fm.Date))
	}
	if fm.Summary == "" {
		problems = append(problems, "`summary` is required — it's the card text and the meta description")
	} else if n := len([]rune(fm.Summary)); n > 200 {
		problems = append(problems, fmt.Sprintf("`summary` is %d characters; keep it under 200", n))
	}
	if len(fm.Tags) == 0 {
		problems = append(problems, "`tags` is empty — add at least one so the post is findable")
	}
	if strings.TrimSpace(body) == "" {
		problems = append(problems, "the post has no body")
	}

	// The filename should carry the publish date, so the directory sorts.
	// Skipped when the date itself is invalid — one error per problem.
	if isoDate.MatchString(fm.Date) && !strings.HasPrefix(base, fm.Date+"-") {
		problems = append(problems, fmt.Sprintf(
			"filename should start with the publish date: expected %s-%s",
			fm.Date, mdxFileExt.ReplaceAllString(datePrefix.ReplaceAllString(base, ""), "")+".mdx"))
	}

	return &Post{
		File:        base,
		Slug:        mdxFileExt.ReplaceAllString(datePrefix.ReplaceAllString(base, ""), ""),
		Frontmatter: fm,
		Body:        body,
	}, problems
}

func parseFrontmatter(head string) (Frontmatter, []string) {
	var (
		fm         Frontmatter
		problems   []string
		pendingKey string
	)

	for i, line := range strings.Split(head, "\n") {
		lineNo := i + 1

		if strings.TrimSpace(line) == "" || strings.HasPrefix(strings.TrimSpace(line), "#") {
			continue
		}

		// Block sequence item belonging to the previous key: "  - value"
		if trimmed := strings.TrimSpace(line); strings.HasPrefix(trimmed, "- ") {
			value := unquote(strings.TrimSpace(strings.TrimPrefix(trimmed, "- ")))
			switch pendingKey {
			case "tags":
				fm.Tags = append(fm.Tags, value)
			case "":
				problems = append(problems, fmt.Sprintf("line %d: list item with no key above it", lineNo))
			default:
				problems = append(problems, fmt.Sprintf("line %d: `%s` does not take a list", lineNo, pendingKey))
			}
			continue
		}

		key, value, found := strings.Cut(line, ":")
		if !found {
			problems = append(problems, fmt.Sprintf("line %d: expected `key: value`, got %q", lineNo, line))
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		pendingKey = key

		switch key {
		case "title":
			fm.Title = unquote(value)
		case "date":
			fm.Date = unquote(value)
		case "summary":
			fm.Summary = unquote(value)
		case "tags":
			if value == "" {
				continue // block sequence follows
			}
			tags, err := parseFlowSequence(value)
			if err != nil {
				problems = append(problems, fmt.Sprintf("line %d: %v", lineNo, err))
				continue
			}
			fm.Tags = append(fm.Tags, tags...)
		case "draft":
			switch unquote(value) {
			case "true":
				fm.Draft = true
			case "false", "":
				fm.Draft = false
			default:
				problems = append(problems, fmt.Sprintf("line %d: `draft` must be true or false, got %q", lineNo, value))
			}
		default:
			problems = append(problems, fmt.Sprintf(
				"line %d: unknown key %q — add it to Frontmatter in tools/blogctl and PostFrontmatter in src/lib/posts.ts first",
				lineNo, key))
		}
	}

	return fm, problems
}

// parseFlowSequence reads `[a, "b", 'c']`.
func parseFlowSequence(value string) ([]string, error) {
	if !strings.HasPrefix(value, "[") || !strings.HasSuffix(value, "]") {
		return nil, fmt.Errorf("`tags` must be a list, e.g. [\"go\", \"apis\"], got %q", value)
	}

	inner := strings.TrimSpace(value[1 : len(value)-1])
	if inner == "" {
		return nil, nil
	}

	var out []string
	for _, part := range flowSeqItem.Split(inner, -1) {
		if tag := unquote(strings.TrimSpace(part)); tag != "" {
			out = append(out, tag)
		}
	}
	return out, nil
}

func unquote(value string) string {
	if len(value) >= 2 {
		first, last := value[0], value[len(value)-1]
		if (first == '"' && last == '"') || (first == '\'' && last == '\'') {
			return value[1 : len(value)-1]
		}
	}
	return value
}
