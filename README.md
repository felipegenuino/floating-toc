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

### Themes

The package ships three ready-made themes (import exactly one, after `core.css`):

| Theme | File | Look |
| --- | --- | --- |
| Petrol Glass | `floating-toc/styles/theme-rta.css` | petrol glassmorphism |
| Paper | `floating-toc/styles/theme-light.css` | white capsule for light pages |
| Ink | `floating-toc/styles/theme-dark.css` | solid near-black graphite |

```js
import "floating-toc/styles/core.css";
import "floating-toc/styles/theme-light.css"; // pick one theme
```

Or skip themes entirely and style `.ftoc` yourself on top of the unstyled core.

## Examples

`examples/` has one page per real-world scenario (they load `dist/` directly —
run `npm run build` first):

- [`index.html`](examples/index.html) — full demo (6 items + CTA)
- [`rta-mundi.html`](examples/rta-mundi.html) — 6 items + CTA, RTA theme
- [`hy-empreendimentos.html`](examples/hy-empreendimentos.html) — pt-BR labels, no CTA, light theme
- [`minimal.html`](examples/minimal.html) — 3 items, structural CSS only
- [`stress.html`](examples/stress.html) — 12 long items + CTA (forces rail scroll)

Serve the repo root (e.g. `python3 -m http.server`) and open `/examples/`.

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

### Instance

```ts
interface FloatingTOCInstance {
  readonly element: HTMLElement;
  setActive(id: string): void;
  refresh(): void; // recompute pill position after layout changes
  destroy(): void; // remove observers, listeners and the pill
}
```

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
