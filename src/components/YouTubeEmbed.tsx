"use client";

import { useState } from "react";
import type { Video } from "@content/types";

/**
 * A click-to-load facade.
 *
 * A normal YouTube <iframe> pulls ~900KB of JavaScript and sets third-party
 * cookies on page load, for every visitor, whether or not they watch anything.
 * This renders a locally-stored thumbnail instead and only mounts the iframe
 * after a deliberate click — so the page makes zero third-party requests until
 * someone actually presses play, and the Content-Security-Policy can stay
 * tight (see docs/SECURITY.md).
 *
 * `thumbnail` is resolved on the server: see `thumbnailFor` in src/lib/thumbs.ts.
 * Run `npm run thumbs` to download thumbnails for new videos.
 */
export function YouTubeEmbed({
  video,
  thumbnail,
}: {
  video: Video;
  thumbnail: string | null;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-bg-elevated">
      <div className="relative aspect-video bg-bg-subtle">
        {playing ? (
          <iframe
            /* youtube-nocookie.com defers YouTube's tracking cookies until
               playback; rel=0 keeps the end screen on this channel. */
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play "${video.title}" on YouTube`}
            className="group absolute inset-0 size-full cursor-pointer"
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt=""
                width={1280}
                height={720}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_40%,var(--accent-subtle),transparent)]"
              />
            )}

            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
            />

            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-accent-fg shadow-lg transition-transform duration-300 group-hover:scale-110"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 size-6">
                <path d="M8 5.14v13.72L19 12z" />
              </svg>
            </span>
          </button>
        )}
      </div>

      <figcaption className="border-t border-border p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
          {video.channel}
        </p>
        <h3 className="mt-1.5 text-balance font-semibold tracking-tight text-fg">
          {video.title}
        </h3>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-fg-muted">
          {video.note}
        </p>
      </figcaption>
    </figure>
  );
}
