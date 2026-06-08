export interface IntroConfig {
  riseDelay: number;
  openDelay: number;
  cleanupDelay: number;
}

/**
 * Plays the two-phase entrance animation by toggling classes the CSS reacts to:
 *   ftoc-anim  -> initial hidden/collapsed state (added immediately)
 *   ftoc-rise  -> phase 1: capsule rises from the bottom (still closed)
 *   ftoc-open  -> phase 2: expands horizontally + items stagger in
 * After cleanupDelay the classes are removed so the nav settles into its natural
 * state with no visual jump. The per-item stagger is driven by a `--ftoc-i`
 * custom property set on each item (no hard-coded nth-child limit).
 * Returns a function that cancels any pending timers.
 */
export function playIntro(
  nav: HTMLElement,
  items: HTMLElement[],
  config: IntroConfig,
): () => void {
  items.forEach((item, i) => item.style.setProperty("--ftoc-i", String(i)));
  nav.classList.add("ftoc-anim");

  let timers: number[] = [];

  const run = (): void => {
    timers = [
      window.setTimeout(() => nav.classList.add("ftoc-rise"), config.riseDelay),
      window.setTimeout(() => nav.classList.add("ftoc-open"), config.openDelay),
      window.setTimeout(() => {
        nav.classList.remove("ftoc-anim", "ftoc-rise", "ftoc-open");
      }, config.cleanupDelay),
    ];
  };

  let onLoad: (() => void) | null = null;
  if (document.readyState === "complete") {
    run();
  } else {
    onLoad = run;
    window.addEventListener("load", onLoad, { once: true });
  }

  return () => {
    timers.forEach((t) => clearTimeout(t));
    if (onLoad) window.removeEventListener("load", onLoad);
  };
}
