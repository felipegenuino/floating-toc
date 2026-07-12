# floating-toc — Contenção de layout + matriz de demos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar o vazamento da pílula/CTA pra fora da cápsula (3 causas: sem contenção desktop, medição por timing, demo com bundle velho) e criar a matriz de demos que exercita os cenários reais.

**Architecture:** (1) CSS — o rail de links ganha `overflow-x` + scrollbar oculta em todos os viewports, com centralização via `margin-inline: auto` nos extremos, e a cápsula ganha `max-width` pra nunca estourar o viewport. (2) JS — `pill.ts` re-mede em sinais reais (`document.fonts.ready`, `ResizeObserver`) além do `resize`. (3) Demos — `examples/` referencia `dist/` e `styles/` de verdade e ganha 4 modelos + índice.

**Tech Stack:** Vanilla TS (tsup), CSS puro. Sem dependências novas.

## Global Constraints

- Zero dependências de runtime; bundle `dist/index.global.js` ≤ ~3 KB gzip.
- API pública inalterada (`createTOC`, opções, instância).
- `prefers-reduced-motion` continua respeitado.
- Sem testes automatizados (decisão do spec — QA visual do Felipe).
- Verificação manual em: http://localhost:4173/examples/… (server `python3 -m http.server 4173` já rodando na raiz do repo).

---

### Task 1: CSS — contenção do rail em todos os viewports

**Files:**
- Modify: `styles/core.css` (blocos `.ftoc`, `.ftoc-links`, `.ftoc-links a`, media query mobile)

**Interfaces:**
- Produces: comportamento CSS que a Task 4 (modelos, incl. `stress.html`) verifica visualmente. Nenhuma mudança de classe/markup.

- [ ] **Step 1: `.ftoc` ganha max-width (cápsula nunca estoura o viewport)**

No bloco `.ftoc` (linha ~25), adicionar a linha de `max-width`:

```css
.ftoc {
  position: fixed;
  bottom: var(--ftoc-offset, 22px);
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100vw - 2 * var(--ftoc-offset, 22px));
  z-index: var(--ftoc-z, 100);
  border-radius: var(--ftoc-radius, 999px);
  transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

- [ ] **Step 2: `.ftoc-links` com overflow + centralização por margens**

Substituir o bloco atual:

```css
.ftoc-links {
  position: relative;
  display: flex;
  gap: var(--ftoc-link-gap, 4px);
  flex-wrap: nowrap;
  justify-content: center;
}
```

por:

```css
.ftoc-links {
  position: relative;
  display: flex;
  gap: var(--ftoc-link-gap, 4px);
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
}
.ftoc-links::-webkit-scrollbar {
  display: none;
}
/* centraliza enquanto cabe; vira scroll alinhado ao início quando não cabe
   (a pílula é um <i>, por isso *-of-type e não *-child) */
.ftoc-links > a:first-of-type {
  margin-inline-start: auto;
}
.ftoc-links > a:last-of-type {
  margin-inline-end: auto;
}
```

- [ ] **Step 3: `scroll-snap-align` nos links (base, não só mobile)**

No bloco `.ftoc-links a` existente, adicionar a linha:

```css
  scroll-snap-align: center;
