"use client";

import { useRef } from "react";

const CELL = 28; // px — keep in sync with the grid template below
const COLS = 40; // wide enough for max-w-5xl
const ROWS = 24; // tall enough for the hero on a phone

/* Seeded PRNG so the server and the client render the same digits — a
   Math.random() grid would trip a hydration mismatch on every load. */
function digits(count: number, seed = 0x2f6b) {
  let s = seed;
  return Array.from({ length: count }, () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return String((s >> 16) % 10);
  });
}

const CELLS = digits(COLS * ROWS);

/**
 * A banner whose background is a field of digits that light up in Ditto pink
 * under the pointer and fade back as it moves on. The children render on top
 * and stay fully interactive: the pointer is tracked on the whole section, so
 * the grid reacts even while hovering over text.
 *
 * All the fading lives in CSS (see .hero-grid in globals.css); this component
 * only decides which cells are lit right now.
 */
export function HeroGrid({ children }: { children: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const lit = useRef(new Map<number, string>());
  const current = useRef(-1);

  function light(next: Map<number, string>) {
    const cells = gridRef.current?.children;
    if (!cells) return;
    for (const i of lit.current.keys()) {
      if (!next.has(i)) delete (cells[i] as HTMLElement).dataset.lit;
    }
    for (const [i, level] of next) {
      (cells[i] as HTMLElement).dataset.lit = level;
    }
    lit.current = next;
  }

  function onPointerMove(e: React.PointerEvent) {
    const section = sectionRef.current;
    const grid = gridRef.current;
    if (!section || !grid) return;

    const box = section.getBoundingClientRect();
    section.style.setProperty("--x", `${e.clientX - box.left}px`);
    section.style.setProperty("--y", `${e.clientY - box.top}px`);

    const gbox = grid.getBoundingClientRect();
    const col = Math.floor((e.clientX - gbox.left) / CELL);
    const row = Math.floor((e.clientY - gbox.top) / CELL);
    const index = row * COLS + col;
    if (index === current.current) return;
    current.current = index;

    const next = new Map<number, string>();
    const add = (r: number, c: number, level: string) => {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) next.set(r * COLS + c, level);
    };
    add(row, col, "1");
    add(row - 1, col, "2");
    add(row + 1, col, "2");
    add(row, col - 1, "2");
    add(row, col + 1, "2");
    light(next);
  }

  function onPointerLeave() {
    current.current = -1;
    light(new Map());
  }

  return (
    <section
      ref={sectionRef}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="hero relative isolate overflow-hidden rounded-2xl border border-border bg-bg-elevated"
    >
      <div
        ref={gridRef}
        aria-hidden="true"
        className="hero-grid absolute left-0 top-0 -z-10 grid select-none font-mono text-xs"
        style={{
          gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
          gridAutoRows: `${CELL}px`,
        }}
      >
        {CELLS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div aria-hidden="true" className="hero-spotlight pointer-events-none absolute inset-0 -z-20" />

      <div className="px-6 py-14 sm:px-12 sm:py-20">{children}</div>
    </section>
  );
}
