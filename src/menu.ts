export interface MenuController {
  destroy(): void;
}
/** Wires every `.ftoc-menu` dropdown inside `nav` with accessible disclosure behavior. */
export function createMenus(nav: HTMLElement): MenuController {
  const menus = Array.from(nav.querySelectorAll<HTMLElement>(".ftoc-menu"));
  if (!menus.length) return { destroy() {} };
  const cleanups: Array<() => void> = [];
  const trigger = (dd: HTMLElement) => dd.querySelector<HTMLElement>(".ftoc-trigger");
  const pop = (dd: HTMLElement) => dd.querySelector<HTMLElement>(".ftoc-pop");
  const items = (dd: HTMLElement) => Array.from(dd.querySelectorAll<HTMLElement>(".ftoc-pop-item"));
  const isOpen = (dd: HTMLElement) => dd.classList.contains("ftoc-open");
  function close(dd: HTMLElement, returnFocus: boolean): void {
    if (!isOpen(dd)) return;
    const p = pop(dd), t = trigger(dd);
    dd.classList.remove("ftoc-open");
    if (t) t.setAttribute("aria-expanded", "false");
    if (returnFocus && t) t.focus();
    window.setTimeout(() => { if (!isOpen(dd) && p) p.hidden = true; }, 220);
  }
  function open(dd: HTMLElement, focusFirst: boolean): void {
    menus.forEach((o) => { if (o !== dd) close(o, false); });
    const p = pop(dd), t = trigger(dd);
    if (p) p.hidden = false;
    requestAnimationFrame(() => {
      dd.classList.add("ftoc-open");
      if (t) t.setAttribute("aria-expanded", "true");
      if (focusFirst) { const it = items(dd); if (it[0]) it[0].focus(); }
    });
  }
  menus.forEach((dd) => {
    const t = trigger(dd);
    if (!t) return;
    const onClick = (e: Event) => { e.stopPropagation(); isOpen(dd) ? close(dd, false) : open(dd, false); };
    const onTriggerKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); open(dd, true); }
    };
    const onMenuKey = (e: KeyboardEvent) => {
      const it = items(dd); if (!it.length) return;
      const i = it.indexOf(document.activeElement as HTMLElement);
      if (e.key === "ArrowDown") { e.preventDefault(); (it[i + 1] || it[0]).focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); (i <= 0 ? it[it.length - 1] : it[i - 1]).focus(); }
      else if (e.key === "Home") { e.preventDefault(); it[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); it[it.length - 1].focus(); }
    };
    const onFocusOut = (e: FocusEvent) => { if (!dd.contains(e.relatedTarget as Node)) close(dd, false); };
    t.addEventListener("click", onClick);
    t.addEventListener("keydown", onTriggerKey);
    dd.addEventListener("keydown", onMenuKey);
    dd.addEventListener("focusout", onFocusOut);
    const itemCleanups = items(dd).map((a) => {
      const h = () => close(dd, false);
      a.addEventListener("click", h);
      return () => a.removeEventListener("click", h);
    });
    cleanups.push(() => {
      t.removeEventListener("click", onClick);
      t.removeEventListener("keydown", onTriggerKey);
      dd.removeEventListener("keydown", onMenuKey);
      dd.removeEventListener("focusout", onFocusOut);
      itemCleanups.forEach((c) => c());
    });
  });
  const onDocClick = (e: MouseEvent) => { menus.forEach((dd) => { if (!dd.contains(e.target as Node)) close(dd, false); }); };
  const onDocKey = (e: KeyboardEvent) => { if (e.key === "Escape") menus.forEach((dd) => { if (isOpen(dd)) close(dd, true); }); };
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onDocKey);
  cleanups.push(() => { document.removeEventListener("click", onDocClick); document.removeEventListener("keydown", onDocKey); });
  return { destroy() { cleanups.forEach((c) => c()); } };
}
