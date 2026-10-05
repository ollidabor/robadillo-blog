package main

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// YouTube serves several thumbnail sizes and not every video has every one.
// Try largest first and take what we get.
var thumbSizes = []string{"maxresdefault", "sddefault", "hqdefault"}

const maxThumbBytes = 4 << 20 // 4 MiB — a JPEG thumbnail is ~100KB

// cmdThumbs downloads thumbnails once, at authoring time, into public/thumbs/.
//
// This is the whole reason the site can make zero third-party requests on page
// load: the /al-dia cards render a local image, and nothing reaches Google
// until a visitor clicks play.
func cmdThumbs(root string) error {
	ids, err := videoIDs(root)
	if err != nil {
		return err
	}
	if len(ids) == 0 {
		fmt.Println("  ✓ no videos in content/videos.ts, nothing to download")
		return nil
	}

	if err := os.MkdirAll(thumbsDir(root), 0o755); err != nil {
		return err
	}

	client := &http.Client{Timeout: 20 * time.Second}
	var failures []string

	for _, id := range ids {
		dest := filepath.Join(thumbsDir(root), id+".jpg")

		if _, err := os.Stat(dest); err == nil {
			fmt.Printf("  · %s already downloaded\n", id)
			continue
		}

		size, err := downloadThumb(client, id, dest)
		if err != nil {
			failures = append(failures, fmt.Sprintf("%s: %v", id, err))
			fmt.Printf("  ✗ %s: %v\n", id, err)
			continue
		}
		fmt.Printf("  ✓ %s (%s, %.0f KB)\n", id, size, fileSizeKB(dest))
	}

	if len(failures) > 0 {
		return fmt.Errorf("%d thumbnail(s) could not be downloaded", len(failures))
	}
	return nil
}

func downloadThumb(client *http.Client, id, dest string) (string, error) {
	var lastErr error

	for _, size := range thumbSizes {
		url := fmt.Sprintf("https://i.ytimg.com/vi/%s/%s.jpg", id, size)

		resp, err := client.Get(url)
		if err != nil {
			lastErr = err
			continue
		}

		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			lastErr = fmt.Errorf("%s returned %s", size, resp.Status)
			continue
		}

		// Write to a temp file first so an interrupted download never leaves a
		// truncated JPEG that the site would then render.
		tmp, err := os.CreateTemp(filepath.Dir(dest), ".thumb-*")
		if err != nil {
			resp.Body.Close()
			return "", err
		}

		// Bounded read: we are writing whatever a remote host sends to disk.
		written, copyErr := io.Copy(tmp, io.LimitReader(resp.Body, maxThumbBytes))
		resp.Body.Close()
		closeErr := tmp.Close()

		if copyErr != nil || closeErr != nil {
			os.Remove(tmp.Name())
			lastErr = errors.Join(copyErr, closeErr)
			continue
		}
		if written == 0 {
			os.Remove(tmp.Name())
			lastErr = fmt.Errorf("%s returned an empty body", size)
			continue
		}
		if written == maxThumbBytes {
			os.Remove(tmp.Name())
			return "", fmt.Errorf("%s is larger than %d bytes, refusing", size, maxThumbBytes)
		}

		if err := os.Rename(tmp.Name(), dest); err != nil {
			os.Remove(tmp.Name())
			return "", err
		}
		return size, nil
	}

	return "", fmt.Errorf("no thumbnail available (%v)", lastErr)
}

func fileSizeKB(path string) float64 {
	info, err := os.Stat(path)
	if err != nil {
		return 0
	}
	return float64(info.Size()) / 1024
}
