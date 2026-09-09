# Rendimiento

Números del escenario NFR-02/NFR-03/NFR-04. No sustituyen la spec de producto.
Los umbrales `@perf` de CI **no son SLO**: son smokes holgados para máquinas
heterogéneas. Los objetivos de spec se contrastan **aquí**, en la máquina de
referencia, con `--workers=1`.

## Máquina de referencia

| Campo | Valor |
| --- | --- |
| Fecha | 2026-09-09 (TASK-029; misma máquina que TASK-019 el 2026-09-08) |
| OS | Windows 11 25H2 |
| CPU | AMD Ryzen 7 7800X3D (8 núcleos / 16 hilos, 4.2 GHz) |
| RAM | 32 GB |
| Navegador | Playwright 1.63 Chromium (proyecto `chromium`, Desktop Chrome) |
| Cómo repetir (números de esta página) | `npx playwright test --project=chromium --workers=1 e2e/performance.spec.ts` |
| Smoke CI / paralelo | `npm run test:e2e -- --grep @perf --project=chromium` (workers por defecto) |

El smoke `@perf` usa umbrales amplios (restore `<15 s`, click `<2 s`, export 2x
`<30 s`, export 1x de estrés `<60 s`) para no fallar en CI heterogéneo. Un
resultado paralelo por encima del objetivo de spec **no** incumple NFR-03/04.

## Escenario objetivo 100/150

Fixture determinista: `e2e/fixtures/perf-target.json` (30 actores, 69 casos, 1
boundary, 150 relaciones). Viewport persistido `{ x: 220, y: 40, zoom: 0.5 }`.
Raster 2x: `3456 × 3936` px (13.6 MP), dentro de 4096 / 16 MP.

| Medida | Objetivo spec | Medido (aislado, 2026-09-09) | ¿Cumple? |
| --- | --- | --- | --- |
| Restore (goto → 100 nodos) | `<=1 s` | 397 ms | Sí |
| Click / selección visible | `<=100 ms` | 22 ms | Sí |
| Drag p95 frame | `<=33 ms` | 17 ms (25 frames, max 17 ms) | Sí |
| Pan p95 frame | `<=33 ms` | 17 ms | Sí |
| Zoom p95 frame | `<=33 ms` | 17 ms | Sí |
| Autosave tras mutación | — | 372 ms hasta `updatedAt` en storage (debounce 750 ms ya cubierto por gestos previos) | Sí |
| Export PNG 2x | `<=3 s` | 1915 ms | Sí |

Misma sesión en paralelo (3 workers): restore 812 ms, export 2x 3226 ms. Eso
explica el umbral CI de 30 s; no se usa como SLO.

No crash. Estrés 200/300 en la misma corrida aislada: restore 386 ms, drag sin
error de página.

## Tamaño JSON / snapshot

`JSON.stringify` compacto del `WorkspaceSnapshot` (lo que escribe
`localStorage`). Estimación UTF-16 = `length × 2` (JSON ASCII). Cuota típica
~5 MiB por origen. Umbral de migración a IndexedDB: acercarse a 1 MiB de
forma habitual ([ADR-004](../decisions/ADR-004-persistence.md)).

| Escenario | UTF-8 compacto | UTF-16 (localStorage) | vs 1 MiB | vs 5 MiB |
| --- | --- | --- | --- | --- |
| 100/150 | 48646 B (~47.5 KiB) | ~95 KiB | ~9 % | ~2 % |
| 200/300 | 97794 B (~95.5 KiB) | ~191 KiB | ~19 % | ~4 % |

El historial (máximo 100 snapshots de `DiagramDocument`) **no** se persiste.
Equivalente serializado de 100 copias del documento 100/150: ~4.6 MiB UTF-8 /
~9.3 MiB si se contara UTF-16; vive en RAM. No dispara cuota de
`localStorage`. IndexedDB sigue fuera de alcance.

Guardia reproducible: `src/test/performanceFixture.test.ts` (UTF-16 del
snapshot `< 256 KiB`).

## Optimizaciones aplicadas (cuellos vistos)

Perfil: remap completo en cada frame de drag; 100 suscripciones Zustand en
`InlineNameEditor`; `find` O(n) por arista; `onNodesChange` ignoraba
`type: "select"` (el click no llegaba al store en 100/150); hit-area de 24 px
de 150 edges tapaba el lienzo.

- Mapper con cache de proyección, reuso de nodos/edges no tocados y overlay de
  selección/edición.
- Selectores de selección e `editingElementId` separados; el canvas no se
  suscribe al objeto `selection` entero.
- `editing` via `node.data`; sin listener Zustand por nodo.
- `NodeHandles` memoizado; `nodeTypes` / `edgeTypes` siguen a nivel de módulo.
- Aplicar cambios `select` de React Flow al store (el camino que RF 12 usa en
  el escenario grande).

Historial y autosave ya se comprometen en `dragStop` / `resizeEnd`.
Inspector/paleta ya se suscriben a flags e IDs. No se tocó el motor.

## Estrés 200/300

Fixture `e2e/fixtures/perf-stress.json`. Restore y un drag completan sin
crash. Más lento y más denso; usable según NFR-02. NFR-03/04 **no** aplican
aquí.

Export PNG 2x **no cabe** en el techo 4096 px / 16 MP: raster teórico
`4864 × 6496` px (31.6 MP). La UI muestra el aviso «Prueba 1x» y deshabilita
Descargar. 1x sí cabe: `2432 × 3248` px (7.9 MP). Medido aislado 2026-09-09:
PNG 1x **3280 ms** (firma PNG, `>32` bytes). Spec de 2x `<=3 s` no aplica a
este fixture.

Reproducible: test `@perf` `200/300: PNG 2x no cabe; 1x descarga` y unitario
de bounds en `performanceFixture.test.ts`.

## Riesgos restantes

- Sin virtualización, Canvas ni WebGL. El presupuesto 100/150 se cumple en
  esta máquina; un perfil que lo incumpla debe documentarse antes de cambiar
  de motor (ADR-002). Contingencia: roadmap C-PERF, no esta TASK.
- `interactionWidth` 24 px (`EDGE_INTERACTION_WIDTH`) cubre mucho lienzo con
  150–300 edges. Playwright (hit-test / locator sobre el path de interacción)
  puede ver el edge encima del nodo; el gesto de **ratón real** sobre el actor
  sigue seleccionando. El click `@perf` usa `page.mouse` en la figura, no
  `locator.click()`. No es un fallo de producto ni motivo para bajar el hit
  area sin un miss-click medido con ratón.
- Export 2x de 100/150 a ~1.9 s aislado deja poco margen en portátiles más
  lentos. En paralelo de CI puede superar 3 s: eso no es SLO.
- Cache del mapper a nivel de módulo: un solo documento activo (MVP).
- Safari/WebKit: `marker-end` intermitente aceptado como limitación de
  producto (TASK-029); ADR-006 no reabierto. Ver
  [rendering-and-export.md](rendering-and-export.md).