```

- [ ] **Step 4: enxugar o media query mobile (regras que subiram pra base)**

Substituir o bloco `@media (max-width: 760px) { ... }` inteiro por:

```css
@media (max-width: 760px) {
  .ftoc {
    left: var(--ftoc-offset-mobile, 10px);
    right: var(--ftoc-offset-mobile, 10px);
    bottom: max(var(--ftoc-offset-mobile, 10px), env(safe-area-inset-bottom));
    max-width: none;
    transform: none;
    border-radius: var(--ftoc-radius-mobile, 18px);
  }
  .ftoc-wrap {
    justify-content: space-between;
  }
  .ftoc-rail {
    flex: 1 1 auto;
  }
  .ftoc-rail > .ftoc-links {
    flex: 1 1 auto;
  }
  /* no horizontal expand on mobile — only a vertical fade/slide */
  .ftoc.ftoc-anim .ftoc-rail {
    grid-template-columns: 1fr;
  }
  .ftoc.ftoc-anim .ftoc-rail > .ftoc-links {
    opacity: 1;
  }
  .ftoc.ftoc-anim {
    transform: translateY(18px);
  }
  .ftoc.ftoc-anim.ftoc-rise {
    transform: translateY(0);
  }
}
```

(Somem: `overflow-x/scrollbar/snap` — foram pra base; `justify-content: flex-start` — as margens auto resolvem. Entra: `max-width: none`, porque no mobile left/right já limitam.)

- [ ] **Step 5: Verificar que nada mais referencia as regras movidas**

Run: `grep -n "justify-content: center" styles/core.css`
Expected: só o `.ftoc-wrap` (nenhum `.ftoc-links`).

- [ ] **Step 6: Commit**

```bash
git add styles/core.css
git commit -m "fix(css): rail com overflow em todos os viewports + max-width na cápsula

Links nunca mais vazam por baixo do CTA nem pra fora da cápsula: o
tratamento de scroll que era só mobile vira base, com centralização via
margin-inline auto nos extremos."
```

---

### Task 2: JS — re-medição por sinais reais (fonts.ready + ResizeObserver)

**Files:**
- Modify: `src/pill.ts` (função `createPill`)

**Interfaces:**
- Consumes: nada novo.
- Produces: `PillController` (mesma interface). O pill agora se auto-corrige em font swap e mudanças de layout.

- [ ] **Step 1: adicionar os observadores em `createPill`**

Em `src/pill.ts`, logo após a definição de `onResize` (antes do `links.forEach`), inserir:

```ts
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
```

- [ ] **Step 2: desconectar o observer no `destroy`**

No objeto retornado, dentro de `destroy()`, adicionar antes de `pill.remove()`:

```ts
      if (ro) ro.disconnect();
```

- [ ] **Step 3: Build e conferir tamanho**

Run: `npm run build && gzip -c dist/index.global.js | wc -c`
Expected: build sem erro de tipo; tamanho < 3000 (bytes gzip).

- [ ] **Step 4: Commit**

```bash
git add src/pill.ts dist
git commit -m "fix(pill): re-mede em document.fonts.ready e ResizeObserver

Font swap tardio e mudanças reais de layout reposicionam a pílula;
acaba a dependência de timing de load para medição."
```

(Se `dist/` estiver no `.gitignore`, commitar só `src/pill.ts`.)

---

### Task 3: Demo index passa a referenciar dist/ e styles/ reais

**Files:**
- Modify: `examples/index.html`

**Interfaces:**
- Consumes: `dist/index.global.js` (Task 2), `styles/core.css` (Task 1), `styles/theme-rta.css`.
- Produces: a página que a Task 4 estende com o índice de modelos.

- [ ] **Step 1: localizar os blocos inlinados**

Run: `grep -n "floating-toc core (structural)\|bundled (IIFE)\|theme" examples/index.html | head`
Expected: linha do começo da cópia inline do core CSS, linha do script bundle (~369) e eventuais marcas de tema.

- [ ] **Step 2: trocar o CSS estrutural inline por `<link>`**

No `<head>`, antes do `<style>` da página, adicionar:

```html
    <link rel="stylesheet" href="../styles/core.css" />
    <link rel="stylesheet" href="../styles/theme-rta.css" />
```

Dentro do `<style>`, apagar a cópia do core (do comentário `floating-toc core (structural)` até o fim do bloco de reduced-motion do ftoc) e a cópia do tema, se houver — **mantendo** os estilos que são da página (hero, seções, tipografia). Comparar com `styles/core.css`/`styles/theme-rta.css` pra decidir o que é cópia.

- [ ] **Step 3: trocar o bundle inline por `<script src>`**

Apagar o `<script>` que contém `var FloatingTOC=(()=>{...})()` (bloco iniciado no comentário `bundled (IIFE)`) e substituir por:

```html
    <script src="../dist/index.global.js"></script>
