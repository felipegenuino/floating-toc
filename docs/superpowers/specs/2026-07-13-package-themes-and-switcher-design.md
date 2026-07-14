# floating-toc — Temas no pacote + switcher na home

**Data:** 2026-07-13 · **Status:** aprovado (conversa com Felipe)

## Objetivo

Dar à demo cara de plugin de verdade: o pacote passa a embarcar 3 temas
prontos, e a home permite trocá-los ao vivo.

## Parte 1 — Dois temas novos no pacote

Arquivos novos em `styles/`, publicáveis via npm (o `exports` do package.json
já mapeia `./styles/*`; conferir se o campo `files`, se existir, inclui
`styles`):

| Arquivo | Nome | Visual |
|---|---|---|
| `theme-rta.css` (existente, intocado) | Petrol Glass | glassmorphism petróleo atual |
| `theme-light.css` (novo) | Paper | cápsula branca `#fff`, borda sutil (`rgba` escura ~8%), sombra suave difusa, texto escuro, pílula cinza-clara, CTA escuro (invertido) |
| `theme-dark.css` (novo) | Ink | grafite quase-preto sólido (~`#16181d`, sem blur/glass — distinto do RTA), borda `rgba` branca sutil, texto claro, pílula branca translúcida, CTA branco |

Contrato (igual ao theme-rta): cada tema só define aparência no `.ftoc` —
`background`, `border`, `box-shadow` e as CSS variables de cor
(`--ftoc-color`, `--ftoc-color-active`, `--ftoc-pill-bg`) — mais o estilo do
`.ftoc-cta`. **Nada de layout** (posição, overflow, tamanho vêm do core).
Cabeçalho de comentário no mesmo formato do theme-rta ("Import AFTER
core.css").

Modelo de uso inalterado: importa `core.css` + 1 tema por página. Zero
breaking change; nenhuma mudança em `src/`.

## Parte 2 — Switcher de temas na home (`examples/index.html`)

- O `<link>` do tema ganha `id="ftoc-theme"`.
- Na seção **Theming** da página, um grupo de 3 botões-pill (RTA · Paper ·
  Ink). Clique troca `document.getElementById("ftoc-theme").href` para o CSS
  correspondente. Estado ativo visual no pill selecionado
  (`aria-pressed="true"`).
- Sem persistência (localStorage) — é demo, YAGNI.
- Acessível: `<button>` reais, rótulo do grupo (`role="group"` +
  `aria-label`), foco visível.
- O texto da seção Theming é atualizado para citar os 3 temas embarcados.

## Parte 3 — README

Na parte de theming/uso: tabelinha dos 3 temas com a linha de import de cada
um (`import "floating-toc/styles/theme-light.css";` etc.).

## Fora de escopo

- Mudanças de API na lib (`src/` intocado).
- Temas nos modelos de `examples/` (continuam como estão).
- Redesign completo da home em formato landing (possível fase futura).
- Persistência do tema escolhido.

## Critérios de aceite

1. Trocar de tema pelo switcher muda o visual do dock ao vivo (background
   computado muda), sem recarregar e sem quebrar layout — dock contido,
   pílula alinhada (medível no Playwright).
2. Cada tema, carregado sozinho num modelo (troca manual do link), rende
   dock legível com contraste adequado (texto AA sobre o fundo da cápsula).
3. `npm run build` segue verde; nada em `dist/` muda (temas são só CSS).
4. README documenta os 3 temas.
