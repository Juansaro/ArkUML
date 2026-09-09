# TASK-024: Iconografía y tooltips accesibles

## Objetivo

Aplicar la identidad de ArkUML al chrome y convertir top bar, paleta UML y
controles del lienzo al sistema de iconos/tooltips aprobado, sin cambiar la
funcionalidad del editor.

## Prioridad

P1

## Dependencias

TASK-023

## Contexto obligatorio

- @docs/product/brand-system.md
- @docs/product/mvp-spec.md (clasificación UX y accesibilidad)
- @docs/architecture/architecture.md (límites UI/editor)
- @docs/architecture/testing-strategy.md
- @docs/tasks/TASK-007.md

## Estado inicial

`docs/product/brand-system.md` cierra marca, tokens, inventario SVG, matriz de
copy, estados y tooltip. La top bar y la paleta usan botones de texto con
`title` puntuales. `DiagramCanvas` delega zoom/fit a `<Controls>` de React
Flow. No existe primitiva de tooltip ni dependencia de iconos. Los nombres
accesibles y flujos keyboard-only actuales están cubiertos por RTL/Playwright.

## Dentro del alcance

- SVG locales para marca y todos los símbolos de la matriz del contrato.
- Primitivas compartidas `Icon`, `Tooltip`, `TooltipProvider` y `ToolButton`.
- Un único tooltip visible: hover con demora de 400 ms, foco sin demora
  perceptible, persistencia sobre trigger/tooltip, Escape y prevención de
  overflow.
- Top bar icon-only para toggles y acciones; isotipo junto al wordmark.
- Paleta con icono + etiqueta visible y descripción contextual.
- Estados normal, hover, focus, pressed y `aria-disabled`; indisponibles
  explican el motivo y bloquean click, Enter y Space.
- Controles propios icon-only de acercar, alejar y ajustar vista, con las
  operaciones y límites actuales de React Flow.
- Tokens de marca, favicon SVG y estilos necesarios del chrome.
- Tests unit/integration, a11y, teclado, tooltips y baselines del shell.

## Fuera del alcance

- Cambiar operaciones, store, historial, documento o persistencia.
- Cambiar nodos, edges, handles, marcadores, estereotipos o el resultado
  exportado.
- Dark mode, temas, selector de apariencia, animaciones o webfonts.
- Landing, README promocional, social cards o material de marketing.
- Tooltips en inspector, diálogos o elementos del canvas que no sean los tres
  controles de viewport.
- Añadir paquetes, copiar un icon set externo o actualizar versiones.

## Archivos / módulos afectados

- `src/editor/components/common/Icon.tsx`
- `src/editor/components/common/icons.tsx`
- `src/editor/components/common/Tooltip.tsx`
- `src/editor/components/common/ToolButton.tsx`
- CSS Modules y tests colocalizados bajo `src/editor/components/common/`
- `src/editor/components/shell/EditorShell.tsx`
- `src/editor/components/shell/TopBar.tsx`
- `src/editor/components/shell/TopBar.module.css`
- `src/editor/components/shell/Palette.tsx`
- `src/editor/components/shell/Palette.module.css`
- `src/editor/components/shell/InertButton.tsx`
- tests colocalizados de `shell/`
- `src/editor/canvas/DiagramCanvas.tsx`
- `src/editor/canvas/DiagramCanvas.module.css`
- `src/editor/canvas/DiagramCanvas.test.tsx`
- `src/app/styles/tokens.css`
- `src/app/styles/globals.css` (estilos base de botones)
- `public/favicon.svg`
- `index.html`
- `e2e/accessibility.spec.ts`
- `e2e/shell-layout.spec.ts`
- `e2e/tooltips.spec.ts`
- baselines versionados de `e2e/**/__screenshots__/`

## Cambios esperados

- ArkUML se reconoce por isotipo, wordmark y Blueprint sin aumentar la altura
  del shell ni reducir el título del documento a un ancho inutilizable.
- «Nuevo», undo/redo, Exportar, Ayuda, toggles y zoom usan iconos sin texto
  visible, pero conservan exactamente sus nombres accesibles.
- Actor, Caso de uso, Boundary, Association, Include y Extend muestran símbolo
  y etiqueta; Include/Extend son distinguibles por `I`/`E`.
- Cada control muestra la descripción definida por `brand-system.md` en hover
  y foco. No queda ningún `title` en las superficies migradas.
- Zoom permanece entre `0.5` y `2`; fit usa padding `0.2` y duración `0`. El
  wrapper conserva `.react-flow__controls` para seguir excluido del export.

## Restricciones

- Copiar de `brand-system.md` los `d` SVG, dasharray, tokens, tamaños, copy de
  la matriz y la tabla de estados. No reinterpretar glifos ni redactar textos
  nuevos.
- Mapear ids de `Icon` a `EditorTool` existentes: `useCase` → `use-case`,
  `systemBoundary` → `system-boundary`. No renombrar herramientas ni ids de
  icono.
- Tokens a añadir o reasignar, y ningún otro: `--color-brand`, `--color-focus`
  como `var(--color-brand)`, `--color-brand-deep`, `--color-control-border`,
  `--z-tooltip`. `--color-shadow` ya existe; no recrearlo.
- Los SVG usan `currentColor`, son decorativos y tienen `aria-hidden="true"`.
  El nombre vive en texto visible o `aria-label` del botón. Favicon: SVG del
  contrato en `public/favicon.svg` y `<link rel="icon">` en `index.html`.
