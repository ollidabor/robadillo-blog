import Link from "next/link";
import { site } from "@content/site";
import { NavLink } from "./NavLink";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="font-mono text-sm font-medium tracking-tight text-fg transition-colors hover:text-accent"
        >
          robadillo
          <span className="text-fg-subtle">.com</span>
        </Link>

        <div className="ml-auto flex items-center gap-3 sm:gap-6">
          <nav aria-label="Main" className="hidden items-center gap-5 sm:flex">
            {site.nav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          <ThemeToggle />
          <MobileMenu items={site.nav} />
        </div>
      </div>
    </header>
  );
}
