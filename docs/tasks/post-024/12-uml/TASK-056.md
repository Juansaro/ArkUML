# TASK-056: Dominio de despliegue

## Estado documental

Hecha

## Objetivo

El dominio schema 3 acepta `document.kind` `"deployment"` y las
operaciones de `deployment-model.md`. Sin UI.

## Prioridad

P0

## Dependencias

TASK-055

## Contexto obligatorio

- @docs/architecture/deployment-model.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/domain-model.md
- @docs/architecture/diagram-kinds.md
- @docs/product/post-mvp-spec.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

Componentes tienen chrome. `"deployment"` es `UNKNOWN_KIND`.

## Dentro del alcance

- Añadir `"deployment"` a la unión (schema 3).
- `node`, `artifact`, `communication-path`, `deploy`.
- `createEmptyDeploymentDocument()`. Envelope 3.x acepta este kind.
- Tests de dominio. `canConnect` path = nodo–nodo; deploy = artefacto→nodo.

## Fuera del alcance

- Chrome (TASK-057). Device vs ExecutionEnvironment, nested nodes,
  `parentId` artefacto-en-nodo. Resto de kinds.

## Archivos / módulos afectados

- `src/domain/diagram/`
- `docs/architecture/domain-model.md`
- `docs/tasks/post-024/12-uml/TASK-056.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Un documento deployment se muta en tests. El parser rechaza
`entity-relationship` todavía.

## Restricciones

Zod `strictObject`. `src/domain` sin UI.

## Criterios de aceptación

- [x] Factories nodo/artefacto; cascada al borrar.
- [x] Path y deploy según `canConnect`; self ilegal.
- [x] Mezclas `UNKNOWN_KIND`. Kinds previos intactos.
- [x] Archivo 3.x round-trip.

## Tests

Factory, `canConnect` (rechazo artefacto–artefacto en path), no-mezcla.

## Comandos de verificación

```bash
npx vitest run src/domain
npx tsc -b --pretty false
```

## Stop conditions

- Se pide pintar, nested nodes o schema 4.

## Definition of Done

Dominio deployment testeado; sin chrome.

## Evidencia de cierre

2026-09-20. Dominio deployment en schema 3. Unión
`"use-case" | "sequence" | "class" | "component" | "deployment"`.
Parser rechaza `entity-relationship` y mezclas (`UNKNOWN_KIND`).
Elementos `node` / `artifact`; relaciones `communication-path` /
`deploy`; path solo nodo–nodo; deploy solo artefacto→nodo; self ilegal;
duplicados permitidos; cascada al borrar; `createEmptyDeploymentDocument()`;
nodo `200×120` (mín. `120×72`), artefacto `140×80` (mín. `96×48`).
Envelope `formatVersion` 3 round-trip. Kinds previos intactos. Sin
paleta ni nodos (TASK-057). Navegador no usado: verificación solo
dominio/unitaria.

Comandos: `npx vitest run src/domain` (167 tests) y
`npx tsc -b --pretty false`: app limpia; fallos previos en
`e2e/include-extend.spec.ts` (`SVGPathElement` / `DOMPoint` sin DOM
en `tsconfig.node.json`) — sucio anterior, no tocado.
