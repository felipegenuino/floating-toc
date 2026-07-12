# floating-toc — Medição de layout no load + matriz de demos

**Data:** 2026-07-12 · **Status:** aprovado (conversa com Felipe)

## Problema

Em produção (floating-toc.vercel.app), ao carregar a página a pílula/CTA vaza
pra fora da cápsula e sobrepõe o último link ("ACCESSIBILITYGET STARTED").

Causa raiz: o ciclo de medição depende de *timing chutado*, não de sinais reais
de layout:

- `index.ts` espera `openDelay + 650ms` (número mágico) para liberar a pílula.
- O cleanup da animação re-mede aos 2000ms — e nada re-mede depois disso.
- **Font swap não dispara re-medição.** Com texto uppercase + letter-spacing,
  a largura muda quando a webfont chega; se isso acontece após o cleanup,
  as posições medidas ficam erradas.

É a terceira regressão da mesma família (`fix(pill): getBoundingClientRect`,
`fix: pill flash on load` já trataram sintomas).

Investigação ao vivo (12/07) revelou **três causas combinadas**:

1. **Sem contenção no desktop:** o `overflow-x: auto` do `.ftoc-links` só
   existe no media query mobile (≤760px). No desktop o rail é flex centrado
   `nowrap` sem contenção — quando itens + CTA não cabem, vazam pelos dois
   lados (screenshot: "OVERVIEW" cortado à esquerda, "ACCESSIBILITY" + pílula
   por baixo do CTA à direita). A pílula segue corretamente um link que está,
   de fato, embaixo do CTA.
2. **Medição por timing chutado** (detalhado acima) — font swap tardio nunca
   re-mede.
3. **Demo com bundle velho inlinado:** `examples/index.html` tem uma cópia
   colada do bundle anterior ao fix do `getBoundingClientRect` — a demo da
   Vercel roda código desatualizado e não reflete fixes do `src/`.

## Parte 1 — Ciclo de vida de medição + contenção (causa raiz)

**1a. Contenção do rail em todos os tamanhos (CSS):** promover o tratamento
que hoje é só mobile — `overflow-x: auto`, scrollbar oculta, scroll-snap —
para o `.ftoc-links` em qualquer viewport. O rail rola quando não cabe;
links nunca vazam por baixo do CTA nem pra fora da cápsula. A centralização
(`justify-content: center`) permanece quando há espaço via `margin: auto`
nos extremos ou `justify-content: safe center`.

**1b. Medição por sinais reais em vez de delays:**

1. **`document.fonts.ready`**: ao resolver, re-posicionar a pílula
   (`place(resting)`) — cobre font swap tardio.
2. **`ResizeObserver` no `linksBox`** (e no nav): qualquer mudança real de
   layout (fonte, resize de container, conteúdo dinâmico) re-posiciona a
   pílula quando não está em hover. Substitui o `window.resize` listener atual
   (que não pega mudanças de container) e o timer mágico `openDelay + 650`.
3. Os delays da **animação de entrada** (rise/open/cleanup) permanecem — são
   coreografia, não medição. Somente a *medição* deixa de depender deles.

Restrições:
- Zero dependências novas; bundle continua na casa dos ~2 KB min+gzip.
- API pública inalterada (`createTOC`, opções, instância).
- `prefers-reduced-motion` continua respeitado.
- Fallback: se `ResizeObserver`/`document.fonts` não existirem (ambientes
  antigos), manter comportamento atual via `window.resize` + timers.

## Parte 2 — Matriz de demos ("modelos")

`examples/` passa a ter uma página por cenário real, e um índice linkando
todas:

| Arquivo | Cenário | Baseado em |
|---|---|---|
| `index.html` | Índice dos modelos + demo atual (7 itens + CTA) | site atual |
| `rta-mundi.html` | 7 itens + CTA, tema RTA | rtamundi.com.br |
| `hy-empreendimentos.html` | Itens em PT, sem CTA, tema claro custom | hyempreendimentos.com.br |
| `minimal.html` | 3 itens, sem CTA, core.css puro | menor caso |
| `stress.html` | 10+ itens longos + CTA (força scroll do rail/mobile) | pior caso |

Cada página **referencia o build local** (`<script src="../dist/index.global.js">`
e `styles/*.css`) em vez de inlinar cópias — fixes no `src/` passam a refletir
na demo após `npm run build`. Verificar durante a implementação como o deploy
da Vercel aponta para `examples/` e manter a URL raiz funcionando.

## Fora de escopo

- Testes automatizados (Playwright/CI) — Felipe testa visualmente.
- Novas features (headings automáticos, nesting, posições).
- Novos temas além do necessário para os modelos.

## Critérios de aceite

1. Carregando cada modelo com cache frio / fonte lenta (DevTools → throttling),
   pílula e CTA ficam **contidos na cápsula** após o load — sem vazamento.
2. Hover/focus continuam movendo a pílula; ao sair, ela volta ao item ativo.
3. Scrollspy e centralização do item ativo seguem funcionando (inclusive no
   `stress.html` com rail rolável).
4. Com `prefers-reduced-motion`, sem animação e sem pílula fora do lugar.
5. Redimensionar a janela e trocar de fonte (DevTools) não desalinha a pílula.
