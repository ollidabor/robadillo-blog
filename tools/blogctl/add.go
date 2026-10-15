package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"html"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// notePlaceholder is what a video gets when -note is omitted: Video.note is
// required, so something has to go there. `blogctl validate` warns until it's
// replaced, so it can't slip out unnoticed.
const notePlaceholder = "TODO: why it's here, in your words."

const maxOEmbedBytes = 1 << 20 // 1 MiB — an oEmbed response is ~1KB

var (
	youtubeIDShape = regexp.MustCompile(`^[A-Za-z0-9_-]{11}$`)
	tweetPath      = regexp.MustCompile(`^/([A-Za-z0-9_]{1,15})/status(?:es)?/(\d+)`)
	tweetParagraph = regexp.MustCompile(`(?s)<p[^>]*>(.*?)</p>`)
	tweetDate      = regexp.MustCompile(`<a [^>]*>([A-Z][a-z]+ \d{1,2}, \d{4})</a>\s*</blockquote>`)
	htmlBreak      = regexp.MustCompile(`(?i)<br\s*/?>`)
	htmlTag        = regexp.MustCompile(`<[^>]+>`)
)

// cmdAdd turns a YouTube or X URL into an entry at the top of
// content/videos.ts or content/tweets.ts.
//
// Metadata comes from each site's public oEmbed endpoint — no API key, no
// account. This runs once, at authoring time; the site itself still makes no
// request to either service when a page loads.
func cmdAdd(root string, args []string) error {
	fs := flag.NewFlagSet("add", flag.ContinueOnError)
	note := fs.String("note", "", "why it's here, in your words")

	// Accept flags on either side of the URL: `add -note x URL` and
	// `add URL -note x` both work. The flag package stops at the first
	// positional argument, so parse what follows it a second time.
	if err := fs.Parse(args); err != nil {
		return err
	}
	if fs.NArg() == 0 {
		return errors.New(`a URL is required: blogctl add [-note "…"] <youtube or x.com URL>`)
	}
	raw := fs.Arg(0)
	if err := fs.Parse(fs.Args()[1:]); err != nil {
		return err
	}
	if fs.NArg() > 0 {
		return fmt.Errorf("unexpected argument %q — add one URL at a time", fs.Arg(0))
	}

	// zsh's url-quote-magic escapes ? = & while pasting; inside quotes those
	// backslashes survive. A URL never contains a literal one, so drop them.
	u, err := url.Parse(strings.ReplaceAll(strings.TrimSpace(raw), `\`, ""))
	if err != nil || (u.Scheme != "https" && u.Scheme != "http") {
		return fmt.Errorf("%q is not a URL", raw)
	}

	client := &http.Client{Timeout: 20 * time.Second}

	if id, ok := youtubeID(u); ok {
		return addVideo(root, client, id, strings.TrimSpace(*note))
	}
	if handle, id, ok := tweetRef(u); ok {
		return addTweet(root, client, handle, id, strings.TrimSpace(*note))
	}
	return fmt.Errorf("%s is neither a YouTube video nor an X/Twitter post", raw)
}

// youtubeID understands the URL shapes people actually paste: watch?v=,
// youtu.be/, /shorts/, /live/ and /embed/.
func youtubeID(u *url.URL) (string, bool) {
	host := strings.TrimPrefix(strings.ToLower(u.Hostname()), "www.")
	parts := strings.Split(strings.Trim(u.Path, "/"), "/")

	var id string
	switch host {
	case "youtu.be":
		id = parts[0]
	case "youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com":
		switch {
		case parts[0] == "watch":
			id = u.Query().Get("v")
		case len(parts) >= 2 && (parts[0] == "shorts" || parts[0] == "live" || parts[0] == "embed"):
			id = parts[1]
		}
	}
	return id, youtubeIDShape.MatchString(id)
}

func tweetRef(u *url.URL) (handle, id string, ok bool) {
	host := strings.ToLower(u.Hostname())
	for _, prefix := range []string{"www.", "mobile."} {
		host = strings.TrimPrefix(host, prefix)
	}
	if host != "x.com" && host != "twitter.com" {
		return "", "", false
	}
	m := tweetPath.FindStringSubmatch(u.Path)
	if m == nil {
		return "", "", false
	}
	return m[1], m[2], true
}

func addVideo(root string, client *http.Client, id, note string) error {
	path := filepath.Join(root, "content", "videos.ts")
	if err := ensureNew(path, id); err != nil {
		return err
	}

	var meta struct {
		Title      string `json:"title"`
		AuthorName string `json:"author_name"`
	}
	watch := "https://www.youtube.com/watch?v=" + id
	if err := fetchOEmbed(client, "https://www.youtube.com/oembed?format=json&url="+url.QueryEscape(watch), &meta); err != nil {
		return fmt.Errorf("could not fetch video %s: %w", id, err)
	}
	if meta.Title == "" {
		return fmt.Errorf("YouTube returned no title for %s", id)
	}

	if note == "" {
		note = notePlaceholder
	}
	entry := fmt.Sprintf("  {\n    id: %s,\n    title: %s,\n    channel: %s,\n    note: %s,\n  },\n",
		tsString(id), tsString(meta.Title), tsString(meta.AuthorName), tsString(note))

	if err := insertEntry(path, "export const videos: Video[] = [\n", entry); err != nil {
		return err
	}
	fmt.Printf("  ✓ %s: %s — %s\n", rel(root, path), meta.Title, meta.AuthorName)

	// The data is already written; a failed thumbnail only degrades the card
	// to a placeholder, and `blogctl thumbs` can retry it later.
	if err := os.MkdirAll(thumbsDir(root), 0o755); err != nil {
		return err
	}
	dest := filepath.Join(thumbsDir(root), id+".jpg")
	if _, err := os.Stat(dest); err == nil {
		fmt.Printf("  · thumbnail already downloaded\n")
	} else if size, err := downloadThumb(client, id, dest); err != nil {
		fmt.Printf("  ! thumbnail failed (%v) — retry with `npm run thumbs`\n", err)
	} else {
		fmt.Printf("  ✓ %s (%s, %.0f KB)\n", rel(root, dest), size, fileSizeKB(dest))
	}

	if note == notePlaceholder {
		fmt.Println("    Replace the TODO note before committing; `blogctl validate` will remind you.")
	}
	return nil
}

func addTweet(root string, client *http.Client, handle, id, note string) error {
	path := filepath.Join(root, "content", "tweets.ts")
	if err := ensureNew(path, id); err != nil {
		return err
	}

	var meta struct {
		AuthorName string `json:"author_name"`
		AuthorURL  string `json:"author_url"`
		HTML       string `json:"html"`
	}
	permalink := fmt.Sprintf("https://x.com/%s/status/%s", handle, id)
	endpoint := "https://publish.x.com/oembed?omit_script=true&dnt=true&url=" + url.QueryEscape(permalink)
	if err := fetchOEmbed(client, endpoint, &meta); err != nil {
		return fmt.Errorf("could not fetch post %s (deleted, private or age-restricted posts can't be fetched): %w", id, err)
	}

	// The URL may carry a stale handle after a rename; the author URL is
	// authoritative.
	if a, err := url.Parse(meta.AuthorURL); err == nil {
		if h := strings.Trim(a.Path, "/"); h != "" && !strings.Contains(h, "/") {
			handle = h
		}
	}

	text, date, err := parseTweetHTML(meta.HTML)
	if err != nil {
		return fmt.Errorf("could not read post %s: %w", id, err)
	}

	var b strings.Builder
	fmt.Fprintf(&b, "  {\n    id: %s,\n", tsString(id))
	fmt.Fprintf(&b, "    author: { name: %s, handle: %s },\n", tsString(meta.AuthorName), tsString(handle))
	fmt.Fprintf(&b, "    text: %s,\n", tsString(text))
	fmt.Fprintf(&b, "    date: %s,\n", tsString(date))
	fmt.Fprintf(&b, "    href: %s,\n", tsString(fmt.Sprintf("https://x.com/%s/status/%s", handle, id)))
	if note != "" {
		fmt.Fprintf(&b, "    note: %s,\n", tsString(note))
	}
	b.WriteString("  },\n")

	if err := insertEntry(path, "export const tweets: Tweet[] = [\n", b.String()); err != nil {
		return err
	}

	preview := strings.ReplaceAll(text, "\n", " ")
	if r := []rune(preview); len(r) > 60 {
		preview = string(r[:60]) + "…"
	}
	fmt.Printf("  ✓ %s: @%s, %s — %q\n", rel(root, path), handle, date, preview)
	if note == "" {
		fmt.Println("    No -note given; it's optional for posts, but it's the reason you saved it.")
	}
	return nil
}

// parseTweetHTML pulls the text and date out of X's oEmbed blockquote:
//
//	<blockquote …><p …>text<br>more <a …>link</a></p>&mdash; Name (@handle)
//	<a href="…">March 21, 2006</a></blockquote>
func parseTweetHTML(markup string) (text, date string, err error) {
	p := tweetParagraph.FindStringSubmatch(markup)
	if p == nil {
		return "", "", errors.New("no post text in the oEmbed response")
	}
	text = htmlBreak.ReplaceAllString(p[1], "\n")
	text = htmlTag.ReplaceAllString(text, "")
	text = strings.TrimSpace(html.UnescapeString(text))

	d := tweetDate.FindStringSubmatch(markup)
	if d == nil {
		return "", "", errors.New("no date in the oEmbed response")
	}
	t, err := time.Parse("January 2, 2006", d[1])
	if err != nil {
		return "", "", fmt.Errorf("unrecognised date %q", d[1])
	}
	return text, t.Format("2006-01-02"), nil
}

func fetchOEmbed(client *http.Client, endpoint string, into any) error {
	resp, err := client.Get(endpoint)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("oEmbed returned %s", resp.Status)
	}
	// Bounded read: this is whatever a remote host decides to send.
	body, err := io.ReadAll(io.LimitReader(resp.Body, maxOEmbedBytes))
	if err != nil {
		return err
	}
	return json.Unmarshal(body, into)
}

// ensureNew refuses an id that's already in the file, so running the same
// command twice doesn't produce a duplicate card.
func ensureNew(path, id string) error {
	raw, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	if regexp.MustCompile(`\bid:\s*"` + regexp.QuoteMeta(id) + `"`).Match(raw) {
		return fmt.Errorf("%s is already in %s", id, filepath.Base(path))
	}
	return nil
}

// insertEntry puts entry right after the array's opening line — both files
// are newest first. Like videoIDs, this leans on the file's fixed shape rather
// than parsing TypeScript.
func insertEntry(path, opening, entry string) error {
	raw, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	i := bytes.Index(raw, []byte(opening))
	if i < 0 {
		return fmt.Errorf("could not find %q in %s", strings.TrimSpace(opening), filepath.Base(path))
	}
	at := i + len(opening)

	var out bytes.Buffer
	out.Write(raw[:at])
	out.WriteString(entry)
	out.Write(raw[at:])

	// Temp file and rename, so an interrupted write never leaves a truncated
	// file that breaks the build.
	tmp, err := os.CreateTemp(filepath.Dir(path), ".add-*")
	if err != nil {
		return err
	}
	if _, err := tmp.Write(out.Bytes()); err != nil {
		tmp.Close()
		os.Remove(tmp.Name())
		return err
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmp.Name())
		return err
	}
	if err := os.Chmod(tmp.Name(), 0o644); err != nil {
		os.Remove(tmp.Name())
		return err
	}
	if err := os.Rename(tmp.Name(), path); err != nil {
		os.Remove(tmp.Name())
		return err
	}
	return nil
}

// tsString renders a TypeScript string literal. A JSON string is one, as long
// as HTML escaping is off — otherwise "&" would land in the file as &.
func tsString(s string) string {
	var b bytes.Buffer
	enc := json.NewEncoder(&b)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(s) // encoding a string cannot fail
	return strings.TrimSuffix(b.String(), "\n")
}
