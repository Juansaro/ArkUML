# TASK-052: Schema 3 y dominio de clases

## Estado documental

Hecha

## Objetivo

El dominio acepta `schemaVersion` 3: `document.kind` incluye `"class"`,
`migrateDocument` `2→3`, operaciones puras del subconjunto de clases, y
el envelope público `arkuml-document-json` / `formatVersion` 3. Sin UI.

## Prioridad

P0

## Dependencias

TASK-051

## Contexto obligatorio

- @docs/architecture/class-model.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/domain-model.md
- @docs/architecture/diagram-kinds.md
- @docs/product/mvp-spec.md
- @docs/product/post-mvp-spec.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

Release 2 congelada. `src/domain` habla schema `2` / `"use-case" |
"sequence"`. Envelope público `formatVersion` 2. La forma persistida de
clases está cerrada en `class-model.md`.

## Dentro del alcance

- `schemaVersion: 3` en `DiagramDocument`. Unión de `kind` **aditiva**:
  `"use-case" | "sequence" | "class"`. Otros kinds de Release 2 aún no.
- Elementos y relaciones de casos de uso y secuencia **sin cambio
  semántico**.
- Tipos, factories, reglas, operaciones y Zod de clases según
  `class-model.md`.
- Un documento no mezcla kinds ajenos a su `document.kind`.
- `migrateDocument` `2→3`: copia el documento 2, escribe
  `schemaVersion: 3`, no altera elementos. Encadenable tras `1→2`.
- Envelope `formatVersion` 3: mismo `format` `arkuml-document-json`;
  payload schema 3 (`use-case | sequence | class`). Importar 1.x/2.x
  via `migrate()` y **añadir**. Rechazar `kind` aún no en la unión.
- `createEmptyClassDocument()` según el documento vacío del modelo.
- Tests de dominio. `src/domain` no importa React, DOM ni xyflow.

## Fuera del alcance

- Paleta, nodos, mapper, Nuevo «Clases» (TASK-053).
- Componentes, despliegue, ER, actividades, IOD.
- Interfaces, visibilidad, association class, plantillas.
- Reabrir ADR-002 como segundo motor. Paquetes nuevos. IndexedDB.

## Archivos / módulos afectados

- `src/domain/diagram/schema.ts` y tests
- `src/domain/diagram/factories.ts` y tests
- `src/domain/diagram/operations.ts` / `rules.ts` / `validation.ts` y tests
- `src/domain/diagram/migrate.ts` y tests
- `src/domain/diagram/documentFile.ts` y tests
- `docs/architecture/domain-model.md` (unión 3.0 clases)
- `docs/tasks/post-024/12-uml/TASK-052.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Un JSON schema 2 migra a 3 y valida. Un documento clases se construye
en tests sin React. El parser 3 rechaza `component` y mezclas.

## Restricciones

- TypeScript `strict`. Zod `strictObject`. Pins intactos.
- No persistir chrome ni objetos de React Flow.

## Criterios de aceptación

- [x] `migrateDocument` `2→3` es puro y el resultado pasa Zod 3.
- [x] `use-case` y `sequence` schema 3 conservan la matriz ya shipped.
- [x] Documento `class`: create/rename/move/delete; miembros;
      asociación/agregación/composición/generalization; self ilegal;
      cascada al borrar clase; multiplicidades del enum.
- [x] Mezclar actor en un documento class (o `class` en use-case) falla
      cerrado.
- [x] Archivo `formatVersion` 3 round-trip del documento activo class;
      2.x sigue importable.
- [x] `src/domain` sin imports de UI.

## Tests

- Migración 2→3 de use-case y sequence.
- Factory de clases vacía; `canConnect`; rechazo de kind futuro.

## Comandos de verificación

```bash
npx vitest run src/domain
npx tsc -b --pretty false
```

## Stop conditions

- Se pide pintar el lienzo o listar Clases en Nuevo.
- Se pide un kind de clase fuera de `class-model.md`.
- Se pide cambiar la matriz de casos de uso o secuencia.

## Definition of Done

Dominio schema 3 + clases testeados; sin chrome de clases.

## Evidencia de cierre

2026-09-14. Dominio schema 3 + clases. `migrateDocument` encadena
`1→2→3`; `2→3` copia el documento, escribe `schemaVersion: 3` y no
altera elementos. Unión `"use-case" | "sequence" | "class"`. Parser 3
rechaza `component` y mezclas (`UNKNOWN_KIND`). Matriz MVP de casos de
uso y secuencia intacta. Clases: `class` / `class-association` /
`aggregation` / `composition` / `generalization`; self ilegal; duplicados
permitidos; cascada al borrar clase; multiplicidades
`"0..1"|"1"|"0..*"|"1..*"`; `setClassMembers`; `createEmptyClassDocument()`.
Envelope `arkuml-document-json` / `formatVersion` 3; 1.x y 2.x importan
vía `migrate()`. `storageVersion` sigue 2; `migrateWorkspace` sube
documentos schema 2 de una biblioteca 2.0. Sin paleta ni nodos de clases
(TASK-053).

Comandos: `npx vitest run src/domain` (147 tests) y
`npx tsc -b --pretty false`: app limpia; fallos previos en
`e2e/include-extend.spec.ts` (`SVGPathElement` / `DOMPoint` sin DOM
en `tsconfig.node.json`) — sucio anterior, no tocado.
