import type { Metadata } from "next";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { PageHeader } from "@/components/PageHeader";
import { PostCard } from "@/components/PostCard";
import { Tag } from "@/components/Tag";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes on backend systems, APIs, migrations and the unglamorous parts of scaling.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <>
      <PageHeader
        eyebrow="Blog"
        title="Writing"
        lead="Notes on backend systems, APIs, migrations that don't wake you up at 3am, and the unglamorous parts of scaling."
      />

      {tags.length > 0 && (
        <div className="mb-10 flex flex-wrap items-center gap-1.5">
          {tags.map(({ tag, count }) => (
            <Tag key={tag}>
              {tag} · {count}
            </Tag>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-fg-muted">
          Nothing published yet. Run{" "}
          <code className="font-mono text-sm text-fg">
            npm run new -- &quot;My first post&quot;
          </code>{" "}
          to start one.
        </p>
      ) : (
        <div className="max-w-measure">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </>
  );
}
