# Estrategia de testing

Pirámide estricta: la lógica UML vive en unit tests; el editor gráfico se prueba en navegador real. React Flow mide nodos en el DOM; jsdom **no** es suficiente para edges reales, drag de canvas ni exportación.

## Niveles

| Nivel | Herramienta | Qué cubre | Qué no cubre |
| --- | --- | --- | --- |
| Unit | Vitest | Schema, reglas, operaciones, historial, mapper puro, bounds, autosave con fake storage | Píxeles, medición real de React Flow |
| Integration | Vitest + Testing Library + jsdom | Store + chrome UI, inspector, shortcuts no gráficos, validación visible | Drag del canvas, exportación, layout SVG |
| E2E Chromium | Playwright | Flujo de usuario, drag, conexiones, reload, export, a11y de chrome | Toda la matriz UML ya cubierta en unit |
| E2E Firefox / WebKit | Playwright | Smokes críticos + spike/export | Suite completa en cada iteración local |
| Visual | Playwright screenshots | Un diagrama de referencia y layout de shell en viewports fijos | Snapshot de cada componente |
| Manual | Navegador | Fluidez, zoom 200 %, archivos exportados abiertos, teclado real | Sustituir aserciones automatizadas |

## Cobertura orientada a riesgo

Objetivo en dominio (`src/domain`): `>=90 %` líneas y `>=85 %` ramas, medido en TASK-004/005.

No perseguir 100 % de UI. Cubrir caminos de error de persistencia y exportación.

## E2E críticos de release

1. Abrir limpio; crear actor y caso de uso.
2. Association válida e intento inválido (mensaje, sin mutación).
3. Mover, renombrar; Include y Extend.
4. Resize/reparent de boundary.
5. Eliminar, undo, redo; duplicar.
6. Zoom, pan, fit.
7. Reload conserva documento y viewport.
8. Nuevo diagrama: cancelar conserva; confirmar resetea.
9. Storage corrupto o cuota: no destruye el trabajo en memoria; acción recuperable.
10. PNG y JPG: descarga con MIME, firma, tamaño `>0` y dimensiones esperadas.
11. Keyboard-only básico y axe sin critical/serious en estados cubiertos.
12. Sin errores de página en consola en el flujo feliz.

## Convenciones Playwright

- Locators por `role`, nombre accesible o `data-testid` estable. Prohibido CSS estructural frágil (`div > div > span`).
- Prohibido `waitForTimeout`. Usar aserciones web-first.
- Drag: `locator.dragTo` o mouse de bajo nivel cuando haga falta trayectoria. Si el page usa `dragover`, repetir el hover destino.
- Descargas: `page.waitForEvent("download")` **antes** del click; comprobar `suggestedFilename`, guardar, leer bytes (PNG `89 50 4E 47`, JPEG `FF D8`).
- Screenshots: viewport, fuentes y `deviceScaleFactor` fijos. Baselines en `e2e/**/__screenshots__/` **versionados**. Actualizar solo con inspección humana.
- Trace, video y screenshot de fallo: solo `on-first-retry` / `retain-on-failure`. Salida en `test-results/` y `playwright-report/` **ignorados**.
- Tags: `@smoke`, `@a11y`, `@export`, `@export-spike`, `@perf`.
- Chromium: suite completa. Firefox/WebKit: `@smoke` y `@export-spike`.
- CI y baselines visuales deben coincidir de SO; no mezclar capturas Windows locales con Linux CI sin política explícita. Hasta TASK-020, documentar el SO de los baselines.

## Unit / integration

- Sin `any` para «hacer pasar» tests.
- Fake timers para debounce de autosave.
- Store: instancias aisladas; reset entre tests.
- No mockear el dominio entero para probar el dominio.

## Artefactos

Versionar:

- `src/**/*.test.{ts,tsx}`
- `e2e/**/*.spec.ts`
- `e2e/**/__screenshots__/` revisados
- fixtures deterministas

Ignorar: ver [`.gitignore`](../../.gitignore).

## Comando de calidad

`npm run check` (TASK-002): format → lint → typecheck → unit → build, en ese orden. E2E es comando aparte (`test:e2e`).
