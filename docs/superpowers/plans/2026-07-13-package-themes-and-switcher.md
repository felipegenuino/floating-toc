# floating-toc — Temas Paper/Ink + switcher — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embarcar 2 temas novos no pacote (Paper claro, Ink escuro) e permitir trocar os 3 temas ao vivo na home da demo.

**Architecture:** Temas são arquivos CSS independentes em `styles/` seguindo o contrato do theme-rta (só aparência: background/border/shadow/vars de cor + `.ftoc-cta`; zero layout). O switcher da home troca o `href` de um `<link id="ftoc-theme">` — nenhuma mudança em `src/`.

**Tech Stack:** CSS puro; JS vanilla inline na página de demo.

## Global Constraints

- `src/` e `dist/` intocados; `npm run build` segue verde.
- Temas só definem: `background`, `border`, `box-shadow`, `--ftoc-color`, `--ftoc-color-active`, `--ftoc-pill-bg` no `.ftoc`, e o estilo do `.ftoc-cta`. Nada de layout/posição/overflow.
- Contraste AA: texto dos links vs fundo da cápsula ≥ 4.5:1 em ambos os temas novos.
- `theme-rta.css` intocado. Zero breaking change.
- Servidor local: http://localhost:4173 (raiz do repo).

---

### Task 1: Temas `theme-light.css` (Paper) e `theme-dark.css` (Ink)

**Files:**
- Create: `styles/theme-light.css`
- Create: `styles/theme-dark.css`

**Interfaces:**
- Produces: os dois arquivos que a Task 2 referencia por nome (`../styles/theme-light.css`, `../styles/theme-dark.css`).

- [ ] **Step 1: criar `styles/theme-light.css`**

```css
/* floating-toc — "Paper" theme: white capsule for light pages.
   Import AFTER core.css:
     import "floating-toc/styles/core.css";
     import "floating-toc/styles/theme-light.css";
*/

.ftoc {
  background: #ffffff;
  border: 1px solid rgba(20, 28, 32, 0.08);
  box-shadow: 0 12px 32px rgba(20, 28, 32, 0.14);

  --ftoc-color: #4a5a60;
  --ftoc-color-active: #101b1f;
  --ftoc-pill-bg: rgba(20, 40, 46, 0.08);
}

.ftoc-cta {
  background: #16242a;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 11px 18px;
  box-shadow: 0 0 0 4px rgba(22, 36, 42, 0.08);
  transition: transform 0.15s, box-shadow 0.2s;
}
.ftoc-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 0 6px rgba(22, 36, 42, 0.16);
}
```

- [ ] **Step 2: criar `styles/theme-dark.css`**

```css
/* floating-toc — "Ink" theme: solid near-black graphite (no glass).
   Import AFTER core.css:
     import "floating-toc/styles/core.css";
     import "floating-toc/styles/theme-dark.css";
*/

.ftoc {
  background: #16181d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.4);

  --ftoc-color: #b8c0cc;
  --ftoc-color-active: #ffffff;
  --ftoc-pill-bg: rgba(255, 255, 255, 0.12);
}

.ftoc-cta {
  background: #ffffff;
  color: #16181d;
  font-weight: 700;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 11px 18px;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.14);
  transition: transform 0.15s, box-shadow 0.2s;
}
.ftoc-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.24);
}
```

- [ ] **Step 3: verificar contraste AA (WCAG, razão ≥ 4.5:1)**

Run:
```bash
python3 - <<'EOF'
def lum(hexc):
    r,g,b=[int(hexc[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def ratio(a,b):
    la,lb=sorted((lum(a),lum(b)),reverse=True)
    return (la+0.05)/(lb+0.05)
print("Paper link:", round(ratio("4a5a60","ffffff"),2))
print("Paper active:", round(ratio("101b1f","ffffff"),2))
print("Ink link:", round(ratio("b8c0cc","16181d"),2))
print("Ink active:", round(ratio("ffffff","16181d"),2))
print("CTA paper:", round(ratio("ffffff","16242a"),2))
print("CTA ink:", round(ratio("16181d","ffffff"),2))
EOF
```
Expected: todos ≥ 4.5. Se algum falhar, escurecer/clarear a cor de texto do tema até passar e registrar o valor final no relatório.

