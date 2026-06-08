export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function resolveElement(
  target: string | HTMLElement | null | undefined,
): HTMLElement | null {
  if (!target) return null;
  if (typeof target === "string") {
    return document.querySelector<HTMLElement>(target);
  }
  return target;
}

export function idFromHref(a: HTMLAnchorElement): string {
  return (a.getAttribute("href") || "").replace(/^#/, "");
}
