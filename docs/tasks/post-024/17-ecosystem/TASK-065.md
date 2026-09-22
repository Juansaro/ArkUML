# TASK-065: Facade de dominio para agentes MCP

## Estado documental

Hecha

## Objetivo

Exponer un módulo puro (sin React) que el servidor MCP pueda llamar
para listar kinds, crear/cargar/guardar documentos en memoria y aplicar
mutaciones semánticas, reutilizando factories, operations, rules y
validation existentes.

## Prioridad

P0

## Dependencias

TASK-064

## Contexto obligatorio

- @docs/architecture/mcp.md
- @docs/architecture/architecture.md
- @docs/architecture/domain-model.md
- @docs/architecture/diagram-kinds.md
- @docs/decisions/ADR-009-mcp-ai-integration.md
- @docs/architecture/schema-evolution.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

Release 3 congelada. `src/domain/diagram` tiene factories, operations,
rules, validation, `documentFile` (envelope) y migrate. No hay API
orientada a agentes. `mcp/` aún no existe (TASK-066).

## Dentro del alcance

- Crear `src/domain/diagram/agentApi.ts` (o nombre equivalente en
  `src/domain/diagram/`) que:
  - liste kinds soportados con resumen estable;
  - cree documento vacío por kind;
  - parse/serialize envelope vía `documentFile` + migrate;
  - valide (Zod + warnings de dominio);
  - aplique create/update/delete de elementos y relaciones delegando a
    operations existentes;
  - devuelva errores tipados (`code` + `message`) sin lanzar por
    rechazo de `canConnect`.
- Tests Vitest puros (sin jsdom) por kind representativo (al menos
  `use-case` y un kind R2).
- Actualizar `domain-model.md` con un párrafo de puntero a la facade
  (no reescribir metamodelos).

## Fuera del alcance

- Servidor MCP, SDK npm, stdio (TASK-066).
- Tools de escritura finos vs facade (TASK-067 puede ensanchar).
- Manifests de clientes (TASK-068).
- Store, React Flow, localStorage, export raster.
- Nuevos kinds o bump de schema.

## Archivos / módulos afectados

- `src/domain/diagram/agentApi.ts` (nuevo) y tests
- `src/domain/diagram/` (reexport opcional si ya hay barrel)
- `docs/architecture/domain-model.md` (puntero)
- `docs/tasks/post-024/17-ecosystem/TASK-065.md`
- `docs/tasks/post-024/README.md` (estado/evidencia)

## Cambios esperados

Un proceso Node puede, solo con dominio, construir y mutar un
`DiagramDocument` válido y serializar el envelope sin UI.

## Restricciones

- `src/domain` sin React, DOM, Zustand, `@xyflow/react`, ni `mcp/`.
- No nuevas dependencias npm.
- Zod `strictObject` intacto.
- Pins TS / html-to-image / Prettier intactos.

## Criterios de aceptación

- [x] Facade lista kinds y crea documentos vacíos para todos los kinds
      vigentes en schema 3.
- [x] load/save (parse/serialize) redondea un envelope `formatVersion` 3.
- [x] create/update/delete elemento y relación respetan `canConnect` y
      devuelven razón estructurada si fallan.
- [x] Validación expone warnings sin mutar el documento.
- [x] `src/domain` sin imports de UI. Tests de dominio pasan.
- [x] Sin servidor MCP en este diff.

## Tests

Vitest en `src/domain`: factory, mutación, rechazo de conexión, round-trip
JSON, kinds desconocidos.

## Comandos de verificación

```bash
npx vitest run src/domain
npx tsc -b --pretty false
```

## Stop conditions

- Se pide hablar con localStorage o con el store.
- Se pide instalar el SDK MCP aquí.
- Se pide un kind o campo persistido nuevo.

## Definition of Done

Facade testeada; docs de contrato actualizados si cambió la superficie;
criterios `[x]`; handoff.

## Evidencia de cierre

2026-09-21: facade `src/domain/diagram/agentApi.ts`. Lista los 8 kinds
de schema 3, crea documento vacío (título opcional), load/save del
envelope `arkuml-document-json` formatVersion 3 (migra 2→3 vía
`documentFile`), validate Zod + `collectWarnings` sin mutar, y
create/update/delete de elemento y relación delegando en operations /
`canConnect` con `Result` (`code` + `message`). Puntero en
`domain-model.md`. Sin `mcp/`. `npx vitest run src/domain` (208 ok).
`npx tsc -b --pretty false`: app limpia; fallos previos en
`e2e/include-extend.spec.ts` (`SVGPathElement` / `DOMPoint`). Actor y
caso de uso sin geometría usan la caja de la paleta (72×112 y 160×80);
el resto, los defaults de factories.
