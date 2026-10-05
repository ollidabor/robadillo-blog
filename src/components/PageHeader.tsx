export function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="mb-12">
      {eyebrow && (
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
      )}
      <h1 className="text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        {title}
      </h1>
      {lead && (
        <p className="mt-4 max-w-measure text-pretty text-lg leading-relaxed text-fg-muted">
          {lead}
        </p>
      )}
    </div>
  );
}
