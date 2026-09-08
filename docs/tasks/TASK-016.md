# TASK-016: Exportación PNG y JPG de producto

## Objetivo

Descargar el diagrama completo con calidad, sin chrome de edición y sin agotar memoria.

## Prioridad

P0

## Dependencias

TASK-014, TASK-015 (spike ya en TASK-008)

## Contexto obligatorio

- @docs/decisions/ADR-006-export.md
- @docs/architecture/rendering-and-export.md
- @docs/architecture/testing-strategy.md

## Estado inicial

Spike PNG funciona. No hay diálogo de usuario.

## Dentro del alcance

- Bounds de **todos** los elementos + padding 32; export transform sin cambiar viewport visible.
- Filtro: handles, selección, grid, controls, atribución, inspector, warnings de overlay.
- PNG 1x/2x alpha; JPG 1x/2x fondo blanco quality 0.92.
- `toCanvas` + `canvas.toBlob`; filename saneado.
- Límites 4096 / 16 MP; sugerir 1x si excede.
- Progreso, bloqueo doble click, revoke object URL.
- Errores de tamaño/rasterización reintentables.

## Fuera del alcance

- PDF, SVG, clipboard.
- Subir html-to-image por encima de 1.11.11.
- `toDataURL` como archivo final.
- Mutar zoom del usuario.

## Archivos / módulos afectados

- `src/export/exportDiagram.ts`, `bounds.ts`, `download.ts`
- `src/editor/components/ExportDialog.tsx`
- E2E `@export`

## Cambios esperados

Export incluye contenido fuera del viewport. JPG sin alpha.

## Restricciones

Fuentes locales. ADR-006.

## Criterios de aceptación

- [ ] PNG firma + transparencia fuera del dibujo.
- [ ] JPG firma JPEG, fondo opaco.
- [ ] Dimensiones coherentes con 1x/2x y límites.
- [ ] Chrome de editor ausente en el archivo.

## Tests

Unit bounds/escala/límites/nombres. E2E descarga MIME/firma/tamaño. Comparación visual manual 1x/2x.

## Comandos de verificación

```bash
npm run test -- src/export
npm run test:e2e -- --grep @export
npm run check
```

## Stop conditions

- Fallo nuevo cross-browser no visto en el spike.

## Definition of Done

Descargas verificadas. Object URLs liberadas. Limitaciones de navegador mencionadas en README o rendering-and-export.md si aplica.
