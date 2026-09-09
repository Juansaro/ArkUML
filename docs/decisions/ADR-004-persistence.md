# ADR-004: Persistencia local

## Context

Sin persistencia, un refresh pierde el diagrama: el MVP deja de ser usable. No hay backend. El documento es JSON pequeño (sin blobs). MDN: `localStorage` es síncrono y ~5 MiB por origen; IndexedDB es asíncrono y para datos mayores.

## Problem

A, B, C o D: nada / LocalStorage / IndexedDB / otra.

## Options

1. Sin persistencia.
2. LocalStorage + schema Zod + interfaz `DiagramRepository`.
3. IndexedDB (Dexie/localForage).
4. File System Access API / descargar JSON a disco como único save.

## Decision

Opción 2.

- Clave: `arkuml:workspace:v1`.
- Valor: `WorkspaceSnapshot` validado con Zod.
- Interfaz async `load` / `save` / `clear` aunque la implementación actual sea síncrona.
- Autosave debounce **750 ms** tras commit de historial, no por frame de drag. Flush en Ctrl/Cmd+S y best-effort en `beforeunload`.
- Errores `QuotaExceededError` y parse inválido son visibles; no se sobrescribe un blob corrupto hasta confirmación.
- Si el storage está bloqueado, la app sigue en memoria.

## Rationale

Un editor gráfico sin recuperar trabajo no valida el producto. LocalStorage es el mínimo: una clave, un JSON, API universal. IndexedDB aporta asincronía y cuota mayor, innecesarias para un documento. La interfaz repository evita reescribir dominio/editor cuando aparezca IndexedDB o un backend.

No persistir «nada» fue rechazado por UX. Guardar solo como descarga JSON obliga a disciplina del usuario y no cubre crash/refresh.

## Consequences

- Límite ~5 MiB. Un diagrama 100/150 debe caber holgadamente; si se acerca a 1 MiB de forma habitual, migrar a IndexedDB. Medido en TASK-029: ~95 KiB UTF-16 en 100/150; ver [performance.md](../architecture/performance.md).
- Escrituras síncronas: solo al commit, no en el rAF del drag.
- Multi-tab: último write gana; no hay sync. Aceptable para un solo usuario.
- No hay lista de documentos.

## Rejected alternatives

- **Sin persistencia:** pérdida de trabajo.
- **IndexedDB ahora:** más código, más tests, sin blobs ni multi-doc.
- **File System Access:** soporte desigual y flujo de permisos peor que autosave invisible.
- **middleware persist de Zustand:** sin validación de schema.
