# TASK-026: Re-signoff RC posterior a la identidad

## Estado documental

Hecha

## Objetivo

Firmar de nuevo el checklist RC contra el producto **después** de TASK-024,
con evidencia humana y E2E relevante, sin añadir capacidades UML.

## Prioridad

P0

## Dependencias

TASK-024, TASK-025

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/architecture/testing-strategy.md
- @docs/product/brand-system.md
- @README.md (checklist manual RC y limitaciones)
- @docs/tasks/TASK-021.md
- @docs/tasks/TASK-024.md
- @docs/tasks/post-024/README.md

## Estado inicial

TASK-021 documenta gestos, visor PNG/JPG y smokes Firefox/Safari que el pase
MCP de TASK-020 no firmó. TASK-024 cambia chrome, iconos, tooltips, favicon y
baselines. El README declara RC; el gate de fase 8 pide checklist firmado. Los
nodos del lienzo no son clicables vía árbol a11y (limitación publicada).

## Dentro del alcance

- Recorrer el checklist README (arranque, UX, viewport, export, a11y, teclado,
  persistencia) en Chrome o Edge `>=1024×720` contra `npm run preview`.
- Firmar pan (Space+drag o botón medio), reparent y resize del boundary con
  ratón real o Playwright `--headed`.
- Abrir PNG 1x y JPG 1x en un visor del SO (transparencia vs fondo blanco).
- Smoke (arranque, un actor, export PNG, recarga) en Firefox actual y Safari
  `>=16.4`.
- Verificar nombres accesibles, drawers ~768–1023 px, aviso `<768` px y que
  tooltips de chrome no rompen teclado ni Escape de diálogos.
- Versionar en README o handoff: fecha, browsers, qué se pulsó, qué falló.
- Actualizar el índice post-024 a `Hecha` o `Bloqueada`.

## Fuera del alcance

- Implementar TASK-024 si aún no está hecha.
- SR del grafo React Flow, PDF, hosting, temas.
- Cambiar el job CI `windows-latest` ni rehacer el dominio.
- Reabrir ADR-006 salvo que un fallo nuevo de export lo exija (stop).

## Archivos / módulos afectados

- `README.md` (checklist / limitaciones / evidencia de firma)
- `docs/tasks/post-024/README.md`
- `docs/tasks/post-024/10-release/TASK-026.md`
- opcional: `e2e/shell-layout.spec.ts`, `e2e/accessibility.spec.ts` si un
  locator estable se rompe por chrome

## Cambios esperados

El checklist deja de ser una lista sin dueño: hay fecha, browsers y resultado.
Las limitaciones de canvas, Safari markers y `<768` px siguen publicadas si
siguen siendo ciertas.

## Restricciones

- Chrome DevTools MCP no sustituye ratón real para pan/reparent/resize.
- Baselines visuales: Windows, Chromium, Segoe UI.
- No afirmar tests no corridos. No inventar copy de dominio.

## Criterios de aceptación

- [x] Checklist RC recorrido y firmado (fecha, browsers, resultado).
- [x] Pan, reparent y resize comprobados en preview.
- [x] PNG 1x transparente y JPG 1x opaco blanco abiertos en visor.
- [x] Smoke Firefox y Safari `>=16.4` sin pérdida al recargar.
- [x] Huecos de TASK-021 cubiertos o desviación explícita.
- [x] Índice post-024 actualizado.

## Tests

Playwright Chromium de shell/a11y si el chrome cambió. El valor principal es
el pase manual documentado.

## Comandos de verificación

```bash
npm run build
npm run preview
npm run test:e2e -- --project=chromium --grep "reparent|exportación|pan|a11y|shell"
```

## Stop conditions

- TASK-024 no tiene evidencia de cierre.
- Reescribir hit-testing del canvas «para que el agente clique nodos».
- Un fallo de export nuevo y material en un browser soportado (reabrir ADR-006).

## Definition of Done

Checklist firmado post-identidad; limitaciones honestas; índice actualizado.

## Evidencia de cierre

2026-09-09. Criterios `[x]`. Host: Windows 10. Preview:
`http://127.0.0.1:4173/` tras `npm run build`.

Browsers:

- Chrome 152, 1024×720: checklist de chrome (arranque «—», paleta+inspector,
  association/include/extend, include reflexivo con razón y sin mutar, zoom
  120 % / fit 58 %, Nuevo cancelar/confirmar, Ctrl+Z/Y/D/S/0, Delete, drawers
  800 px, aviso 500 px, tooltips y Escape de Ayuda). Recarga conservó actor,
  casos, include/extend y viewport.
- Playwright Chromium 153: pan (botón medio), reparent entrar/salir,
  resize ≥320×240, exportación, a11y, shell, tooltips, persistencia
  (incluido storage bloqueado). No `--headed`; los gestos son `page.mouse`,
  no MCP. Chrome DevTools MCP no clicó nodos.
- Playwright Firefox 155: `@smoke` + PNG 1x `@export-spike` (5 pass).
- Playwright WebKit 26.6: mismo smoke (5 pass). Desviación: no hay Safari.app
  en Windows; WebKit es el stand-in NFR-01 `>=16.4` (igual que CI).

Export visor: `rc-026-1x.png` esquinas `a=0`; `rc-026-1x.jpg` esquinas
`255,255,255,255`; PNG 2x 1408×928; zoom visible 100 % tras descargar.
Archivos abiertos con el visor predeterminado de Windows. No versionados.

Huecos TASK-021: cubiertos con la desviación Safari nativo arriba. Limitaciones
de canvas, markers Safari y `<768` px siguen publicadas.

Locator de chrome: `e2e/create-elements.spec.ts` pasó de `title` a tooltip y
a Escape×2 para cancelar herramienta (contrato TASK-024).

Comandos: `npm run build`; `npm run preview -- --host 127.0.0.1 --port 4173
--strictPort`; `npx playwright test --project=chromium --grep
"reparent|exportación|pan|a11y|shell"` (20 pass); `npx playwright test
e2e/tooltips.spec.ts --project=chromium` (6 pass);
`npx playwright test --project=firefox --project=webkit` (10 pass);
`npx playwright test e2e/create-elements.spec.ts --project=chromium` (pass);
`npx playwright test e2e/persistence.spec.ts --project=chromium` (4 pass);
`npx playwright test e2e/shortcuts-toolbar.spec.ts e2e/selection-rename.spec.ts
--project=chromium` (6 pass, flechas/duplicar/borrar).
E2E local usa `npm run dev` (playwright.config) salvo
`CI=true` contra preview `:5173` para pan/reparent/resize/PNG/JPG 1x (5 pass).
El pase humano fue contra `dist/` en `:4173`. Nada de producto falló.
