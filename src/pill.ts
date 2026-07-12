export interface PillController {
  /** Set the link the pill rests on when not hovering. */
  moveTo(el: HTMLElement | null): void;
  /** The current resting link. */
  current(): HTMLElement | null;
  destroy(): void;
}

/**
 * Creates the sliding pill highlight. The pill is appended as the last child of
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
    // Position via rects (not offsetLeft/Width): when .ftoc-links collapses,
    // centered links overflow and report a negative offsetLeft, throwing the
    // pill outside the dock. getBoundingClientRect uses the real rendered
    // position; scrollLeft keeps it aligned when the rail scrolls (mobile).
    const box = linksBox.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    pill.style.width = r.width + "px";
    pill.style.transform =
      "translateX(" + (r.left - box.left + linksBox.scrollLeft) + "px)";
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

  // Re-measure on real layout signals instead of trusting load-time timing:
  // late font swap changes text widths (uppercase + letter-spacing!), and
  // the entrance animation resizes the links box. The window `resize`
  // listener below stays as the fallback for older environments.
  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.ready.then(() => {
      if (!hovering) place(resting);
    });
  }
  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(() => {
      if (!hovering) place(resting);
    });
    ro.observe(linksBox);
  }

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
      if (ro) ro.disconnect();
      pill.remove();
    },
  };
}
