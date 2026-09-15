# TASK-050: Envelope de archivo 2.x

## Estado documental

Hecha

## Objetivo

El usuario descarga y abre el documento **activo** con el envelope
`arkuml-document-json` / `formatVersion` 2 (schema 2, use-case o
secuencia). Importar **añade** a la biblioteca. Los archivos 1.x
`arkuml-usecase-json` siguen abriéndose vía `migrate()`.

## Prioridad

P0

## Dependencias

TASK-049

## Contexto obligatorio

- @docs/architecture/schema-evolution.md
- @docs/architecture/sequence-model.md
- @docs/decisions/ADR-007-workspace-library.md
- @docs/decisions/ADR-004-persistence.md
- @docs/product/post-mvp-spec.md
- @docs/product/brand-system.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

FR-P03 en 1.x usa `arkuml-usecase-json` / `formatVersion` 1 y **sustituye**
el único documento. Release 1 ya tiene biblioteca y secuencia. El
identificador 1.x **no** se reutiliza para secuencia.

## Dentro del alcance

- Envelope público:

  ```text
  { format: "arkuml-document-json", formatVersion: 2,
    document: DiagramDocument,  // schemaVersion 2
    view: { x, y, zoom } }
  ```

- Exportar: documento activo + su viewport. Nombre: título saneado +
  `.arkuml.json`. No serializar la biblioteca ni el historial.
- Importar `arkuml-document-json` v2: validar → `migrate` si hiciera
  falta (no debería si ya es 2) → **añadir** a `documents` y activar.
  Sin confirmación FR-11 (no se destruye el anterior).
- Importar `arkuml-usecase-json` v1: parsear con el contrato 1.x →
  `migrateDocument` 1→2 → añadir y activar.
- Rechazo (no se escribe): JSON inválido; `format` desconocido;
  `formatVersion` no soportado; schema/storage de más; claves de más;
  `kind` desconocido; mezcla de kinds. Copy: «El archivo no es un
  documento ArkUML válido.» Un blob de localStorage no es archivo
  público.
- No reutilizar `arkuml-usecase-json` para secuencia (un archivo v1 con
  `kind: "sequence"` es inválido).
- Tests de `documentFile` + E2E round-trip use-case y secuencia.
- Dominio puro para el envelope; sin DOM.

## Fuera del alcance

- Exportar la biblioteca entera como un zip o un array.
- IndexedDB. SVG/PDF. Cambiar iconos de Abrir/Guardar JSON.
- Clases u otros kinds.

## Archivos / módulos afectados

- `src/domain/diagram/documentFile.ts` y tests
- store de import (añadir vs sustituir)
- E2E de archivo
- `docs/architecture/schema-evolution.md` si el contrato de I/O 2.x
  necesita el párrafo de implementación (ya nombrado en el freeze)
- `docs/tasks/post-024/14-persistence/TASK-050.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Guardar un secuencia y reabrirlo lo añade y lo deja editable. Un JSON
1.x de casos de uso sigue abriendo. Un 1.0 no entiende los archivos 2.x.

## Restricciones

- Zod estricto.
- Autosave interno intacto (sigue siendo el snapshot v2, no el archivo).
- Sin paquetes nuevos.

## Criterios de aceptación

- [x] Export 2.x del activo use-case y del activo sequence.
- [x] Import 2.x añade y activa; el otro documento sigue en la lista.
- [x] Import 1.x `arkuml-usecase-json` migra y añade.
- [x] Secuencia en envelope v1 se rechaza.
- [x] Snapshot de localStorage abierto como archivo se rechaza.

## Tests

- Unit del envelope (válido, rechazo, migrate 1.x).
- E2E round-trip.

## Comandos de verificación

```bash
npx vitest run src/domain/diagram/documentFile.test.ts
npx playwright test e2e/document-file.spec.ts --project=chromium
npx tsc -b --pretty false
```

Extender el spec E2E existente; no borrar casos 1.x, migrarlos.

## Stop conditions

- Se pide un formato que liste toda la biblioteca.
- Se pide reutilizar `arkuml-usecase-json` para secuencia.
- Se pide IndexedDB.

## Definition of Done

I/O de archivo 2.x cerrado; 1.x de casos de uso sigue importable.

## Evidencia de cierre

2026-09-14. Envelope público 2.x `arkuml-document-json` / `formatVersion`
2 / payload schema 2 (use-case o secuencia). Exporta el documento
activo y su viewport; nombre título saneado + `.arkuml.json`; no
serializa biblioteca ni historial. Importar valida con Zod estricto,
migra 1.x `arkuml-usecase-json` vía `migrateDocument` 1→2 y **añade**
a la biblioteca (sin confirmación FR-11). Secuencia en envelope v1,
JSON inválido, format desconocido, claves de más, mezcla de kinds y
un blob de localStorage se rechazan con «El archivo no es un documento
ArkUML válido.» Autosave interno intacto (snapshot v2). Dominio puro;
sin DOM ni paquetes nuevos.

Comandos: `npx vitest run src/domain/diagram/documentFile.test.ts`
(más store/shell/persistence: 372 passed en `src/editor src/domain
src/persistence`). `npx playwright test e2e/document-file.spec.ts
--project=chromium` (5 passed). `npx tsc -b --pretty false`: app
limpia; fallos previos en `e2e/include-extend.spec.ts`
(`SVGPathElement` / `DOMPoint` sin DOM en `tsconfig.node.json`) —
sucio anterior, no tocado.

Desviación: si el `id` del archivo ya está en la biblioteca se asigna
uno nuevo para poder añadir sin destruir el anterior (ADR-007: ids
únicos).
