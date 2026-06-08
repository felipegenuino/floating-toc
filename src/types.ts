/** A section entry used to generate the nav when no markup exists yet. */
export interface SectionDef {
  /** The id of the section element on the page (without the leading `#`). */
  id: string;
  /** The visible label rendered in the nav. */
  label: string;
}

/** Optional call-to-action button rendered at the end of the nav. */
export interface CTADef {
  href: string;
  label: string;
}

/** Timing of the entrance animation (ms). */
export interface IntroOptions {
  /** Delay before the capsule rises from the bottom. Default 120. */
  riseDelay?: number;
  /** Delay before the capsule expands horizontally + items stagger in. Default 680. */
  openDelay?: number;
  /** Delay before intro classes are removed (back to natural state). Default 2000. */
  cleanupDelay?: number;
}

/** Scrollspy tuning. */
export interface ScrollspyOptions {
  /**
   * IntersectionObserver rootMargin. The default shrinks the detection band to a
   * thin strip in the vertical center of the viewport, so the highlighted item
   * matches the section actually in the middle of the screen.
   * Default '-50% 0px -48% 0px'.
   */
  rootMargin?: string;
  /** IntersectionObserver threshold. Default 0. */
  threshold?: number | number[];
}

export interface FloatingTOCOptions {
  /**
   * An existing nav element (or selector) to enhance. Anchor links matching
   * `a[href^="#"]` inside it are used. Provide this OR `sections`.
   */
  root?: string | HTMLElement;
  /** Sections to build the nav from when no `root` is given. */
  sections?: SectionDef[];
  /** Where to append a generated nav. Default document.body. */
  mount?: string | HTMLElement;
  /** A CTA button appended to a generated nav. */
  cta?: CTADef | null;
  /** aria-label for a generated nav. */
  ariaLabel?: string;
  /** Entrance animation. `true` (default), `false`, or timing overrides. */
  intro?: boolean | IntroOptions;
  /** Sliding pill highlight that follows hover and rests on the active item. Default true. */
  pill?: boolean;
  /** Scrollspy that marks the active link as you scroll. `true` (default), `false`, or tuning. */
  scrollspy?: boolean | ScrollspyOptions;
  /** Auto-center the active link via horizontal scroll (useful on mobile). Default true. */
  smoothCenter?: boolean;
  /** Honor prefers-reduced-motion (skip intro + smooth). Default true. */
  respectReducedMotion?: boolean;
  /** Class applied to the active link. Default 'is-active'. */
  activeClass?: string;
  /** Called whenever the active section changes. */
  onChange?: (id: string, link: HTMLAnchorElement) => void;
}

export interface FloatingTOCInstance {
  /** The nav element being controlled. */
  readonly element: HTMLElement;
  /** Manually mark a section id as active. */
  setActive(id: string): void;
  /** Recompute the pill position (e.g. after layout changes). */
  refresh(): void;
  /** Remove observers, listeners and the injected pill. */
  destroy(): void;
}
