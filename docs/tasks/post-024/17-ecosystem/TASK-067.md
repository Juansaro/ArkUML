# TASK-067: Tools MCP de mutación del diagrama

## Estado documental

Hecha

## Objetivo

Completar el contrato de tools de escritura de
[`mcp.md`](../../../architecture/mcp.md): create/update/delete de
elementos y relaciones, delegando 100 % a la facade/dominio, con
errores estructurados cuando `canConnect` u otras reglas rechazan.

## Prioridad

P0

## Dependencias

TASK-066

## Contexto obligatorio

- @docs/architecture/mcp.md
- @docs/architecture/domain-model.md
- @docs/architecture/diagram-kinds.md
- @docs/decisions/ADR-009-mcp-ai-integration.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

Servidor MCP stdio con tools de lectura/sesión. Faltan
`arkuml_create_element`, `arkuml_update_element`,
`arkuml_delete_element`, `arkuml_create_relationship`,
`arkuml_delete_relationship`.

## Dentro del alcance

- Implementar los cinco tools de mutación del grafo según `mcp.md`.
- Inputs mínimos tipados (kind-aware donde haga falta; geometría
  opcional con defaults).
- Tras mutación exitosa, el documento en sesión queda actualizado;
  `save_document` sigue siendo el commit a disco.
- Tests: feliz + rechazo de conexión ilegal + delete con cascada de
  relaciones alineada al dominio.
- Ampliar facade solo si falta un helper puro (sin UI).

## Fuera del alcance

- Prompts y manifests de clientes (TASK-068).
- Auto-layout, waypoints, nuevos kinds.
- Undo/redo estilo SPA.
- Escribir a localStorage.
- Cambiar reglas UML/Chen existentes.

## Archivos / módulos afectados

- `mcp/tools/**`
- `src/domain/diagram/agentApi.ts` (solo si hace falta)
- `docs/architecture/mcp.md` (si se aclara un campo de input)
- `docs/tasks/post-024/17-ecosystem/TASK-067.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Un agente puede construir un diagrama usable (elementos + relaciones)
y persistirlo como JSON importable en la SPA.

## Restricciones

- Misma semántica que operations de dominio; no «arreglar» UML en el
  MCP.
- Sin dependencias npm nuevas.
- Logs a stderr.

## Criterios de aceptación

- [x] Los cinco tools existen y pasan validación Zod de input.
- [x] Rechazo de `canConnect` devuelve código/mensaje sin tumbar el
      proceso.
- [x] Delete de elemento elimina relaciones incidentes como en dominio.
- [x] Round-trip: mutar → save → load → mismo grafo semántico.
- [x] Tests verdes; sin cambios de chrome SPA.

## Tests

Vitest handlers + al menos un kind use-case y uno R2.

## Comandos de verificación

```bash
npm run check
```

## Stop conditions

- Se pide mutar el schema persistido.
- Se pide que el MCP hable con React Flow.
- Se pide instalar otro SDK.

## Definition of Done

Mutaciones MCP = dominio; criterios `[x]`; handoff.

## Evidencia de cierre

2026-09-21: `mcp/server.ts` registra create/update/delete de elementos y
create/delete de relaciones con schemas Zod cerrados; `mcp/tools/handlers.ts`
actualiza la única sesión mediante `agentApi`. `handlers.test.ts` cubre caso
use-case, rechazo estructurado de conexión, cascada y round-trip save/load.
`npm test` verde (68 archivos, 523 tests). `npm run typecheck` sigue exponiendo
dos nombres DOM ausentes preexistentes en `e2e/include-extend.spec.ts`.