- El tooltip usa `role="tooltip"`, `data-testid="editor-tooltip"` y
  `aria-describedby`, no `aria-live`, `aria-haspopup`, `aria-expanded` ni
  `title`. Sin caret. Hover 400 ms, foco 0 ms, `hideDelay` 100 ms.
- `TooltipProvider` se monta una vez en `EditorShell` y coordina un único
  tooltip mediante un portal a `document.body`. El tooltip no recibe foco ni
  contiene elementos interactivos.
- Escape cierra solo el tooltip abierto y no activa/cancela otra acción del
  editor en ese keydown.
- Los botones sin acción disponible usan `aria-disabled="true"` y guardas de
  click/Enter/Space para que el motivo siga accesible por foco. Reutilizar
  `BOUNDARY_EXISTS_REASON`; no duplicar esa copy. Deshacer/Rehacer y zoom en
  tope dejan de usar `disabled` nativo. `ToolButton` anula `opacity: 0.7` de
  `globals.css` en disabled; la tinta `--color-muted` basta.
- La paleta conserva labels visibles: el tooltip complementa, no sustituye, la
  semántica UML. «Cerrar paneles», tagline y diálogos no se iconifican.
- El `h1` «ArkUML» permanece visible junto al isotipo 24 px Blueprint.
- El componente de controles de canvas vive dentro de `<ReactFlow>` para usar
  `useReactFlow`; no crea store paralelo ni escribe historial.
- Sustituir aserciones sobre `title` en paleta/top bar/InertButton por
  tooltip / `aria-describedby`.
- No tocar `src/domain`, `src/persistence`, `src/export` ni dependencias.

## Criterios de aceptación

- [x] La firma ArkUML y el favicon siguen las variantes y mínimos del contrato.
- [x] Top bar, paleta y zoom cubren toda la matriz de iconos; no hay SVG sin
      nombre de control asociado.
- [x] Los tooltips abren por hover/foco, respetan 400 ms solo para pointer,
      hideDelay 100 ms, permanecen hoverables, cierran con Escape y nunca hay
      más de uno visible.
- [x] Tooltip y trigger permanecen dentro del viewport en 768×720, 1024×720,
      1440×900 y 1920×1080.
- [x] Undo/redo y boundary indisponibles explican el motivo y no mutan.
- [x] `aria-pressed`, diálogos, drawers, creación, undo/redo, export y ayuda
      conservan su comportamiento.
- [x] Zoom in/out/fit mantiene límites, padding y ausencia de historial.
- [x] Include y Extend se distinguen sin color; la notación del diagrama y la
      exportación no cambian.
- [x] Axe no reporta violaciones critical/serious en estados cubiertos y el
      recorrido keyboard-only sigue verde.
- [x] Baselines Windows revisados a los tres viewports desktop.

## Tests

- RTL con fake timers para hover 399/400 ms, foco inmediato, hideDelay 100 ms,
  Escape, transición trigger→tooltip, apertura exclusiva, descripción ARIA y
  cleanup.
- RTL para `ToolButton` pressed/disabled: nombre accesible estable, razón
  visible y cero callbacks al click/Enter/Space.
- Shell: todas las acciones por rol/nombre existentes; marca y composición.
- Canvas: zoom/fit invocan React Flow con los parámetros actuales y no mutan el
  store.
- Playwright: hover y foco de top bar/paleta/zoom, Escape, un tooltip, disabled,
  keyboard-only y axe. Screenshot visual en los baselines Windows existentes.
- Navegador real: recorrer Nuevo, undo/redo, Exportar, Ayuda, drawers, seis
  herramientas UML y tres controles de viewport a 1024×720; repetir layout a
  768 px y 200 % de zoom del navegador.

## Comandos de verificación

```bash
npm run test -- src/editor/components/common src/editor/components/shell src/editor/canvas/DiagramCanvas.test.tsx
npm run test:e2e -- e2e/shell-layout.spec.ts e2e/accessibility.spec.ts e2e/tooltips.spec.ts --project=chromium
npm run check
```

## Stop conditions

- Hace falta una librería de iconos, webfont o cambio de pin.
- Los controles propios no pueden conservar zoom/fit o la exclusión del
  export.
- El tooltip requiere una segunda live region o información solo por hover.
- El isotipo se confunde con un elemento del diagrama a tamaño de uso.
- Un baseline cambia fuera de top bar, paleta o controles del lienzo.

## Definition of Done

Marca, favicon, iconos y tooltip implementados conforme a `brand-system.md`;
flujos existentes y a11y verificados en tests y navegador; baselines revisados;
`npm run check` verde; sin cambios de dependencia, dominio ni notación UML.

## Evidencia de cierre

2026-09-09. Criterios `[x]`. Producto: isotipo 24 px + wordmark, favicon SVG,
`Icon`/`Tooltip`/`ToolButton`, paleta con etiquetas visibles, controles de
lienzo propios (clase `.react-flow__controls`), tokens de marca. Comandos:
`npm run test -- src/editor/components/common src/editor/components/shell src/editor/canvas/DiagramCanvas.test.tsx`;
`npm run test:e2e -- e2e/shell-layout.spec.ts e2e/accessibility.spec.ts e2e/tooltips.spec.ts --project=chromium`
(17 pass); `npm run check` (258 tests + build). Baselines
`shell-{1024x720,1440x900,1920x1080}-chromium-win32.png` actualizados (chrome
de top bar, paleta y controles; notación UML del lienzo intacta). Navegador:
`vite preview` en `:4173`, 1024×720 (Nuevo, Exportar, Ayuda, Actor, Acercar),
drawers a 768×720, layout a DPR 2.
