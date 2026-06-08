export interface PillController {
  /** Set the link the pill rests on when not hovering. */
  moveTo(el: HTMLElement | null): void;
  /** The current resting link. */
  current(): HTMLElement | null;
  destroy(): void;
}

/**
 * Creates the sliding pill highlight. The pill is injected as the first child of
 * the links container (behind the links, z-index 0) and animated via CSS.
 * It follows hover/focus, and returns to the active link on mouse-leave.
 */
export function createPill(
  linksBox: HTMLElement,
  links: HTMLAnchorElement[],
): PillController {
  const pill = document.createElement("i");
  pill.className = "ftoc-pill";
  pill.setAttribute("aria-hidden", "true");
  linksBox.appendChild(pill);

  let hovering = false;
  let resting: HTMLElement | null = null;

  function place(target: HTMLElement | null): void {
    if (!target) {
      pill.style.opacity = "0";
      return;
    }
    pill.style.opacity = "1";
    pill.style.width = target.offsetWidth + "px";
    pill.style.transform = "translateX(" + target.offsetLeft + "px)";
  }

  const onEnter = (e: Event): void => {
    hovering = true;
    place(e.currentTarget as HTMLElement);
  };
  const onLeaveBox = (): void => {
    hovering = false;
    place(resting);
  };
  const onResize = (): void => {
    if (!hovering) place(resting);
  };

  links.forEach((a) => {
    a.addEventListener("mouseenter", onEnter);
    a.addEventListener("focus", onEnter);
  });
  linksBox.addEventListener("mouseleave", onLeaveBox);
  window.addEventListener("resize", onResize);

  return {
    moveTo(target) {
      resting = target;
      if (!hovering) place(target);
    },
    current() {
      return resting;
    },
    destroy() {
      links.forEach((a) => {
        a.removeEventListener("mouseenter", onEnter);
        a.removeEventListener("focus", onEnter);
      });
      linksBox.removeEventListener("mouseleave", onLeaveBox);
      window.removeEventListener("resize", onResize);
      pill.remove();
    },
  };
}
