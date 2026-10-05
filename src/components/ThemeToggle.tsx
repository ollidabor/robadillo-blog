"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * Writes the choice to localStorage and flips `data-theme` on <html>.
 * The initial paint is handled by the blocking script in layout.tsx — this
 * component only renders the button, and it renders nothing until mounted so
 * the icon never contradicts the real theme.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.dataset.theme as Theme | undefined;
    setTheme(
      current ??
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"),
    );
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode or blocked storage: the toggle still works for this page.
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === null
          ? "Toggle theme"
          : `Switch to ${theme === "dark" ? "light" : "dark"} theme`
      }
      className="grid size-9 place-items-center rounded-lg border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
    >
      {/* Both icons are present; CSS picks one, so there is no layout shift
          and no mismatch between server and client HTML. */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden="true"
        className="size-4"
      >
        {theme === "dark" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10l1.4 1.4m0-12.8l-1.4 1.4m-10 10L5.6 18.4" />
          </>
        ) : (
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
        )}
      </svg>
    </button>
  );
}
