# TASK-004: Reglas UML y operaciones puras

## Objetivo

Congelar la semántica del MVP en funciones puras y una matriz de conexión testeada.

## Prioridad

P0

## Dependencias

TASK-003

## Contexto obligatorio

- @docs/architecture/domain-model.md
- @docs/product/mvp-spec.md
- @.cursor/rules/domain.mdc

## Estado inicial

Tipos y schema existen.

## Dentro del alcance

- `canConnect` y `createRelationship` con códigos de error estables.
- Prohibiciones: boundary como extremo, self Include/Extend, duplicado `(kind, sourceId, targetId)`.
- Association normaliza actor como source.
- `deleteElements` con cascada de relaciones; unboundarying con conversión a absolutas.
- `reparentUseCase` preservando posición visual.
- `duplicateElements` offset 24; sin relaciones; no duplica boundary.
- Validaciones no bloqueantes actor-dentro / useCase-fuera.
- Etiquetas include/extend derivadas, no persistidas.
- Rename con trim 1–80.

## Fuera del alcance

- Detección de ciclos Include/Extend.
- Generalization, waypoints, auto-layout, unicidad de nombres.
- UI.

## Archivos / módulos afectados

- `src/domain/diagram/rules.ts`
- `src/domain/diagram/operations.ts`
- `src/domain/diagram/validation.ts`
- tests de matriz y transformaciones

## Cambios esperados

Operaciones inmutables. Tests exhaustivos de la matriz origen×destino×kind.

## Restricciones

Códigos de error del domain-model. Sin I/O.

## Criterios de aceptación

- [ ] Matriz de mvp-spec cubierta por tests (válidas e inválidas).
- [ ] Eliminar boundary conserva posición absoluta de casos y limpia `parentId`.
- [ ] Eliminar elemento elimina relaciones incidentes.
- [ ] Nombres inválidos rechazados; duplicados de nombre permitidos.

## Tests

Matriz completa; borrado; reparent; duplicación; geometría no finita.

## Comandos de verificación

```bash
npm run test -- src/domain/diagram
npm run test:coverage
npm run typecheck
```

## Stop conditions

- Tentación de implementar Generalization «porque estaba en la lista inicial».

## Definition of Done

Cobertura dominio >=90 % líneas y >=85 % ramas. Operaciones documentadas solo por código + domain-model (no duplicar spec).
