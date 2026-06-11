/**
 * Shared formatting utilities used across all portals.
 * Import from here instead of defining locally in page files.
 */

/** Format an ISO date string to "15 Jan 2024". Returns "—" for null/undefined. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format an ISO datetime string to "15 Jan · 2:30 PM". Returns "—" for null/undefined. */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Get 1–2 uppercase initials from a first + optional last name. */
export function initials(
  first: string | null | undefined,
  last?: string | null | undefined,
): string {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";
}

/** Join first + last name, falling back to "Unnamed". */
export function fullName(
  first: string | null | undefined,
  last?: string | null | undefined,
): string {
  return [first, last].filter(Boolean).join(" ") || "Unnamed";
}
