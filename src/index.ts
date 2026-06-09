import type {
  FloatingTOCOptions,
  FloatingTOCInstance,
  IntroOptions,
  ScrollspyOptions,
} from "./types";
import { prefersReducedMotion, idFromHref } from "./utils";
import { resolveNav } from "./build";
import { createPill, type PillController } from "./pill";
import { createScrollspy, type ScrollspyController } from "./scrollspy";
import { playIntro } from "./intro";

const DEFAULT_ROOT_MARGIN = "-50% 0px -48% 0px";

export function createTOC(
  options: FloatingTOCOptions = {},
): FloatingTOCInstance {
  const activeClass = options.activeClass || "is-active";
  const { nav, linksBox, links } = resolveNav(options);
  const reduced =
    options.respectReducedMotion !== false && prefersReducedMotion();

  const pill: PillController | null =
    options.pill !== false ? createPill(linksBox, links) : null;

  const introEnabled = options.intro !== false && !reduced;
  // While the entrance animation runs the capsule is collapsed, so the pill
  // would measure a wrong position. Hold it back until the intro has settled.
  let pillReady = !introEnabled;
  let activeLink: HTMLAnchorElement | null = null;

  const smoothCenter = options.smoothCenter !== false && !reduced;
  function centerActive(link: HTMLElement): void {
    if (linksBox.scrollWidth <= linksBox.clientWidth + 2) return;
    linksBox.scrollTo({
      left: link.offsetLeft - linksBox.clientWidth / 2 + link.offsetWidth / 2,
      behavior: smoothCenter ? "smooth" : "auto",
    });
  }

  let spy: ScrollspyController | null = null;
  if (options.scrollspy !== false) {
    const so: ScrollspyOptions =
      typeof options.scrollspy === "object" ? options.scrollspy : {};
    spy = createScrollspy(links, {
      rootMargin: so.rootMargin || DEFAULT_ROOT_MARGIN,
      threshold: so.threshold ?? 0,
      activeClass,
      onActive: (id, link) => {
        activeLink = link;
        centerActive(link);
        if (pill && pillReady) pill.moveTo(link);
        if (options.onChange) options.onChange(id, link);
      },
    });
  }

  let stopIntro: (() => void) | null = null;
  if (introEnabled) {
    const io: IntroOptions =
      typeof options.intro === "object" ? options.intro : {};
    const items: HTMLElement[] = links.slice();
    const cta = nav.querySelector<HTMLElement>(".ftoc-cta");
    if (cta) items.push(cta);
    stopIntro = playIntro(nav, items, {
      riseDelay: io.riseDelay ?? 120,
      openDelay: io.openDelay ?? 680,
      cleanupDelay: io.cleanupDelay ?? 2000,
      onOpen: () => {
        pillReady = true;
        if (pill) pill.moveTo(activeLink);
        if (activeLink) centerActive(activeLink);
      },
    });
  }

  return {
    element: nav,
    setActive(id) {
      const link = links.find((a) => idFromHref(a) === id);
      if (!link) return;
      links.forEach((l) => {
        l.classList.remove(activeClass);
        l.removeAttribute("aria-current");
      });
      link.classList.add(activeClass);
      link.setAttribute("aria-current", "true");
      activeLink = link;
      pillReady = true;
      if (pill) pill.moveTo(link);
      centerActive(link);
    },
    refresh() {
      if (pill) pill.moveTo(activeLink);
    },
    destroy() {
      if (stopIntro) stopIntro();
      if (spy) spy.destroy();
      if (pill) pill.destroy();
      nav.classList.remove("ftoc-anim", "ftoc-rise", "ftoc-open");
    },
  };
}

export default createTOC;
export type {
  FloatingTOCOptions,
  FloatingTOCInstance,
  SectionDef,
  CTADef,
  IntroOptions,
  ScrollspyOptions,
} from "./types";
