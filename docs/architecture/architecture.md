# Arquitectura

Arquitectura mínima: cuatro límites claros, sin Clean Architecture ceremonial, sin buses globales y sin capa DTO duplicada hasta que exista backend.

```text
UI (React)
  → acciones semánticas
Application / editor store (Zustand)
  → operaciones puras
Domain (DiagramDocument)
  → proyección memoizada
Rendering adapter (React Flow nodes/edges)
  → persistencia / exportación
Infrastructure (DiagramRepository, exportDiagram)
```

## Principio

`DiagramDocument` es la fuente de verdad. React Flow es una **proyección** para interacción. `toObject()` de React Flow no se persiste ni se trata como modelo.

## Módulos

El código de aplicación vive en `src/` y `e2e/`:

```text
src/
  app/                 bootstrap, App, tokens globales
  domain/diagram/      modelo, factories, reglas, operaciones, schema Zod
  editor/
    store/             estado, acciones, historial, selectores
    adapters/          mapper modelo ↔ React Flow
    canvas/            contenedor React Flow
    diagramKinds.ts    registry mínimo por `document.kind`
    nodes/             Actor, UseCase, SystemBoundary, Lifeline
    edges/             Association, Include, Extend, sync/reply
    tools/             creación y conexión
    interactions/      drag, selección, reparent, resize
    components/        shell, inspector, diálogos
    shortcuts/
    a11y/
  persistence/         DiagramRepository, LocalStorage, autosave
  export/              bounds, raster, download
  test/                setup de Vitest
mcp/                   servidor MCP (stdio); importa solo domain
e2e/
```

## Dependencias permitidas

| Módulo | Responsabilidad | Puede importar | No puede importar |
| --- | --- | --- | --- |
| `domain/diagram` | Modelo, factories, reglas, operaciones puras | Zod solo en el boundary de schema | React, Zustand, DOM, `@xyflow/react` |
| `editor/store` | Orquestación, selección, viewport, historial | `domain`, Zustand | DOM, componentes, React Flow |
| `editor/adapters` | Traducir modelo ↔ React Flow | `domain`, tipos del store, `@xyflow/react` | LocalStorage, UI de exportación |
| `editor` UI | Interacción y presentación | store, adapters, xyflow | Mutar el documento a mano |
| `persistence` | load/save/clear, autosave | `domain` (schema/factories) | React Flow |
| `export` | Bounds, clon, raster, Blob, download | adapter público, DOM | Store interno no público de xyflow |
| `mcp/` | Tools/resources/prompts para hosts de IA | `domain/diagram` (facade agente) | React, Zustand, DOM, `@xyflow/react`, `localStorage` |

## Flujo de una mutación

```mermaid
flowchart LR
  ui[UI_event]
  action[store_action]
  domain[domain_operation]
  doc[DiagramDocument]
  history[history_commit]
  mapper[reactFlowMapper]
  rf[ReactFlow]
  save[autosave_debounce]
  ui --> action --> domain --> doc
  doc --> history
  doc --> mapper --> rf
  history --> save
```

1. La UI dispara una acción semántica (`createActor`, `commitMove`, `connect`, …).
2. El store llama a una función pura de dominio y recibe un documento nuevo.
3. Si la acción es semántica (no viewport, no selección), se registra una entrada de historial. Un drag completo usa `beginTransaction` / `commitTransaction`.
4. Selectores pequeños alimentan la UI. El mapper produce `Node[]` y `Edge[]` memoizados.
5. Al commit se notifica al coordinador de autosave (debounce 750 ms).
6. Exportación lee la proyección **ya renderizada**, calcula bounds y rasteriza off-screen. No serializa el objeto interno de React Flow.

## Estado de aplicación

Slices del store:

- `document`: `DiagramDocument`
- `selection`: ids seleccionados
- `viewport`: `{ x, y, zoom }`
- `tool`: herramienta activa
- `history`: pila de documentos, máximo 100
- `ui`: status de guardado, mensajes, modo de diálogo

Persistido: `document` + `viewport` dentro de `WorkspaceSnapshot`.

No persistido: selección, historial, herramienta, hover, mensajes,
visibilidad de paleta e inspector.

## Historial

- Snapshots del documento, no command objects ni event sourcing.
- Límite 100. Al exceder, se descarta el más antiguo.
- Una nueva mutación invalida redo.
- Zoom, pan, hover, selección y status no generan entradas.

## Evolución

**Persistencia:** [schema-evolution.md](schema-evolution.md). Schema `2`
y storage `2` vigentes en `src/` (Release 1). Release 2 autoriza schema
`3` (TASK-052+); `storageVersion` permanece 2. IndexedDB solo con
C-QUOTA y ADR-004 reabierto. Biblioteca:
[ADR-007](../decisions/ADR-007-workspace-library.md).
`src/domain` no importa storage.

**Tipos de diagrama:** [diagram-kinds.md](diagram-kinds.md). 1.x
`use-case`. Release 1: secuencia. Release 2: FR-R04–R09 (metamodelos
listados allí). El registry de TASK-049 se reutiliza. Host vacío
prohibido.

**Backend futuro:** sustituir la implementación de `DiagramRepository`. Auth, sync y multi-usuario no entran en dominio.

**Agentes (Release 3):** servidor MCP local ([`mcp.md`](mcp.md),
[ADR-009](../decisions/ADR-009-mcp-ai-integration.md)). Mutaciones vía
dominio; persistencia = archivos del envelope FR-P03, no el autosave
browser. El modelo LLM vive en el host (Cursor, Claude, Grok, GPT, …).

**Segundo motor gráfico:** reescribir `editor/adapters` y nodos/edges. Dominio, persistencia y store permanecen.

## Qué no hay en el MVP

- Inyección de dependencias framework-level.
- Event bus global.
- Redux.
- Middleware `persist` de Zustand (el adapter propio valida con Zod).
- Arquitectura hexagonal completa, casos de uso como clases, o directorios `core/infra/ui` vacíos.

## Documentos canónicos

```text
docs/
  product/{mvp-spec,brand-system,post-mvp-spec}.md
  architecture/{architecture,domain-model,schema-evolution,diagram-kinds,sequence-model,class-model,component-model,deployment-model,er-model,activity-model,interaction-overview-model,mcp,rendering-and-export,testing-strategy,performance}.md
  operations/{static-hosting,mcp-clients}.md
  decisions/ADR-001 … ADR-009
  development/{agent-workflow,task-template}.md
  tasks/TASK-001 … TASK-025
  tasks/post-024/          índice, registro, roadmap y TASK-026+
.cursor/rules/{00-core,domain,testing}.mdc
src/
mcp/
e2e/
```

`performance.md` registra los números de TASK-019. La a11y del chrome cabe en mvp-spec; no hay `accessibility.md` aparte. `static-hosting.md` es el runbook de `dist/` (FR-P06); no es un proveedor soportado ni un backend. `mcp.md` + `mcp-clients.md` (TASK-068) son el contrato y el runbook de agentes; no son SaaS.
