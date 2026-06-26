# floating-toc

Floating, dock-style table of contents with **scrollspy** and a **sliding pill highlight** — the same component from the RTA Brasil event site, extracted into a tiny, framework-agnostic package.

- **Zero dependencies.** Vanilla JS + CSS. ~2 KB min+gzip.
- **Scrollspy** via `IntersectionObserver` — highlights the section in the center of the viewport.
- **Sliding pill** that follows hover/focus and rests on the active item.
- **Entrance animation** — the capsule rises and expands, items stagger in.
- **Accessible** — `aria-current`, focus support, and full `prefers-reduced-motion` handling.
- **Themeable** — unstyled core driven by CSS variables, plus an optional RTA theme.
- Works as **ESM**, **CommonJS**, or a global **`<script>`** (CDN).

## Install

```bash
npm install floating-toc
```

## Quick start

Two stylesheets ship with the package: the structural `core.css` (required) and an optional `theme-rta.css` (the petrol/glass look).

### Generate the nav from a list of sections

```js
import { createTOC } from "floating-toc";
import "floating-toc/styles/core.css";
import "floating-toc/styles/theme-rta.css"; // optional look

createTOC({
  ariaLabel: "Section index",
  sections: [
    { id: "about", label: "About" },
    { id: "pricing", label: "Pricing" },
    { id: "faq", label: "FAQ" },
  ],
  cta: { href: "#signup", label: "Sign up" }, // optional
});
```

Each `id` must match the `id` of a section element on the page (e.g. `<section id="about">`).

### Enhance existing markup (progressive enhancement)

If you'd rather keep the nav in your HTML, give it the `ftoc` structure and pass it as `root`:

```html
<nav class="ftoc" aria-label="Section index">
  <div class="ftoc-wrap">
    <div class="ftoc-rail">
      <div class="ftoc-links">
        <a href="#about">About</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
      </div>
    </div>
    <a class="ftoc-cta" href="#signup">Sign up</a>
  </div>
</nav>
```

```js
import { createTOC } from "floating-toc";
createTOC({ root: ".ftoc" });
```

### Via CDN (no build step)

```html
<link rel="stylesheet" href="https://unpkg.com/floating-toc/styles/core.css" />
<link rel="stylesheet" href="https://unpkg.com/floating-toc/styles/theme-rta.css" />
<script src="https://unpkg.com/floating-toc"></script>
<script>
  FloatingTOC.createTOC({
    sections: [
      { id: "about", label: "About" },
      { id: "pricing", label: "Pricing" },
    ],
  });
</script>
```

## API

### `createTOC(options?) => instance`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `root` | `string \| HTMLElement` | — | Existing nav to enhance. Provide this **or** `sections`. |
| `sections` | `{ id, label }[]` | — | Sections used to generate the nav. |
| `mount` | `string \| HTMLElement` | `document.body` | Where to append a generated nav. |
| `cta` | `{ href, label } \| null` | — | Optional CTA button on a generated nav. |
| `ariaLabel` | `string` | — | `aria-label` for a generated nav. |
| `intro` | `boolean \| { riseDelay, openDelay, cleanupDelay }` | `true` | Entrance animation (ms timings). |
| `pill` | `boolean` | `true` | Sliding pill highlight. |
| `scrollspy` | `boolean \| { rootMargin, threshold }` | `true` | Scrollspy + tuning. |
| `smoothCenter` | `boolean` | `true` | Auto-center the active link on horizontal scroll (mobile). |
| `respectReducedMotion` | `boolean` | `true` | Skip intro/smooth when the user prefers reduced motion. |
| `activeClass` | `string` | `"is-active"` | Class added to the active link. |
| `onChange` | `(id, link) => void` | — | Fired when the active section changes. |
| `menus` | `MenuDef[]` | — | Dropdown menus rendered in the dock (after the links rail, before the CTA). |

### Instance

```ts
interface FloatingTOCInstance {
  readonly element: HTMLElement;
  setActive(id: string): void;
  refresh(): void; // recompute pill position after layout changes
  destroy(): void; // remove observers, listeners and the pill
}
```

## Dropdown menus

The `menus` option renders one or more disclosure dropdowns in the dock — useful for things like language switchers, share menus, or any small set of contextual actions. Each menu is a trigger button that reveals a floating popover of icon+label items.

