# Rendimiento

Números del escenario NFR-02/NFR-03/NFR-04. No sustituyen la spec de producto.

## Máquina de referencia

| Campo | Valor |
| --- | --- |
| Fecha | 2026-09-08 |
| OS | Windows 11 25H2 |
| CPU | AMD Ryzen 7 7800X3D (8 núcleos / 16 hilos, 4.2 GHz) |
| RAM | 32 GB |
| Navegador | Playwright 1.63 Chromium (proyecto `chromium`, Desktop Chrome) |
| Cómo repetir | `npm run test:e2e -- --grep @perf --project=chromium` |

El smoke `@perf` usa umbrales amplios (restore `<15 s`, click `<2 s`, export 2x `<30 s`) para no fallar en CI heterogéneo. Los objetivos de spec se contrastan aquí, no en el runner.

## Escenario objetivo 100/150

Fixture determinista: `e2e/fixtures/perf-target.json` (30 actores, 69 casos, 1 boundary, 150 relaciones). Viewport persistido `{ x: 220, y: 40, zoom: 0.5 }`.

| Medida | Objetivo spec | Medido | ¿Cumple? |
| --- | --- | --- | --- |
| Restore (goto → 100 nodos) | `<=1 s` | 469 ms | Sí |
| Click / selección visible | `<=100 ms` | 17 ms | Sí |
| Drag p95 frame | `<=33 ms` | 17 ms (26 frames, max 17 ms) | Sí |
| Pan p95 frame | `<=33 ms` | 17 ms | Sí |
| Zoom p95 frame | `<=33 ms` | 17 ms | Sí |
| Autosave tras mutación | — | 383 ms hasta `updatedAt` en storage (debounce 750 ms ya cubierto por gestos previos) | Sí |
| Export PNG 2x | `<=3 s` | 2034 ms (aislado `@perf`); hasta ~2.9 s en la suite paralela | Sí |

No crash. Estrés 200/300 en la misma corrida: restore 569 ms, drag sin error de página.

## Optimizaciones aplicadas (cuellos vistos)

Perfil: remap completo en cada frame de drag; 100 suscripciones Zustand en `InlineNameEditor`; `find` O(n) por arista; `onNodesChange` ignoraba `type: "select"` (el click no llegaba al store en 100/150); hit-area de 24 px de 150 edges tapaba el lienzo.

- Mapper con cache de proyección, reuso de nodos/edges no tocados y overlay de selección/edición.
- Selectores de selección e `editingElementId` separados; el canvas no se suscribe al objeto `selection` entero.
- `editing` via `node.data`; sin listener Zustand por nodo.
- `NodeHandles` memoizado; `nodeTypes` / `edgeTypes` siguen a nivel de módulo.
- Aplicar cambios `select` de React Flow al store (el camino que RF 12 usa en el escenario grande).

Historial y autosave ya se comprometen en `dragStop` / `resizeEnd`. Inspector/paleta ya se suscriben a flags e IDs. No se tocó el motor.

## Estrés 200/300

Fixture `e2e/fixtures/perf-stress.json`. Restore y un drag completan sin crash. Más lento y más denso; no se midió export 2x (el bounding box puede acercarse al techo de canvas). Usable según NFR-02.

## Riesgos restantes

- Sin virtualización, Canvas ni WebGL. El presupuesto se cumple en esta máquina; un perfil que incumpla 100/150 debe documentarse antes de cambiar de motor (ADR-002).
- `interactionWidth` 24 px cubre mucho lienzo en 150 edges; Playwright puede ver el path de interacción encima del nodo. El gesto de ratón sobre el actor sigue seleccionando.
- Export 2x a ~2.0 s deja poco margen en portátiles más lentos o con 2x de un diagrama más extendido.
- Cache del mapper a nivel de módulo: un solo documento activo (MVP).
- Umbrales de CI deliberadamente holgados; no usarlos como SLO.
