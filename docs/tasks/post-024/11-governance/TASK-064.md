# TASK-064: Freeze Release 3 (MCP / agentes)

## Estado documental

Hecha

## Objetivo

Revisar el contrato Post-MVP y congelar el ciclo **Release 3 (MCP)**:
servidor Model Context Protocol local para que hosts de IA (Cursor,
Claude, Grok, GPT y compatibles) lean y muten `DiagramDocument` vía
dominio, sin SaaS ni secrets. Promover **solo** las entradas maduras a
TASK-065–068.

## Prioridad

P0

## Dependencias

TASK-051, TASK-063

## Contexto obligatorio

- @docs/product/post-mvp-spec.md
- @docs/product/mvp-spec.md
- @docs/architecture/architecture.md
- @docs/architecture/domain-model.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/diagram-kinds.md
- @docs/decisions/README.md
- @docs/decisions/ADR-001-frontend-stack.md
- @docs/decisions/ADR-004-persistence.md
- @docs/decisions/ADR-007-workspace-library.md
- @docs/tasks/post-024/roadmap.md
- @docs/tasks/post-024/README.md
- @docs/development/task-template.md
- @docs/development/agent-workflow.md

## Estado inicial

Release 2 (TASK-051–063) está `Hecha`: ocho kinds, schema `3`,
`storageVersion` 2. W17-02 (backend/SaaS) es exclusión. No hay MCP,
ADR de agentes ni FR de integración con IA. El humano pide integración
client-agnostic vía MCP. `src/` no se toca en esta TASK.

## Dentro del alcance

- Enmendar `post-mvp-spec.md`: Release 3 = ciclo MCP (sin bump de
  schema); FR-A01–A03; W17-20–22 in-scope; O-08 partido; non-goals
  (LLM en SPA, HTTP remoto, secrets).
- Publicar [ADR-009](../../../decisions/ADR-009-mcp-ai-integration.md)
  y [`mcp.md`](../../../architecture/mcp.md).
- Enmendar `architecture.md`, `decisions/README.md`, roadmap, registro
  e índices.
- Crear TASK-065–068 **únicamente** para ítems `Lista`.
- Schema `3` / storage `2` intactos. SemVer de producto: aditivo sobre
  la línea **3.x** (no major de metamodelo).

## Fuera del alcance

- Código en `src/`, `mcp/` o `e2e/` (eso es TASK-066+).
- Instalar `@modelcontextprotocol/server` (TASK-066 + pin).
- LLM embebido, API keys, Streamable HTTP remoto, SaaS.
- Nuevos `document.kind`, IndexedDB, sync, PDF, temas.
- Tag SemVer ni cambiar `package.json` versión.
- Congelar waypoints, a11y SR u otras entradas del catálogo.

## Archivos / módulos afectados

- `docs/tasks/post-024/11-governance/TASK-064.md`
- `docs/tasks/post-024/17-ecosystem/TASK-065.md`
- `docs/tasks/post-024/17-ecosystem/TASK-066.md`
- `docs/tasks/post-024/17-ecosystem/TASK-067.md`
- `docs/tasks/post-024/17-ecosystem/TASK-068.md`
- `docs/decisions/ADR-009-mcp-ai-integration.md`
- `docs/architecture/mcp.md`
- `docs/architecture/architecture.md`
- `docs/product/post-mvp-spec.md`
- `docs/decisions/README.md`
- `docs/tasks/post-024/roadmap.md`
- `docs/tasks/post-024/risk-register.md`
- `docs/tasks/post-024/README.md`
- `docs/tasks/README.md`

## Cambios esperados

Hay un siguiente chat ejecutable (TASK-065). Nadie embebe un LLM en la
SPA ni inventa tools fuera de `mcp.md`.

## Restricciones

- `mvp-spec.md` y ADRs previos ganan salvo el addendum de este freeze.
- W17-02 permanece exclusión para backend/auth/collab/SaaS.
- Una TASK por chat de implementación.

## Criterios de aceptación

- [x] `post-mvp-spec.md` declara Release 3 / FR-A01–A03 / W17-20–22.
- [x] Existen ADR-009 y `docs/architecture/mcp.md` con tools/resources.
- [x] `architecture.md` lista el módulo MCP y el doc canónico.
- [x] TASK-065–068 existen en estado `Lista` con contratos cerrados.
- [x] Roadmap e índice post-024 reflejan el freeze.
- [x] Ningún código de producto ni pin nuevo en esta TASK.

## Tests

Revisión documental y enlaces relativos. Sin suite de producto.

## Comandos de verificación

```bash
git diff --check
```

## Stop conditions

- Se pide API key de OpenAI/Anthropic/xAI en el repo o en la SPA.
- Se pide MCP HTTP remoto con auth «para el equipo».
- Se pide bump de `schemaVersion` solo para MCP.

## Definition of Done

FR-A01–A03 autorizados; TASK-065 lista; criterios `[x]` con evidencia.

## Evidencia de cierre

2026-09-21. Freeze Release 3 (MCP): ADR-009 (stdio, dominio, archivos,
client-agnostic); `mcp.md` (tools/resources/prompts); FR-A01–A03 y
W17-20–22 en `post-mvp-spec.md`; TASK-065–068 `Lista`. Schema 3 /
storage 2 sin cambio. Sin código ni pins.

Comando:

```bash
git diff --check
```
