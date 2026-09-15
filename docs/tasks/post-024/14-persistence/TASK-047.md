# TASK-047: Biblioteca local (storageVersion 2)

## Estado documental

Hecha

## Objetivo

El autosave persiste una lista de documentos y el id activo
(`storageVersion` 2) según ADR-007. `migrate()` de workspace `1→2` corre
antes del primer save. Sin selector visual.

## Prioridad

P0

## Dependencias

TASK-046

## Contexto obligatorio

- @docs/decisions/ADR-007-workspace-library.md
- @docs/decisions/ADR-004-persistence.md
- @docs/decisions/ADR-003-state-management.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/domain-model.md
- @docs/product/post-mvp-spec.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

TASK-046 dejó `DiagramDocument` schema 2 y `migrateDocument`. El
repository sigue escribiendo un único documento, `storageVersion` 1,
clave `arkuml:workspace:v1`.

## Dentro del alcance

- Envelope interno de ADR-007: `storageVersion: 2`, `activeDocumentId`,
  `documents[]` (`document` + `view`). Lista no vacía; ids únicos;
  `activeDocumentId` resuelve a uno.
- `migrateWorkspace` `1→2`: envuelve el snapshot v1 como lista de un
  elemento; migra el documento con `migrateDocument` si aún es schema 1.
- Clave **la misma** `arkuml:workspace:v1`. In-place. Tras validar Zod
  destino, el primer save 2.0 sustituye el blob. Confirmación explícita
  la primera vez que se persiste una forma que 1.0 no abre (copy: el
  workspace único; la conversión no se puede deshacer para 1.0). Cancelar
  deja el blob 1 intacto y el trabajo en memoria.
- Store: documento activo + mapa de historial por `document.id` (RAM,
  tope 100 por pila). APIs internas: añadir, activar, borrar (imposible
  si queda uno). «Nuevo» de producto se cablea en TASK-048; aquí bastan
  las acciones del store cubiertas por test.
- `LocalStorageDiagramRepository` valida el snapshot v2. Errores de
  parse/cuota/bloqueo: mismo contrato NFR-07.
- Tests de persistencia y store. Sin combobox.

## Fuera del alcance

- UI del selector (TASK-048).
- Paleta de secuencia (TASK-049).
- Envelope de archivo de usuario (TASK-050).
- IndexedDB. Sync multi-tab. Segunda clave viva.
- Reabrir ADR-002/006.

## Archivos / módulos afectados

- `src/persistence/` (schema del snapshot, migrate, repository, tests)
- `src/editor/store/` (lista, activo, historial por id, tests)
- `docs/architecture/domain-model.md` (árbol WorkspaceSnapshot v2)
- `docs/tasks/post-024/14-persistence/TASK-047.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Reload restaura **todos** los documentos de la biblioteca y el activo.
Un blob v1 migra a v2 en memoria y se guarda como 2.0 en el hydrate
(si el write falla, se pide confirmación y el blob 1 permanece).
Un cliente no puede quedar con dos claves.

## Restricciones

- Dominio no importa `localStorage`.
- Debounce 750 ms intacto.
- Last-write-wins entre pestañas intacto.
- No recortar documentos para «hacer sitio» a la cuota.

## Criterios de aceptación

- [x] Snapshot Zod v2; lista vacía o `activeDocumentId` huérfano →
      `PARSE_INVALID`.
- [x] Migración `1→2` envuelve un documento y sube schema si hace falta.
- [x] Hydrate de v1 persiste 2.0; si el write falla, confirmación y el
      blob 1 no se pisa.
- [x] Añadir / activar / borrar (último no se borra) cubierto por tests
      de store.
- [x] Historial: mutar A, activar B, mutar B, volver a A: undo de A no
      aplica edits de B.
- [x] Cuota y corrupto: mismos códigos; no se borra el último save bueno.

## Tests

- Round-trip repository v2 con dos documentos (use-case y secuencia en
  memoria).
- Migración v1 → v2.
- Historial aislado por id.
- Rechazo de lista vacía.

## Comandos de verificación

```bash
npx vitest run src/persistence src/editor/store src/domain
npx tsc -b --pretty false
```

## Stop conditions

- Se pide IndexedDB o una clave por diagrama.
- Se pide pintar el combobox.
- Se pide persistir el historial.

## Definition of Done

Biblioteca persistida y store listo; sin chrome del selector.

## Evidencia de cierre

2026-09-14. Biblioteca local `storageVersion` 2 (ADR-007). Clave
`arkuml:workspace:v1` in-place. Envelope: `activeDocumentId` +
`documents[]` (`document` + `view`); lista no vacía; ids únicos;
`activeDocumentId` resuelve a uno. `migrateWorkspace` `1→2` envuelve el
snapshot v1 y llama `migrateDocument` si el payload sigue en schema 1.
Load no escribe; el primer save 2.0 pide confirmación (copy: workspace
único; irreversible para 1.0). Cancelar deja el blob 1 y el trabajo en
memoria. Store: documento activo, lista, historial por `document.id`
(tope 100, RAM). APIs internas añadir / activar / borrar (el último no
se borra). Sin combobox (TASK-048). Debounce 750 ms y last-write-wins
intactos. Cuota/corrupto: mismos códigos NFR-07.

Comandos: `npx vitest run src/persistence src/editor/store src/domain`
(173 tests). `npx tsc -b --pretty false`: app limpia; fallos previos en
`e2e/document-file.spec.ts` (`canvas` no usada) y
`e2e/include-extend.spec.ts` (`SVGPathElement` / `DOMPoint` sin DOM
en `tsconfig.node.json`) — sucio anterior, no tocado.

Desviación: diálogo de confirmación 2.0 cableado en el shell (no es el
selector) para que el overwrite no quede inalcanzable.
