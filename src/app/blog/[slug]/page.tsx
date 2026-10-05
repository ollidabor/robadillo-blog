import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@content/site";
import { getAllPosts, getPost } from "@/lib/posts";
import { formatDate } from "@/lib/format";
import { Mdx } from "@/components/Mdx";
import { Tag } from "@/components/Tag";

type Params = { slug: string };

/**
 * Required by `output: "export"` — it tells Next which URLs to render into
 * static HTML. Add a file to content/posts and it shows up here automatically.
 */
export function generateStaticParams(): Params[] {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      url: `${site.url}/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [site.name],
      tags: post.tags,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const all = getAllPosts();
  const index = all.findIndex((p) => p.slug === post.slug);
  const newer = index > 0 ? all[index - 1] : undefined;
  const older = index < all.length - 1 ? all[index + 1] : undefined;

  /* Structured data so search engines and readers-later apps get the author,
     date and headline right. No tracking, no third-party request. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    keywords: post.tags.join(", "),
    author: { "@type": "Person", name: site.name, url: site.url },
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
  };

  return (
    <article className="mx-auto max-w-measure">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="font-mono text-xs text-fg-subtle transition-colors hover:text-accent"
      >
        ← All posts
      </Link>

      <header className="mb-10 mt-6">
        <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-xs text-fg-subtle">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
          {post.draft && (
            <span className="rounded bg-accent-subtle px-1.5 py-0.5 text-accent">
              draft
            </span>
          )}
        </div>

        {post.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
      </header>

      <div className="prose">
        <Mdx source={post.body} />
      </div>

      {(newer || older) && (
        <nav
          aria-label="More posts"
          className="mt-20 grid gap-4 border-t border-border pt-8 sm:grid-cols-2"
        >
          {older && (
            <Link
              href={`/blog/${older.slug}`}
              className="group rounded-xl border border-border p-5 transition-colors hover:border-border-strong"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                ← Older
              </p>
              <p className="mt-2 text-balance font-medium text-fg transition-colors group-hover:text-accent">
                {older.title}
              </p>
            </Link>
          )}
          {newer && (
            <Link
              href={`/blog/${newer.slug}`}
              className="group rounded-xl border border-border p-5 text-right transition-colors hover:border-border-strong sm:col-start-2"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                Newer →
              </p>
              <p className="mt-2 text-balance font-medium text-fg transition-colors group-hover:text-accent">
                {newer.title}
              </p>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
