# TASK-014: Relaciones Include y Extend

## Objetivo

Completar dependencias UML dirigidas con notación inequívoca.

## Prioridad

P0

## Dependencias

TASK-013

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/architecture/domain-model.md

## Estado inicial

Association funciona.

## Dentro del alcance

- Modos Include y Extend.
- Línea dashed, flecha abierta SVG hacia **target**, label centrado «include» / «extend» con fondo neutro.
- Help contextual: origen vs destino antes de conectar.
- No self; no duplicado por tipo+dirección.
- No invertir automáticamente la intención del usuario.
- Distinguibles sin solo color (dash + estereotipo + flecha).
- Mismos select/delete/undo que Association.

## Fuera del alcance

- Labels editables, extension points, condiciones, ciclos.
- Generalization.

## Archivos / módulos afectados

- `src/editor/edges/DependencyEdge.tsx` (o IncludeEdge/ExtendEdge)
- `src/editor/edges/markers.tsx`
- relationshipTool, inspector
- tests / E2E ambos sentidos de drag

## Cambios esperados

Marker estable a zoom y en el spike/export futuro.

## Restricciones

Estereotipos con comillas angulares UML.

## Criterios de aceptación

- [ ] Flecha apunta al caso incluido / caso base según modelo.
- [ ] Drag inverso Include desde «incluido» hacia «que incluye» no se reescribe como el sentido contrario: o es inválido o crea la semántica del drag (origen = handle de salida). Documentar en UI el significado: origen = caso que incluye / que extiende.
- [ ] Screenshot de las tres relaciones aprobado.

## Tests

Dirección, marker, label. Matriz inválida. E2E include y extend.

## Comandos de verificación

```bash
npm run test -- src/editor/edges src/editor/tools
npm run test:e2e -- --project=chromium
npm run check
```

## Stop conditions

- Implementar generalization o extension points.

## Definition of Done

Semántica verificada. interaction/spec cubierta por mvp-spec (actualizar mvp-spec solo si se aclara copy de ayuda, no reglas).
