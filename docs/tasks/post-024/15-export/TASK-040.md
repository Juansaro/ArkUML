# TASK-040: Copiar imagen del diagrama al portapapeles

## Estado documental

Lista

## Objetivo

Copiar al portapapeles una imagen del diagrama **completo**, con los mismos
techos y la degradación 2x→1x que FR-12, sin cambiar el pin de
`html-to-image`.

## Prioridad

P1

## Dependencias

TASK-037

## Contexto obligatorio

- @docs/product/post-mvp-spec.md
- @docs/product/mvp-spec.md
- @docs/architecture/rendering-and-export.md
- @docs/architecture/performance.md
- @docs/decisions/ADR-006-export.md
- @docs/architecture/schema-evolution.md
- @.cursor/rules/testing.mdc

## Estado inicial

Wave 2 congelada: este archivo es W15-03 / FR-P05. `exportDiagram` ya
produce PNG/JPG (alpha / fondo blanco 0.92) a 1x/2x con límites 4096 px /
16 MP y filtro de chrome. El diálogo **Exportar** descarga archivos.
Markers Safari: limitación aceptada (TASK-029). Pin
`html-to-image@1.11.11`.

## Dentro del alcance

- Acción **Copiar** en el diálogo Exportar existente (mismo formato y
  escala ya elegidos). No hay botón nuevo en la top bar ni icono nuevo.
- Reutilizar `exportDiagram` (bounds, filtro, `toCanvas`, techos). No un
  segundo rasterizer. El viewport visible no cambia.
- Portapapeles: `ClipboardItem` con el Blob. PNG → `image/png`. JPG →
  `image/jpeg` si el navegador lo acepta; si no, copiar PNG del mismo
  raster (no fallar en silencio).
- Si 2x no cabe, la misma sugerencia 1x que FR-12; no copiar un canvas
  ilegal.
- Permiso denegado o API ausente: mensaje visible
  «No se pudo copiar la imagen.» El usuario sigue pudiendo descargar.
  No reabrir ADR-006.
- Éxito: anuncio breve (mismo canal `aria-live` que guardar), no toast
  persistente. Bloquear doble click durante el raster (como descarga).
- La imagen copiada **no** incluye chrome (mismos filtros que PNG/JPG).
- Markers Safari: misma limitación aceptada; no workaround.

## Fuera del alcance

- PDF, SVG persistido, cambiar el pin, `toDataURL` como archivo final.
- Reabrir ADR-006. JSON de usuario (TASK-038). Minimap (TASK-039).
- Copiar nodos UML al clipboard (formato interno). Paquetes nuevos.

## Archivos / módulos afectados

- `src/export/` (helper de clipboard sobre el Blob de `exportDiagram`)
- `src/editor/components/ExportDialog.tsx` y tests
- `src/export/exportDiagram.test.ts` si el helper vive ahí
- E2E Chromium con permiso de clipboard (no exigir Safari nativo)
- `docs/tasks/post-024/15-export/TASK-040.md`
- `docs/tasks/post-024/README.md` (estado/evidencia)

## Cambios esperados

En Exportar, «Copiar» deja una imagen pegable en otra app. Descargar sigue
igual. Schema `1` intacto.

## Restricciones

- Pin `html-to-image@1.11.11` intacto.
- No mutar zoom del usuario. No capturar la pantalla del SO.
- `src/domain` no cambia.

## Criterios de aceptación

- [ ] Copiar PNG 1x escribe `image/png` en el clipboard (test con mock o
      permiso Playwright).
- [ ] Copiar usa el mismo bounding box + padding 32 y el mismo filtro de
      chrome que descargar.
- [ ] 2x que excede 4096/16 MP no copia a esa escala; la UI sugiere 1x.
- [ ] Permiso denegado: mensaje visible; el documento no cambia.
- [ ] El diálogo no añade chrome al raster.
- [ ] Schema `1` / round-trip de workspace sin claves nuevas.

## Tests

Unidad del helper con `clipboard.write` mockeado (éxito, rechazo, JPG→PNG
fallback). ExportDialog: Copiar no descarga archivo. E2E Chromium con
`clipboard-write` si es estable; si el harness no puede leer el clipboard,
el mock de unidad cubre el Blob y el E2E cubre el click + anuncio.

## Comandos de verificación

```bash
npm run test -- src/export src/editor/components/ExportDialog.test.tsx
npm run check
```

Si hay E2E de clipboard, ejecutarlo con `--project=chromium`. `npm run
check` al cierre.

## Stop conditions

- Fallo nuevo de raster que pida reabrir ADR-006 o subir el pin.
- Se pide SVG/PDF «ya que hay Blob».
- Se pide copiar el modelo UML (JSON interno) en vez de la imagen.

## Definition of Done

FR-P05 observable; pin y ADR-006 intactos; criterios `[x]` con evidencia.

## Evidencia de cierre

Pendiente.
