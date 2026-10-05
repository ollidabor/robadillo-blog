package main

import (
	"fmt"
	"sort"
	"strings"
)

func cmdStats(root string) error {
	posts, problems := loadPosts(root)
	if len(problems) > 0 {
		fmt.Printf("  ! %d post(s) have problems; run `blogctl validate`\n\n", len(problems))
	}
	if len(posts) == 0 {
		fmt.Println("  no posts yet")
		return nil
	}

	tagCounts := map[string]int{}
	total := 0

	fmt.Printf("  %-12s %-6s %s\n", "DATE", "WORDS", "TITLE")
	for _, post := range posts {
		words := len(strings.Fields(post.Body))
		total += words

		marker := ""
		if post.Frontmatter.Draft {
			marker = " (draft)"
		}
		fmt.Printf("  %-12s %-6d %s%s\n", post.Frontmatter.Date, words, post.Frontmatter.Title, marker)

		for _, tag := range post.Frontmatter.Tags {
			tagCounts[tag]++
		}
	}

	fmt.Printf("\n  %d posts, %d words, %d average\n", len(posts), total, total/len(posts))

	tags := make([]string, 0, len(tagCounts))
	for tag := range tagCounts {
		tags = append(tags, tag)
	}
	sort.Slice(tags, func(i, j int) bool {
		if tagCounts[tags[i]] != tagCounts[tags[j]] {
			return tagCounts[tags[i]] > tagCounts[tags[j]]
		}
		return tags[i] < tags[j]
	})

	var parts []string
	for _, tag := range tags {
		parts = append(parts, fmt.Sprintf("%s(%d)", tag, tagCounts[tag]))
	}
	fmt.Printf("  tags: %s\n", strings.Join(parts, " "))
	return nil
}
