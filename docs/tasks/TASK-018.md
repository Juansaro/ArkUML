# TASK-018: Suite E2E crítica y regresión visual

## Objetivo

Cubrir en navegador los recorridos que jsdom no valida, de forma estable.

## Prioridad

P0

## Dependencias

TASK-017

## Contexto obligatorio

- @docs/architecture/testing-strategy.md
- @docs/product/mvp-spec.md

## Estado inicial

Flujos implementados; E2E dispersos.

## Dentro del alcance

- Un spec de flujo usuario: abrir, crear actor/caso, asociar, mover, renombrar, include, zoom, undo, borrar, exportar.
- Specs de invalidación de conexión y persistencia (reload, nuevo).
- Una regresión visual del diagrama de referencia (viewport/fuentes fijos).
- Locators estables; sin sleeps.
- Trace/screenshot/video solo en fallo.
- Chromium suite completa; Firefox/WebKit `@smoke`.
- Estabilizar 3 ejecuciones consecutivas Chromium.

## Fuera del alcance

- Duplicar toda la matriz UML en E2E.
- Actualizar baselines automáticamente.
- Afirmar internals de React Flow si el bounding box basta.

## Archivos / módulos afectados

- `e2e/editor-flow.spec.ts`
- `e2e/relationships.spec.ts`, `persistence.spec.ts`, `export.spec.ts`, `visual.spec.ts`
- baselines `__screenshots__`

## Cambios esperados

Tags `@smoke` `@export` `@a11y` coherentes.

## Restricciones

No flaky conocido al cerrar la TASK.

## Criterios de aceptación

- [ ] `--repeat-each=3` Chromium verde.
- [ ] Smokes verdes en tres browsers.
- [ ] Descargas y drag usan APIs Playwright.

## Tests

Los E2E listados. Cross-browser smoke.

## Comandos de verificación

```bash
npm run test:e2e -- --project=chromium --repeat-each=3
npm run test:e2e -- --grep @smoke
npm run check
```

## Stop conditions

- Flake que se «arregla» con timeout fijo.

## Definition of Done

Baselines revisados. Matriz nivel-de-test no contradice testing-strategy.md.
