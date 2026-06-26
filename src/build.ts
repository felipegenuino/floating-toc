import type { FloatingTOCOptions, MenuDef } from "./types";
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

let uid = 0;
const CARET_SVG = '<svg class="ftoc-caret" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
const CHECK_SVG = '<svg class="ftoc-check" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
function iconHTML(icon?: string): string {
  return icon ? `<span class="ftoc-ic" aria-hidden="true">${icon}</span>` : "";
}
export function buildMenu(def: MenuDef): HTMLElement {
  const id = `ftoc-pop-${++uid}`;
  const menu = el("div", "ftoc-menu");
  if (def.align === "end") menu.setAttribute("data-align", "end");
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "ftoc-trigger";
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", id);
  if (def.ariaLabel) trigger.setAttribute("aria-label", def.ariaLabel);
  const caret = def.caret === false ? "" : CARET_SVG;
  const label = def.label ? `<span class="ftoc-trigger-label">${def.label}</span>` : "";
  trigger.innerHTML = iconHTML(def.icon) + label + caret;
  const pop = el("div", "ftoc-pop");
  pop.id = id;
  pop.hidden = true;
  def.items.forEach((item) => {
    let node: HTMLAnchorElement | HTMLButtonElement;
    if (item.href) {
      const a = document.createElement("a");
      a.href = item.href;
      if (item.hreflang) a.setAttribute("hreflang", item.hreflang);
      node = a;
    } else {
      const b = document.createElement("button");
      b.type = "button";
      node = b;
    }
    node.className = "ftoc-pop-item";
    if (item.active) { node.classList.add("is-active"); node.setAttribute("aria-current", "true"); }
    node.innerHTML = iconHTML(item.icon) + `<span class="ftoc-pop-label">${item.label}</span>` + CHECK_SVG;
    if (item.onSelect) node.addEventListener("click", () => item.onSelect!(item));
    pop.appendChild(node);
  });
  menu.appendChild(trigger);
  menu.appendChild(pop);
  return menu;
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

  (opts.menus || []).forEach((m) => wrap.appendChild(buildMenu(m)));

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

  if ((opts.sections && opts.sections.length) || (opts.menus && opts.menus.length)) {
    return buildNav(opts);
  }

  throw new Error(
    "[floating-toc] Provide `root` (an existing nav) or `sections` to generate one.",
  );
}
