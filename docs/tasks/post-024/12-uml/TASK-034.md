# TASK-034: Ciclos Include/Extend como warning no bloqueante

## Estado documental

Hecha

## Objetivo

Detectar ciclos dirigidos de Include y de Extend y mostrarlos como aviso
no bloqueante, sin rechazar documentos que el MVP ya acepta.

## Prioridad

P0

## Dependencias

TASK-033

## Contexto obligatorio

- @docs/product/post-mvp-spec.md
- @docs/product/mvp-spec.md
- @docs/architecture/domain-model.md
- @docs/architecture/schema-evolution.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

`collectWarnings` solo cubre geometría (`ACTOR_INSIDE_BOUNDARY`,
`USE_CASE_OUTSIDE_BOUNDARY`). `canConnect` / `createRelationship` no
rechazan ciclos. El inspector lista avisos; no van a la región
`aria-live`. Schema `1` y `z.strictObject` siguen vigentes. Wave 1
congelada: este archivo es W12-01 / FR-P01.

## Dentro del alcance

- Grafo dirigido **por `kind`**: un grafo Include (`sourceId` → `targetId`)
  y un grafo Extend distinto. Association no participa.
- Un caso de uso avisa si pertenece a un componente fuertemente conexo
  de tamaño ≥ 2 en ese grafo. Self-loop sigue prohibido por
  `SELF_RELATIONSHIP`; no hay que avisarlo.
- Códigos nuevos, estables: `INCLUDE_CYCLE`, `EXTEND_CYCLE`. Un aviso por
  par `(code, useCaseId)`. `elementId` es el caso de uso (el inspector
  resuelve nombre contra `elements`).
- Copy (no afirma ilegalidad UML): «Participa en un ciclo de Include.» /
  «Participa en un ciclo de Extend.»
- Extender `collectWarnings`; el inspector reutiliza la lista existente
  (`data-warning-code`). No `aria-live`.
- Documentar los códigos en `domain-model.md` (validación no bloqueante).
- `createRelationship` y `canConnect` no ganan chequeo de ciclo: el
  commit sigue igual.

## Fuera del alcance

- Tratar Include y Extend como un solo grafo mixto.
- Generalization, notas, extension points, multiplicidad.
- Rechazar el commit, mutar el documento o persistir el aviso.
- Bump de `schemaVersion` / `storageVersion`.
- Reabrir ADR-003 (el aviso no entra al historial).
- TASK-035 ni el resto del catálogo.

## Archivos / módulos afectados

- `src/domain/diagram/validation.ts`
- `src/domain/diagram/validation.test.ts`
- `docs/architecture/domain-model.md` (códigos de aviso; no la matriz)
- `src/editor/store/selectors.ts` (solo si `formatWarning` no cubre el
  caso; no cambiar el ocultado durante transacción)
- `src/editor/components/Inspector/Inspector.test.tsx`
- `e2e/include-extend.spec.ts` o E2E colocalizado de ciclo
- `docs/tasks/post-024/12-uml/TASK-034.md`
- `docs/tasks/post-024/README.md` (estado/evidencia)

## Cambios esperados

Un ciclo Include A→B→A (y el análogo Extend) aparece en el inspector.
Undo, autosave y schema `1` no cambian. Un diagrama cíclico del MVP
sigue abriéndose.

## Restricciones

- `src/domain` no importa React, DOM ni `@xyflow/react`.
- No strings de código sueltos: los avisos viven en `domain-model.md`.
- No afirmar que el ciclo sea ilegal en UML (FR-P01).
- Pines intactos. Sin campos nuevos en el documento.

## Criterios de aceptación

- [x] Include A→B→A produce `INCLUDE_CYCLE` en A y B; no impide crear la
      segunda relación.
- [x] Extend cíclico produce `EXTEND_CYCLE`; no se confunde con Include.
- [x] Cadena acíclica A→B→C no avisa. Association A↔B no avisa.
- [x] Include A→B más Extend B→A no avisa (grafos separados).
- [x] El aviso no muta el documento ni aparece en el JSON persistido.
- [x] Schema `1` / round-trip Zod sin claves nuevas.
- [x] Inspector: mismo contenedor que los avisos geométricos; copy en
      español; no `aria-live`.
- [x] `domain-model.md` lista los dos códigos.

## Tests

Unidad en `validation.test.ts`: 2-ciclo, ciclo largo, acíclico, per-kind,
Association ignorada, grafo mixto sin aviso. Inspector: `data-warning-code`.
E2E: crear el 2-ciclo Include y ver el aviso; el documento sigue editable.

## Comandos de verificación

```bash
npm run test -- src/domain/diagram/validation.test.ts src/editor/components/Inspector/Inspector.test.tsx
npm run test:e2e -- e2e/include-extend.spec.ts
npm run check
```

Si el E2E de ciclo vive en otro spec, sustituir esa ruta. `npm run check`
al cierre.

## Stop conditions

- Se pide rechazar el ciclo o llamarlo inválido en UML sin fuente citada.
- Se pide un grafo mixto Include+Extend.
- Hace falta un campo persistido o bump de schema.

## Definition of Done

FR-P01 observable; schema `1` intacto; criterios `[x]` con evidencia.

## Evidencia de cierre

2026-09-09. Criterios `[x]`. FR-P01 observable: ciclos Include/Extend
como warning no bloqueante. Schema `1` / `storageVersion` `1` intactos.
`createRelationship` / `canConnect` sin chequeo de ciclo. Copy no afirma
ilegalidad UML. Avisos no persistidos ni en `aria-live`.

Códigos en `domain-model.md`: `INCLUDE_CYCLE`, `EXTEND_CYCLE`.
`formatWarning` reutiliza `elementId`; no se tocó el ocultado durante
transacción.

Comandos realmente corridos:

```bash
npm run test -- src/domain/diagram/validation.test.ts src/editor/components/Inspector/Inspector.test.tsx
npm run test:e2e -- e2e/include-extend.spec.ts
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
```

Unidad: 24/24 en los dos archivos; suite 264/264. E2E Chromium: 4/4
(`include-extend.spec.ts`, incluido el 2-ciclo). Lint, typecheck y
`vite build` OK.

`npm run check` falla en `format:check` por los mismos 10 archivos de
chrome/tooltips de TASK-024 (028–033). Esta TASK no los reformateó. Los
archivos tocados pasan Prettier.
