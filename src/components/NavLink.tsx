"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  label,
  mobile = false,
}: {
  href: string;
  label: string;
  /** Full-width row for the burger panel instead of an inline link. */
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  if (mobile) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`block border-l-2 py-2.5 pl-3 text-base transition-colors ${
          active
            ? "border-accent text-fg"
            : "border-transparent text-fg-muted hover:text-fg"
        }`}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative whitespace-nowrap py-1 text-sm transition-colors ${
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
