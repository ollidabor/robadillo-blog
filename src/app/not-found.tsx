import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-measure py-16 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.18em] text-accent">
        404
      </p>
      <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-fg">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-4 text-pretty leading-relaxed text-fg-muted">
        It may have moved, or it may never have been here. Either way, the blog
        is a good place to land.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
        >
          Home
        </Link>
        <Link
          href="/blog"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-border-strong"
        >
          Blog
        </Link>
      </div>
    </div>
  );
}
