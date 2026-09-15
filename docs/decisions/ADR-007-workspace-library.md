# ADR-007: Biblioteca local de documentos

## Status

Aceptada (TASK-045, 2026-09-14). Vigente para la línea **2.0** (ciclo
**Release 1**). No se implementa en esta TASK; el código es TASK-047.

## Context

El MVP (ADR-004) persiste **un** `WorkspaceSnapshot` con un único
`DiagramDocument`. La consecuencia «No hay lista de documentos» cubría
1.x. Release 1 pide un selector en la top bar para cambiar entre
diagramas y una búsqueda sobre esa lista, más un segundo
`document.kind` (secuencia). Eso es cardinalidad de workspace, no un
cambio de backend.

## Problem

¿Varios documentos locales en el mismo autosave, o seguir sustituyendo
el único documento activo?

## Options

1. Conservar un único documento. El «selector» solo cambia `document.kind`
   y sustituye el diagrama (confirmación de «Nuevo»).
2. Biblioteca en el mismo `localStorage`: `storageVersion` 2, lista de
   documentos, `activeDocumentId`, búsqueda/switch de chrome.
3. Un archivo / una clave por diagrama, o IndexedDB como almacén de
   colección.

## Decision

Opción 2.

- Sigue [ADR-004](ADR-004-persistence.md): `LocalStorageDiagramRepository`,
  Zod estricto, interfaz async `load` / `save` / `clear`, debounce 750 ms,
  last-write-wins entre pestañas, cuota visible, no IndexedDB (C-QUOTA).
- Envelope interno:

  ```text
  WorkspaceSnapshot
  ├─ storageVersion: 2
  ├─ activeDocumentId: UUID
  └─ documents: { document: DiagramDocument, view }[]
  ```

- Cada `DiagramDocument` conserva su `id`. `activeDocumentId` debe
  coincidir con exactamente un `document.id`. La lista no puede estar
  vacía (host vacío prohibido, [diagram-kinds.md](../architecture/diagram-kinds.md)).
- Clave: se conserva `arkuml:workspace:v1`. La migración `storageVersion`
  `1→2` es in-place: el snapshot de un documento se envuelve como lista
  de un elemento. Nunca dos workspaces vivos.
- Un documento, un `kind`. Cambiar de fila en el selector **no** convierte
  el kind: activa otro `DiagramDocument`.
- Historial ([ADR-003](ADR-003-state-management.md)): sigue siendo RAM,
  snapshots del documento, tope 100. En 2.0 hay **una pila por
  `document.id`**. No se persiste. Al borrar un documento se descarta su
  pila. Undo no restaura viewport ni selección (sin cambio).
- «Nuevo» **añade** un documento del mismo `kind` que el activo (o del
  kind elegido cuando exista el diálogo) y lo activa. No destruye el
  anterior; no exige la confirmación de FR-11.
- Borrar: confirmación; no se puede borrar el último documento.
- Importar JSON de usuario: **añade** a la biblioteca y activa el nuevo.
  Exportar: sigue siendo **solo** el documento activo, no la biblioteca.
- IndexedDB no se elige. Si la biblioteca habitual se acerca a 1 MiB,
  aplica C-QUOTA y se reabre ADR-004 para el backend, no esta cardinalidad.

## Rationale

La búsqueda sobre opciones no tiene sentido sobre un único título. Sustituir
el documento al cambiar de kind destruiría trabajo y chocaría con un
segundo tipo persistido. IndexedDB sigue sin evidencia de cuota.

## Consequences

- La consecuencia de ADR-004 «No hay lista de documentos» **deja de
  aplicar** en 2.0. El backend y la clave no cambian.
- `migrate()` de storage es obligatorio antes del primer save 2.0
  ([schema-evolution.md](../architecture/schema-evolution.md)). Un cliente
  1.0 que encuentre `storageVersion` 2 trata el blob como corrupto.
- El selector es chrome (TASK-048). Sin módulo completo de un `kind`, ese
  kind no aparece como acción de crear (regla TASK-020).
- W14-05 (sync multi-tab) sigue exclusión.

## Rejected alternatives

- **Opción 1 (sustituir el activo):** no hay lista que buscar; el segundo
  kind pisaría el diagrama actual.
- **Una clave por diagrama:** varias fuentes de verdad y restore
  ambiguo al arrancar.
- **IndexedDB ahora:** C-QUOTA no se ha disparado; es backend, no lista.

## Relación con otros ADR

| ADR | Efecto |
| --- | --- |
| ADR-004 | Reabierto **solo** en la cardinalidad del workspace. LocalStorage, Zod y repository se conservan. |
| ADR-003 | Addendum: pila de historial indexada por `document.id`; no se persiste. |
| ADR-002 / ADR-006 | Sin cambio. Un kind extra no exige segundo motor ni otro exporter. |
