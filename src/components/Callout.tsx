/**
 * Available inside MDX as <Callout>…</Callout>.
 */
export function Callout({
  kind = "note",
  children,
}: {
  kind?: "note" | "warn";
  children: React.ReactNode;
}) {
  return (
    <aside
      className={`my-7 rounded-xl border p-5 text-[0.9375rem] leading-relaxed ${
        kind === "warn"
          ? "border-border-strong bg-bg-subtle"
          : "border-accent/35 bg-accent-subtle/35"
      }`}
    >
      <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
        {kind === "warn" ? "Heads up" : "Note"}
      </p>
      <div className="[&>*+*]:mt-3 [&_a]:text-fg [&_a]:underline">{children}</div>
    </aside>
  );
}
