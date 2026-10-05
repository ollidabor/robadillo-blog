"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative py-1 text-sm transition-colors ${
        active ? "text-fg" : "text-fg-muted hover:text-fg"
      }`}
    >
      {label}
      {active && (
        <span
          aria-hidden="true"
          className="absolute -bottom-px left-0 h-px w-full bg-accent"
        />
      )}
    </Link>
  );
}
