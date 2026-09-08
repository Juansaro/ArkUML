# TASK-007: Shell visual, tokens y layout desktop-first

## Objetivo

Construir la estructura UX accesible del editor sin lógica gráfica de diagramas.

## Prioridad

P0

## Dependencias

TASK-002. En el orden oficial del backlog (001→020) el dominio y el store ya existen; el shell no debe acoplarse a React Flow.

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/architecture/architecture.md
- @docs/architecture/testing-strategy.md

## Estado inicial

App mínima + tests. Dominio/store pueden existir.

## Dentro del alcance

- Layout: top bar, paleta izquierda, canvas central (placeholder), inspector derecho, status bar.
- Tokens CSS (color, espacio, tipo, focus ring) + CSS Modules.
- Top bar: título (estático o bound si store existe), huecos Nuevo / undo / redo / Exportar deshabilitados o no operativos.
- Paleta: botones de elementos y relaciones **sin** crear aún.
- Tooltips y nombres accesibles. No icon-only sin nombre.
- Drawers 768–1023; aviso `<768` sin borrar datos (puede ser CSS + texto).
- Tests RTL de landmarks. Playwright screenshots de shell a 1024×720, 1440×900, 1920×1080.

## Fuera del alcance

- Canvas React Flow (TASK-008).
- Acciones reales de crear/exportar.
- Dark mode.
- Tailwind/shadcn.

## Archivos / módulos afectados

- `src/app/App.tsx`, `src/app/styles/tokens.css`, `globals.css`
- `src/editor/components/shell/*`
- tests y `e2e/shell-layout.spec.ts` (o similar)
- baselines versionados

## Cambios esperados

Layout estable, tab order lógico, foco visible, sin overflow del documento.

## Restricciones

Tema claro único. Controles deshabilitados explican por qué (`aria-disabled` + título).

## Criterios de aceptación

- [ ] Landmarks: banner, navigation (paleta), main, complementary (inspector), status.
- [ ] Tres viewports desktop sin rotura grave.
- [ ] Screenshot baselines revisados e intencionales.

## Tests

RTL landmarks/nombres. Playwright visual del shell.

## Comandos de verificación

```bash
npm run test -- src/editor/components/shell
npm run test:e2e -- --project=chromium
npm run check
```

## Stop conditions

- Añadir kit UI o dark mode.

## Definition of Done

UX shell sin funcionalidad falsa que simule persistencia o export reales. Baselines versionados.
