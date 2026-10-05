import Link from "next/link";
import type { Post } from "@/lib/posts";
import { formatDateShort } from "@/lib/format";
import { Tag } from "./Tag";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="group relative border-b border-border py-7 first:pt-0 last:border-b-0">
      <div className="mb-2 flex items-center gap-3 font-mono text-xs text-fg-subtle">
        <time dateTime={post.date}>{formatDateShort(post.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingMinutes} min read</span>
        {post.draft && (
          <span className="rounded bg-accent-subtle px-1.5 py-0.5 text-accent">
            draft
          </span>
        )}
      </div>

      <h2 className="text-balance text-xl font-semibold tracking-tight text-fg">
        <Link href={`/blog/${post.slug}`}>
          {/* Stretched link: the whole card is the hit area, but the
              accessible name stays just the title. */}
          <span className="absolute inset-0" aria-hidden="true" />
          <span className="transition-colors group-hover:text-accent">
            {post.title}
          </span>
        </Link>
      </h2>

      <p className="mt-2 text-pretty leading-relaxed text-fg-muted">
        {post.summary}
      </p>

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      )}
    </article>
  );
}
