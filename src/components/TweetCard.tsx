import type { Tweet } from "@content/types";
import { formatDateShort } from "@/lib/format";
import { SocialIcon } from "./SocialIcon";

/**
 * A tweet rendered from local data instead of X's embed widget.
 *
 * The official embed injects a third-party script that tracks every visitor,
 * blocks until it loads, needs `script-src https://platform.twitter.com` in
 * the CSP, and leaves a dead rectangle behind when the post is deleted or the
 * account goes private. Storing the text in content/tweets.ts costs one paste
 * and avoids all four. The card still links to the original.
 */
export function TweetCard({ tweet }: { tweet: Tweet }) {
  return (
    <figure className="flex h-full flex-col rounded-xl border border-border bg-bg-elevated p-5">
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-bg-subtle font-mono text-sm font-medium text-fg-muted"
        >
          {tweet.author.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">
            {tweet.author.name}
          </p>
          <p className="truncate font-mono text-xs text-fg-subtle">
            @{tweet.author.handle}
          </p>
        </div>
        <a
          href={tweet.href}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto shrink-0 text-fg-subtle transition-colors hover:text-fg"
        >
          <SocialIcon icon="x" className="size-3.5" />
          <span className="sr-only">View the original post</span>
        </a>
      </div>

      <blockquote className="mt-4 whitespace-pre-line text-pretty leading-relaxed text-fg">
        {tweet.text}
      </blockquote>

      <figcaption className="mt-4 flex items-center gap-2 font-mono text-xs text-fg-subtle">
        <time dateTime={tweet.date}>{formatDateShort(tweet.date)}</time>
      </figcaption>

      {tweet.note && (
        <p className="mt-4 border-t border-border pt-4 text-pretty text-sm leading-relaxed text-fg-muted">
          {tweet.note}
        </p>
      )}
    </figure>
  );
}
