export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-bg-subtle px-2.5 py-0.5 font-mono text-[11px] text-fg-muted">
      {children}
    </span>
  );
}
