# TASK-066: Servidor MCP (stdio) — lectura y sesión

## Estado documental

Hecha (2026-09-21)

## Objetivo

Instalar el SDK MCP autorizado, crear el entrypoint `mcp/` con
transport stdio, resources de catálogo y tools de lectura / sesión
(`list_kinds`, `create_document`, `load_document`, `save_document`,
`validate_document`, `list_elements`, `describe_rules`) sobre la facade
de TASK-065.

## Prioridad

P0

## Dependencias

TASK-065

## Contexto obligatorio

- @docs/architecture/mcp.md
- @docs/decisions/ADR-009-mcp-ai-integration.md
- @docs/decisions/ADR-001-frontend-stack.md
- @docs/architecture/architecture.md
- @docs/product/post-mvp-spec.md
- @.cursor/rules/00-core.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

Facade `agentApi` `Hecha`. No existe `mcp/`. `package.json` no tiene
`@modelcontextprotocol/server`. ADR-009 autoriza el pin.

## Dentro del alcance

- Añadir dependencia **exacta** `@modelcontextprotocol/server` (elegir
  la última estable compatible con Node 24 / Zod 4 del repo; registrar
  la versión en evidencia y en addendum breve de ADR-009 o
  `mcp.md` «pin»).
- Scaffold `mcp/server.ts` (+ módulos tools/resources) con
  `serveStdio` / transport stdio.
- Implementar resources `arkuml://kinds` y `arkuml://kind/{kind}`.
- Implementar tools de lectura/sesión listados en `mcp.md` (no aún
  create/update/delete elemento/relación: eso es TASK-067).
- Script npm `mcp` (o `mcp:serve`) que lance el servidor.
- Tests de handlers (documento en memoria / fixtures) sin arrancar un
  host real.
- Puntero en README (una línea: cómo lanzar) sin duplicar el runbook
  de clientes.

## Fuera del alcance

- Tools de mutación de elementos/relaciones (TASK-067).
- Prompts MCP y manifests Cursor/Claude/Grok (TASK-068).
- Streamable HTTP, OAuth, secrets.
- Cambiar dominio salvo imports desde `mcp/`.
- Raster, SPA, localStorage.

## Archivos / módulos afectados

- `mcp/**` (nuevo)
- `package.json` / `package-lock.json` (pin SDK)
- `tsconfig*` si hace falta proyecto/refs para `mcp/`
- `docs/architecture/mcp.md` (pin / entrypoint)
- `docs/decisions/ADR-009-mcp-ai-integration.md` (pin exacto si aplica)
- `README.md` (puntero corto)
- `docs/tasks/post-024/17-ecosystem/TASK-066.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Un host MCP local puede listar kinds, crear/cargar/guardar/validar un
documento JSON ArkUML vía stdio.

## Restricciones

- Logs solo a stderr.
- `mcp/` no importa React / Zustand / xyflow / `editor/`.
- No otras dependencias nuevas sin stop.
- Pins TS 6.0.3, html-to-image 1.11.11, Prettier 3.9.6 intactos.

## Criterios de aceptación

- [x] `@modelcontextprotocol/server` fijado exactamente; lockfile
      actualizado.
- [x] `npm run mcp` (o el script acordado) arranca stdio sin escribir a
      stdout excepto JSON-RPC.
- [x] Resources de kinds responden.
- [x] Tools de lectura/sesión delegan a la facade; validate no muta.
- [x] Tests de handlers pasan; `npm run check` verde o desviación
      documentada solo si preexistente.
- [x] Sin tools de mutación de grafo en este diff.

## Tests

Vitest de registro/handlers; fixture envelope schema 3.

## Comandos de verificación

```bash
npm run check
```

## Stop conditions

- El SDK exige TypeScript > pin o rompe Zod 4 del repo.
- Se pide transport HTTP remoto.
- Se pide API key de un proveedor de modelos.

## Definition of Done

Servidor stdio de lectura/sesión usable; pin documentado; criterios
`[x]`; handoff.

## Evidencia de cierre

2026-09-21: `@modelcontextprotocol/server@2.0.0` (Node `>=20`) fijado en
`package-lock.json`; `mcp/server.ts` registra stdio, resources de catálogo y
los siete tools de lectura/sesión. `mcp/tools/handlers.test.ts` cubre sesión,
envelope schema 3 y errores estructurados. `npm run test` pasó (68 archivos,
520 tests). `npm run check` queda desviado antes de lint por 96 archivos
preexistentes fuera de formato. `npm run lint` también tiene 37 errores
preexistentes en E2E, y `npm run typecheck` falla en
`e2e/include-extend.spec.ts` al no encontrar `SVGPathElement` y `DOMPoint`
bajo el `tsconfig.node` vigente.