```js
import { createTOC } from "floating-toc";

createTOC({
  sections: [{ id: "intro", label: "Intro" }],
  menus: [
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
      ariaLabel: "Select language",
      align: "end",
      items: [
        { label: "English", hreflang: "en", href: "/en", active: true },
        { label: "Português", hreflang: "pt", href: "/pt" },
        { label: "Español", hreflang: "es", href: "/es" },
      ],
    },
  ],
});
```

### `MenuDef`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Trigger button text. Omit for icon-only. |
| `icon` | `string` | — | Inline SVG/HTML rendered before the label. |
| `ariaLabel` | `string` | — | `aria-label` on the trigger. Required when there is no visible label. |
| `caret` | `boolean` | `true` | Show a rotating chevron on the trigger. |
| `align` | `"start" \| "end"` | `"start"` | Popover alignment relative to the trigger. |
| `items` | `MenuItemDef[]` | — | The popover items. |

### `MenuItemDef`

| Property | Type | Description |
| --- | --- | --- |
| `label` | `string` | Item text. |
| `href` | `string` | Renders an `<a>` when provided; otherwise a `<button>`. |
| `icon` | `string` | Inline SVG/HTML before the label. |
| `active` | `boolean` | Marks the current item (`is-active` class + `aria-current` + checkmark). |
| `hreflang` | `string` | Sets `hreflang` on link items (e.g. for language switchers). |
| `onSelect` | `(item) => void` | Called when the item is clicked. |

### Keyboard accessibility

Menus follow the WAI-ARIA disclosure pattern (`button[aria-expanded]` + links/buttons — **not** `role="menu"`):

- `ArrowDown` / `ArrowUp` on the trigger opens and focuses the first item.
- `ArrowDown` / `ArrowUp` inside the popover move between items (with wrap-around).
- `Home` / `End` jump to first / last item.
- `Escape` closes the open menu and returns focus to the trigger.
- Clicking outside or tabbing out closes the menu.

### CSS variables (dropdown)

Override on `.ftoc` or any ancestor:

| Variable | Default | Description |
| --- | --- | --- |
| `--ftoc-trigger-pad` | `9px 13px` | Trigger button padding |
| `--ftoc-caret-size` | `14px` | Caret chevron size |
| `--ftoc-icon-size` | `18px` | Trigger leading icon size |
| `--ftoc-pop-gap` | `12px` | Gap between trigger and popover |
| `--ftoc-pop-min` | `190px` | Popover min-width |
| `--ftoc-pop-radius` | `16px` | Popover border-radius |
| `--ftoc-pop-bg` | `#fff` | Popover background |
| `--ftoc-pop-shadow` | `0 18px 44px rgba(0,0,0,.25)` | Popover box-shadow |
| `--ftoc-pop-color` | `inherit` | Popover item text color |
| `--ftoc-pop-font-size` | `.86rem` | Popover item font-size |
| `--ftoc-pop-item-pad` | `9px 14px` | Popover item padding |
| `--ftoc-pop-item-hover` | `rgba(127,127,127,.14)` | Popover item hover background |
| `--ftoc-pop-icon-size` | `20px` | Popover item icon size |

## Theming

Override any CSS variable on `.ftoc` (see the top of `core.css` for the full list):

```css
.ftoc {
  --ftoc-offset: 28px;
  --ftoc-color: #555;
  --ftoc-color-active: #000;
  --ftoc-pill-bg: rgba(0, 0, 0, 0.08);
  --ftoc-stagger-step: 0.05s;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
}
```

The stagger delay is computed per item via a `--ftoc-i` index, so it scales to any number of links — no hard-coded limit.

## How it works

The capsule is `position: fixed` at the bottom-center with a glass background. A scrollspy `IntersectionObserver` uses a `rootMargin` that shrinks the detection band to a thin strip in the **vertical center** of the viewport, so the highlighted item matches the section actually on screen. The pill is an injected element behind the links (z-index 0); JS sets its `width`/`transform` and CSS animates the slide. The intro toggles `ftoc-anim → ftoc-rise → ftoc-open` classes, then removes them so the nav settles with no visual jump.

## License

MIT © Felipe Genuino
