import Link from "next/link";
import { site } from "@content/site";
import { projects } from "@content/projects";
import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { ProjectCard } from "@/components/ProjectCard";
import { SocialIcon } from "@/components/SocialIcon";

export default function HomePage() {
  const posts = getAllPosts().slice(0, 3);
  const featured = projects.slice(0, 2);

  return (
    <>
      <section className="max-w-measure">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-accent">
          {site.location}
        </p>

        <h1 className="text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          {site.name}
        </h1>

        <p className="mt-4 text-pretty text-xl leading-snug text-fg-muted">
          {site.tagline}
        </p>

        <p className="mt-6 text-pretty leading-relaxed text-fg-muted">
          {site.description}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/about"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            More about me
          </Link>
          <Link
            href="/blog"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-border-strong"
          >
            Read the blog
          </Link>

          <ul className="ml-1 flex items-center gap-3">
            {site.socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  className="block text-fg-subtle transition-colors hover:text-fg"
                  {...(social.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <SocialIcon icon={social.icon} className="size-[18px]" />
                  <span className="sr-only">{social.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="mt-24">
          <div className="mb-8 flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-fg-subtle">
              Latest writing
            </h2>
            <Link
              href="/blog"
              className="text-sm text-fg-muted transition-colors hover:text-accent"
            >
              All posts →
            </Link>
          </div>

          <div className="max-w-measure">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-24">
        <div className="mb-8 flex items-baseline justify-between border-b border-border pb-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-fg-subtle">
            Selected work
          </h2>
          <Link
            href="/projects"
            className="text-sm text-fg-muted transition-colors hover:text-accent"
          >
            All projects →
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {featured.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>
    </>
  );
}