```

O `<script>` de inicialização (o que chama `FloatingTOC.createTOC({...})`) permanece como está.

- [ ] **Step 4: verificação visual (os dois bugs das fotos)**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/examples/index.html` → `200`.
No navegador (http://localhost:4173/examples/index.html):
1. Estreitar a janela até os itens não caberem → o rail **rola** (scrollbar oculta); nenhum link fica por baixo do "GET STARTED"; "OVERVIEW" não é cortado.
2. DevTools → Network → Slow 3G + Disable cache → recarregar → após as fontes chegarem, pílula alinhada ao item ativo (sem vazar).
3. Hover nos itens → pílula desliza e volta pro ativo ao sair.

- [ ] **Step 5: Commit**

```bash
git add examples/index.html
git commit -m "fix(demo): index referencia dist/ e styles/ reais em vez de cópias inline

A demo da Vercel rodava um bundle colado anterior aos fixes do src/."
```

---

### Task 4: Matriz de modelos — 4 páginas + índice

**Files:**
- Create: `examples/models.css`, `examples/rta-mundi.html`, `examples/hy-empreendimentos.html`, `examples/minimal.html`, `examples/stress.html`
- Modify: `examples/index.html` (barra de links pros modelos)

**Interfaces:**
- Consumes: `dist/index.global.js`, `styles/core.css`, `styles/theme-rta.css`.
- Produces: páginas de QA manual; nenhum código consome.

- [ ] **Step 1: criar `examples/models.css` (chrome compartilhado das páginas)**

```css
/* shared page chrome for the example models — NOT part of the library */
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  color: #22333b;
  background: #f4f7f7;
}
main section {
  min-height: 92vh;
  display: grid;
  place-content: center;
  text-align: center;
  padding: 24px;
  border-top: 1px solid #e2e8e8;
}
main h1, main h2 { margin: 0 0 10px; letter-spacing: -0.02em; }
main p { margin: 0 auto; color: #5b6b70; max-width: 52ch; }
.back {
  position: fixed; top: 14px; left: 14px;
  font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;
  text-decoration: none; color: #5b6b70;
}
```

- [ ] **Step 2: criar `examples/rta-mundi.html` (7 itens + CTA, tema RTA — o cenário das fotos)**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>floating-toc — model: RTA Mundi (7 items + CTA)</title>
    <link rel="stylesheet" href="../styles/core.css" />
    <link rel="stylesheet" href="../styles/theme-rta.css" />
    <link rel="stylesheet" href="./models.css" />
  </head>
  <body>
    <a class="back" href="./index.html">← models</a>
    <main>
      <section id="overview"><h1>RTA Mundi model</h1><p>7 items + CTA — the scenario from the bug screenshots. Narrow the window: the rail must scroll, never overlap the CTA.</p></section>
      <section id="features"><h2>Features</h2><p>Scroll…</p></section>
      <section id="scrollspy"><h2>Scrollspy</h2><p>Scroll…</p></section>
      <section id="animation"><h2>Animation</h2><p>Scroll…</p></section>
      <section id="theming"><h2>Theming</h2><p>Scroll…</p></section>
      <section id="accessibility"><h2>Accessibility</h2><p>Scroll…</p></section>
      <section id="get-started"><h2>Get started</h2><p>End.</p></section>
    </main>
    <script src="../dist/index.global.js"></script>
    <script>
      FloatingTOC.createTOC({
        ariaLabel: "Section index",
        sections: [
          { id: "overview", label: "Overview" },
          { id: "features", label: "Features" },
          { id: "scrollspy", label: "Scrollspy" },
          { id: "animation", label: "Animation" },
          { id: "theming", label: "Theming" },
          { id: "accessibility", label: "Accessibility" },
        ],
        cta: { href: "#get-started", label: "Get started" },
      });
    </script>
  </body>
</html>
```

- [ ] **Step 3: criar `examples/hy-empreendimentos.html` (itens PT, sem CTA, tema claro)**

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>floating-toc — modelo: HY Empreendimentos (PT, sem CTA, tema claro)</title>
    <link rel="stylesheet" href="../styles/core.css" />
    <link rel="stylesheet" href="./models.css" />
    <style>
      /* light theme, page-owned (shows theming without theme-rta.css) */
      .ftoc {
        background: #ffffff;
        color: #24343a;
        box-shadow: 0 10px 30px rgba(20, 40, 46, 0.18);
        --ftoc-pill-bg: rgba(36, 52, 58, 0.1);
        --ftoc-color-active: #0d5c63;
      }
    </style>
  </head>
  <body>
    <a class="back" href="./index.html">← models</a>
    <main>
      <section id="inicio"><h1>Modelo HY Empreendimentos</h1><p>Rótulos em português, sem CTA, tema claro definido pela página.</p></section>
      <section id="empreendimentos"><h2>Empreendimentos</h2><p>Role…</p></section>
      <section id="diario"><h2>Diário</h2><p>Role…</p></section>
      <section id="sobre"><h2>Sobre</h2><p>Role…</p></section>
      <section id="contato"><h2>Contato</h2><p>Fim.</p></section>
    </main>
    <script src="../dist/index.global.js"></script>
    <script>
      FloatingTOC.createTOC({
        ariaLabel: "Índice de seções",
        sections: [
          { id: "inicio", label: "Início" },
          { id: "empreendimentos", label: "Empreendimentos" },
          { id: "diario", label: "Diário" },
          { id: "sobre", label: "Sobre" },
          { id: "contato", label: "Contato" },
        ],
      });
    </script>
  </body>
</html>
```

- [ ] **Step 4: criar `examples/minimal.html` (3 itens, só core.css)**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>floating-toc — model: minimal (3 items, core.css only)</title>
    <link rel="stylesheet" href="../styles/core.css" />
    <link rel="stylesheet" href="./models.css" />
    <style>
      .ftoc { background: #e7ecec; }
    </style>
  </head>
  <body>
    <a class="back" href="./index.html">← models</a>
    <main>
      <section id="one"><h1>Minimal model</h1><p>Smallest setup: 3 items, no CTA, structural CSS only.</p></section>
      <section id="two"><h2>Two</h2><p>Scroll…</p></section>
      <section id="three"><h2>Three</h2><p>End.</p></section>
    </main>
    <script src="../dist/index.global.js"></script>
    <script>
      FloatingTOC.createTOC({
        ariaLabel: "Section index",
        sections: [
          { id: "one", label: "One" },
          { id: "two", label: "Two" },
          { id: "three", label: "Three" },
        ],
      });
    </script>
  </body>
</html>
```

- [ ] **Step 5: criar `examples/stress.html` (12 itens longos + CTA — força o scroll)**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>floating-toc — model: stress (12 long items + CTA)</title>
    <link rel="stylesheet" href="../styles/core.css" />
    <link rel="stylesheet" href="../styles/theme-rta.css" />
    <link rel="stylesheet" href="./models.css" />
  </head>
  <body>
    <a class="back" href="./index.html">← models</a>
    <main><section id="s1"><h1>Stress model</h1><p>12 long labels + CTA. The rail must scroll at any window width and center the active item.</p></section></main>
    <script src="../dist/index.global.js"></script>
    <script>
      var labels = [
        "Introduction", "Getting started", "Configuration", "Advanced usage",
        "Accessibility notes", "Theming variables", "Scrollspy options",
        "Entrance animation", "Reduced motion", "Framework recipes",
        "Troubleshooting", "Changelog",
      ];
      var main = document.querySelector("main");
      var sections = labels.map(function (label, i) {
        var id = "s" + (i + 1);
        if (i > 0) {
          var sec = document.createElement("section");
          sec.id = id;
          sec.innerHTML = "<h2>" + label + "</h2><p>Scroll…</p>";
          main.appendChild(sec);
        }
        return { id: id, label: label };
      });
      FloatingTOC.createTOC({
        ariaLabel: "Section index",
        sections: sections,
        cta: { href: "#s12", label: "Get started" },
      });
    </script>
  </body>
</html>
```

- [ ] **Step 6: barra de modelos no `examples/index.html`**

Logo após `<body>`, inserir:

```html
    <nav class="models-bar" aria-label="Example models">
      <span>Models:</span>
      <a href="./rta-mundi.html">RTA Mundi</a>
      <a href="./hy-empreendimentos.html">HY (pt)</a>
      <a href="./minimal.html">Minimal</a>
      <a href="./stress.html">Stress</a>
    </nav>
```

E no `<style>` da página, adicionar:

```css
      .models-bar {
        position: fixed; top: 14px; right: 14px; z-index: 200;
        display: flex; gap: 10px; align-items: center;
        font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase;
      }
      .models-bar span { opacity: 0.6; }
      .models-bar a { color: inherit; }
```

- [ ] **Step 7: verificação visual da matriz**

No navegador, abrir cada um e conferir critérios do spec:
- `rta-mundi.html`: janela estreita → rail rola, CTA intacto.
- `hy-empreendimentos.html`: tema claro, sem CTA, scrollspy ok.
- `minimal.html`: 3 itens centralizados, pílula segue hover.
- `stress.html`: rail rola em qualquer largura; item ativo centraliza ao rolar a página; mobile (DevTools device mode) ok.
- Em todos: `prefers-reduced-motion` (DevTools → Rendering → emulate) → sem animação, pílula no lugar.

- [ ] **Step 8: Commit**

```bash
git add examples
git commit -m "feat(examples): matriz de modelos (rta-mundi, hy, minimal, stress) + índice"
```

---

### Task 5: Deploy — vercel.json + README

**Files:**
- Create: `vercel.json`
- Modify: `README.md` (seção de exemplos)

- [ ] **Step 1: criar `vercel.json` na raiz**

```json
{
  "rewrites": [{ "source": "/", "destination": "/examples/index.html" }]
}
```

(Mantém a URL raiz `floating-toc.vercel.app` servindo a demo, com `../dist` e `../styles` acessíveis. **Nota pro Felipe:** conferir no dashboard da Vercel que o projeto publica a raiz do repo, sem "output directory" custom apontando pra `examples/`.)

- [ ] **Step 2: README — seção de exemplos**

Adicionar (após a seção de instalação/uso existente):

```markdown
## Examples

`examples/` has one page per real-world scenario (they load `dist/` directly —
run `npm run build` first):

- [`index.html`](examples/index.html) — full demo (7 items + CTA)
- [`rta-mundi.html`](examples/rta-mundi.html) — 7 items + CTA, RTA theme
- [`hy-empreendimentos.html`](examples/hy-empreendimentos.html) — pt-BR labels, no CTA, light theme
- [`minimal.html`](examples/minimal.html) — 3 items, structural CSS only
- [`stress.html`](examples/stress.html) — 12 long items + CTA (forces rail scroll)

Serve the repo root (e.g. `python3 -m http.server`) and open `/examples/`.
```

- [ ] **Step 3: Commit**

```bash
git add vercel.json README.md
git commit -m "chore: vercel.json (raiz → demo) + README com a matriz de exemplos"
```

---

## Fora do plano (decidir depois)

- Publicar `0.2.0` no npm (Felipe decide/roda o publish).
- Testes automatizados (Playwright) — excluído pelo spec.
