/**
 * Dates are formatted with a fixed locale and an explicit UTC timezone so the
 * server-rendered HTML and the browser agree. Without the timezone pin, a
 * visitor west of UTC can see yesterday's date and React logs a mismatch.
 */
export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateShort(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
