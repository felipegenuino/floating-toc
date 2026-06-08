import { idFromHref } from "./utils";

export interface ScrollspyController {
  destroy(): void;
}

export interface ScrollspyConfig {
  rootMargin: string;
  threshold: number | number[];
  activeClass: string;
  onActive: (id: string, link: HTMLAnchorElement) => void;
}

/**
 * Watches the page sections referenced by the links and marks the matching link
 * as active (class + aria-current) when its section enters the center band of
 * the viewport.
 */
export function createScrollspy(
  links: HTMLAnchorElement[],
  config: ScrollspyConfig,
): ScrollspyController {
  const map = new Map<string, HTMLAnchorElement>();
  const targets: HTMLElement[] = [];

  links.forEach((a) => {
    const id = idFromHref(a);
    if (!id) return;
    const section = document.getElementById(id);
    if (section) {
      map.set(id, a);
      targets.push(section);
    }
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = (entry.target as HTMLElement).id;
        const link = map.get(id);
        if (!link) return;
        links.forEach((l) => {
          l.classList.remove(config.activeClass);
          l.removeAttribute("aria-current");
        });
        link.classList.add(config.activeClass);
        link.setAttribute("aria-current", "true");
        config.onActive(id, link);
      });
    },
    { rootMargin: config.rootMargin, threshold: config.threshold },
  );

  targets.forEach((t) => io.observe(t));

  return {
    destroy() {
      io.disconnect();
    },
  };
}
