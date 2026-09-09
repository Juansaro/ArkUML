# TASK-031: Especificación canónica Post-MVP

## Estado documental

Hecha

## Objetivo

Publicar el contrato Post-MVP: prioridades, FR, non-goals, versionado y qué
sigue fuera de alcance hasta una revisión explícita.

## Prioridad

P0

## Dependencias

TASK-030

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/product/brand-system.md
- @docs/decisions/README.md
- @docs/tasks/post-024/roadmap.md
- @docs/tasks/post-024/risk-register.md
- @docs/tasks/post-024/README.md

## Estado inicial

`mvp-spec.md` cubre el MVP. El backlog histórico (README de tasks, fases 12–17
del roadmap) lista ideas sin rango ni criterios de aceptación. TASK-020 prohíbe
medio-implementar Post-MVP. Las exclusiones O-01–O-10 del registro siguen
vigentes hasta que este contrato las mueva.

## Dentro del alcance

- Crear `docs/product/post-mvp-spec.md` (o el nombre que el humano confirme;
  no sustituir `mvp-spec.md`).
- Priorizar waves (12–17 y contingencias) con P0/P1/P2 y non-goals.
- Definir criterio de versionado del producto (qué rompe MVP vs qué es
  minor/major; relación con schema `1`).
- Decidir cuáles exclusiones O-\* permanecen y cuáles entran al catálogo
  activo.
- Apuntar qué ADRs **podrían** reabrirse (006, 004, 003) sin reabrirlos aquí.
- Actualizar mvp-spec con un enlace «después del MVP» (sin copiar el Post-MVP
  entero).
- Actualizar índice y roadmap (estados `propuesta` → `autorizado en spec` o
  `fuera de alcance vigente`).

## Fuera del alcance

- Redactar TASK-034+ (eso es TASK-033).
- Política detallada de migraciones (TASK-032).
- Implementar UML, persistencia o export nuevos.
- Elegir IndexedDB vs JSON vs sync; solo marcarlos como decisiones
  pendientes para 032.

## Archivos / módulos afectados

- `docs/product/post-mvp-spec.md` (nuevo)
- `docs/product/mvp-spec.md` (enlace, no reescritura del MVP)
- `docs/tasks/post-024/roadmap.md`
- `docs/tasks/post-024/README.md`
- `docs/tasks/post-024/11-governance/TASK-031.md`

## Cambios esperados

Hay un documento canónico Post-MVP. El roadmap deja de ser la spec.

## Restricciones

- `mvp-spec.md` sigue ganando para el producto actual.
- No inventar semántica UML (Include cíclico, Generalization, notas) en la
  spec: o se cita una fuente, o el ítem queda `bloqueado` por decisión.
- No pins ni código.

## Criterios de aceptación

- [x] Existe spec Post-MVP con FR, non-goals, prioridades y versionado.
- [x] Cada wave 12–17 tiene un destino: in-scope, más tarde, o exclusión.
- [x] O-01–O-10 dispuestos (permanecen o entran).
- [x] mvp-spec enlaza el Post-MVP sin diluir el MVP.
- [x] Índice actualizado.

## Tests

Revisión documental y enlaces.

## Comandos de verificación

```bash
npm run format:check
git diff --check
```

## Stop conditions

- TASK-030 no está `Hecha`.
- Se pide «incluir todo» como FR obligatorio sin priorizar.
- Hace falta decidir multiplicidad/Generalization sin fuente UML acordada.

## Definition of Done

Contrato Post-MVP publicado; implementación aún no autorizada.

## Evidencia de cierre

2026-09-09. Criterios `[x]`. Contrato Post-MVP publicado en
`docs/product/post-mvp-spec.md`. Implementación no autorizada. ADRs no
reabiertos. Schema `1` intacto. Sin TASK-034+.

Decisiones de producto (sin inventar UML ni elegir backend):

- 1.x = compatible con schema `1`; 2.0 = ruptura / `schemaVersion > 1`.
- Multi-documento: no (exclusión vigente).
- IndexedDB: no elegido; condicional C-QUOTA (TASK-032).
- Ciclos Include/Extend: warning no bloqueante (FR-P01); no se afirma
  ilegalidad UML.
- Generalization, notas, multiplicidad, extension points: sin FR
  (bloqueados o exclusión).
- Temas, touch, SaaS, segundo tipo de diagrama: exclusión vigente.
- Primera wave recomendada a TASK-033: W12-01 + W13-02 (schema 1).

Comandos realmente corridos:

```bash
npm run format:check
git diff --check
```

`git diff --check`: OK (aviso LF→CRLF de Git en `README.md`, no error).
`npm run format:check`: falla en los mismos 10 archivos de chrome/tooltips
de TASK-024 que 028/029/030; esta TASK no los reformateó. Los markdown
nuevos o tocados no aparecen en el warn de Prettier.
