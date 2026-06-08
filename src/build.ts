import type { FloatingTOCOptions } from "./types";
import { resolveElement } from "./utils";

export interface NavParts {
  nav: HTMLElement;
  linksBox: HTMLElement;
  links: HTMLAnchorElement[];
  /** true when this lib generated the markup (vs. enhancing existing markup). */
  created: boolean;
}

function el(tag: string, className: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

function buildNav(opts: FloatingTOCOptions): NavParts {
  const nav = el("nav", "ftoc");
  if (opts.ariaLabel) nav.setAttribute("aria-label", opts.ariaLabel);

  const wrap = el("div", "ftoc-wrap");
  const rail = el("div", "ftoc-rail");
  const linksBox = el("div", "ftoc-links");

  const links = (opts.sections || []).map((s) => {
    const a = document.createElement("a");
    a.href = "#" + s.id;
    a.textContent = s.label;
    linksBox.appendChild(a);
    return a;
  });

  rail.appendChild(linksBox);
  wrap.appendChild(rail);

  if (opts.cta) {
    const cta = document.createElement("a");
    cta.className = "ftoc-cta";
    cta.href = opts.cta.href;
    cta.textContent = opts.cta.label;
    wrap.appendChild(cta);
  }

  nav.appendChild(wrap);
  const mount = resolveElement(opts.mount) || document.body;
  mount.appendChild(nav);

  return { nav, linksBox, links, created: true };
}

/** Use an existing nav if `root` is given, otherwise generate one from `sections`. */
export function resolveNav(opts: FloatingTOCOptions): NavParts {
  const existing = resolveElement(opts.root);
  if (existing) {
    const linksBox =
      existing.querySelector<HTMLElement>(".ftoc-links") || existing;
    const links = Array.from(
      linksBox.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
    );
    return { nav: existing, linksBox, links, created: false };
  }

  if (opts.sections && opts.sections.length) {
    return buildNav(opts);
  }

  throw new Error(
    "[floating-toc] Provide `root` (an existing nav) or `sections` to generate one.",
  );
}
