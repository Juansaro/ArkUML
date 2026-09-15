# TASK-046: Schema 2 y dominio de secuencia

## Estado documental

Hecha

## Objetivo

El dominio acepta `schemaVersion` 2: `document.kind` `"use-case" | "sequence"`,
`migrate()` de documento `1→2`, y las operaciones puras del subconjunto de
secuencia. Sin UI, sin persistir el envelope de workspace.

## Prioridad

P0

## Dependencias

TASK-045

## Contexto obligatorio

- @docs/architecture/sequence-model.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/domain-model.md
- @docs/architecture/diagram-kinds.md
- @docs/product/mvp-spec.md
- @docs/product/post-mvp-spec.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

Release 1 congelada. `src/domain` solo habla schema `1` / `use-case`.
No hay `migrate()`. La forma persistida de secuencia está cerrada en
`sequence-model.md`.

## Dentro del alcance

- `schemaVersion: 2` en `DiagramDocument`. Unión de `kind`.
- Elementos y relaciones de casos de uso **sin cambio semántico**.
- Tipos, factories, reglas, operaciones y Zod de secuencia según
  `sequence-model.md` (lifeline, `sync-message`, `reply-message`).
- Un documento no mezcla kinds de elemento/relación ajenos a su
  `document.kind` (`PARSE_INVALID` / `UNKNOWN_KIND`).
- `migrateDocument` `1→2`: copia el documento de casos de uso, escribe
  `schemaVersion: 2`, no altera elementos. Encadenable; sin saltos.
- `createEmptySequenceDocument()` según el documento vacío del modelo.
- Tests de dominio (Vitest, sin jsdom para lo puro). `src/domain` no
  importa React, DOM ni `@xyflow/react`.

## Fuera del alcance

- `WorkspaceSnapshot` storage `2`, clave de localStorage, autosave (TASK-047).
- Paleta, nodos, mapper, selector (TASK-048/049).
- Envelope de archivo 2.x (TASK-050).
- Fragmentos, async, activaciones, clases.
- Reabrir ADR-002. Paquetes nuevos.

## Archivos / módulos afectados

- `src/domain/diagram/schema.ts` y tests
- `src/domain/diagram/factories.ts` y tests
- `src/domain/diagram/operations.ts` / `rules.ts` / `validation.ts` y tests
- `src/domain/diagram/migrate.ts` (nuevo, o el nombre que ya exista vacío)
- `docs/architecture/domain-model.md` (unión 2.0; no reescribir casos de uso)
- `docs/tasks/post-024/12-uml/TASK-046.md`
- `docs/tasks/post-024/README.md` (estado/evidencia)

## Cambios esperados

Un JSON schema `1` de casos de uso migra a `2` y valida. Un documento
secuencia se puede construir y mutar en tests sin React. El parser 2
rechaza kinds desconocidos y mezclas.

## Restricciones

- TypeScript `strict`. Sin `any` injustificado.
- Zod `strictObject`.
- No persistir chrome ni objetos de React Flow.
- Pins intactos.

## Criterios de aceptación

- [x] `migrateDocument` `1→2` es puro, ordenado, y el resultado pasa Zod 2.
- [x] Documento `use-case` schema 2 conserva la matriz del MVP.
- [x] Documento `sequence`: create/rename/move/delete de lifelines y
      mensajes; self-message permitido; cascada al borrar lifeline.
- [x] `y` inválido al crear mensaje → `INVALID_GEOMETRY` (o el código
      cerrado en `sequence-model.md`).
- [x] Mezclar actor en un documento secuencia (o lifeline en use-case)
      falla cerrado.
- [x] `src/domain` sin imports de UI. `npm run check` de esta TASK no
      reformatea chrome ajeno; los tests nuevos pasan.

## Tests

- Migración 1→2 de un documento MVP típico.
- Factory de secuencia vacía.
- `canConnect` / create de sync y reply, incluido self.
- Rechazo de `kind` desconocido y de mezcla.

## Comandos de verificación

```bash
npx vitest run src/domain
npx tsc -b --pretty false
```

`npm run check` si el diff de esta TASK está formateado. No «arreglar»
Prettier de archivos que esta TASK no toca.

## Stop conditions

- Se pide pintar el lienzo o el selector.
- Se pide un `kind` de mensaje o fragmento fuera de `sequence-model.md`.
- Se pide cambiar la matriz de casos de uso.

## Definition of Done

Dominio schema 2 + secuencia testeados; sin chrome; contratos de dominio
actualizados si la unión quedó escrita.

## Evidencia de cierre

2026-09-14. Dominio schema 2 + secuencia. `migrateDocument` `1→2` puro
(copia casos de uso, escribe `schemaVersion: 2`, no altera elementos;
encadenable; sin saltos). Parser 2 rechaza kinds desconocidos y mezclas
(`UNKNOWN_KIND`). Matriz MVP de casos de uso intacta. Secuencia:
lifeline / `sync-message` / `reply-message`; self-message; cascada al
borrar lifeline; `y` en cabeza → `INVALID_GEOMETRY`.
`createEmptySequenceDocument()`. Envelope de workspace y archivo 2.x
no tocados (TASK-047/050). `documentFile` 1.x sigue parseando schema 1;
importación en el shell migra `1→2`.

Comandos: `npx vitest run src/domain` (121 tests) y `npx vitest run`
(351). `npx tsc -b --pretty false`: app limpia; fallos previos en
`e2e/document-file.spec.ts` (`canvas` no usada) y
`e2e/include-extend.spec.ts` (`SVGPathElement` / `DOMPoint` sin DOM
en `tsconfig.node.json`) — sucio anterior, no tocado (TASK-042).