- [ ] **Step 4: Commit**

```bash
git add styles/theme-light.css styles/theme-dark.css
git commit -m "feat(themes): Paper (light) e Ink (dark) embarcados no pacote"
```

---

### Task 2: Switcher de temas na home

**Files:**
- Modify: `examples/index.html`

**Interfaces:**
- Consumes: `styles/theme-light.css`, `styles/theme-dark.css` (Task 1), `styles/theme-rta.css`.

- [ ] **Step 1: id no link do tema**

No `<head>`, trocar:
```html
<link rel="stylesheet" href="../styles/theme-rta.css" />
```
por:
```html
<link rel="stylesheet" href="../styles/theme-rta.css" id="ftoc-theme" />
```

- [ ] **Step 2: switcher na seção Theming**

Dentro de `<section id="theming">`, após o parágrafo existente, inserir:

```html
      <div class="theme-switch" role="group" aria-label="Dock theme">
        <button type="button" data-theme="theme-rta" aria-pressed="true">Petrol Glass</button>
        <button type="button" data-theme="theme-light" aria-pressed="false">Paper</button>
        <button type="button" data-theme="theme-dark" aria-pressed="false">Ink</button>
      </div>
```

E atualizar o parágrafo da seção Theming para mencionar que o pacote embarca
3 temas prontos (Petrol Glass, Paper, Ink) além do core neutro — mantendo a
menção às CSS variables.

- [ ] **Step 3: CSS dos pills no `<style>` da página**

```css
      .theme-switch {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-top: 18px;
      }
      .theme-switch button {
        font: inherit;
        font-size: 13px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        padding: 9px 16px;
        border-radius: 999px;
        border: 1px solid rgba(20, 28, 32, 0.18);
        background: transparent;
        color: inherit;
        cursor: pointer;
      }
      .theme-switch button[aria-pressed="true"] {
        background: #16242a;
        color: #fff;
        border-color: #16242a;
      }
      .theme-switch button:focus-visible {
        outline: 2px solid #16242a;
        outline-offset: 2px;
      }
```

- [ ] **Step 4: JS do switcher (no script de init existente, após o createTOC)**

```js
      document.querySelectorAll(".theme-switch button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          document.getElementById("ftoc-theme").href =
            "../styles/" + btn.dataset.theme + ".css";
          document.querySelectorAll(".theme-switch button").forEach(function (b) {
            b.setAttribute("aria-pressed", String(b === btn));
          });
        });
      });
```

- [ ] **Step 5: verificações**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/examples/index.html   # 200
grep -c 'id="ftoc-theme"' examples/index.html   # 1
grep -c 'data-theme="theme-light"' examples/index.html   # 1
grep -c "aria-pressed" examples/index.html   # >= 4 (3 no HTML + JS)
```

- [ ] **Step 6: Commit**

```bash
git add examples/index.html
git commit -m "feat(demo): switcher de temas ao vivo na seção Theming"
```

---

### Task 3: README — tabela de temas

**Files:**
- Modify: `README.md`

- [ ] **Step 1: adicionar subseção Themes**

Localizar a parte de theming/uso do README (a menção a `theme-rta.css` no
quick start) e adicionar logo após ela:

```markdown
### Themes

The package ships three ready-made themes (import exactly one, after `core.css`):

| Theme | File | Look |
| --- | --- | --- |
| Petrol Glass | `floating-toc/styles/theme-rta.css` | petrol glassmorphism |
| Paper | `floating-toc/styles/theme-light.css` | white capsule for light pages |
| Ink | `floating-toc/styles/theme-dark.css` | solid near-black graphite |

Or skip themes entirely and style `.ftoc` yourself on top of the unstyled core.
```

- [ ] **Step 2: verificação e commit**

```bash
grep -c "theme-light.css" README.md   # >= 1
git add README.md
git commit -m "docs: tabela dos 3 temas embarcados"
```

---

## Verificação final (controlador, Playwright)

Após as 3 tasks: abrir a home, clicar em cada pill e medir que o
`background-color` computado do `.ftoc` muda (3 valores distintos), que o
dock permanece contido (CTA dentro da cápsula) e que `aria-pressed` acompanha
a seleção. Depois, QA visual do Felipe.
