# TASK-010: Selección, edición de nombre y movimiento

## Objetivo

Manipulación directa de elementos: selección, rename y drag con una sola entrada de historial.

## Prioridad

P0

## Dependencias

TASK-009

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/architecture/architecture.md
- @docs/decisions/ADR-003-state-management.md

## Estado inicial

Elementos se crean y pintan.

## Dentro del alcance

- Selección simple, Shift y marquee.
- Click en pane limpia selección.
- Edición de nombre: doble click / F2 / Enter / inspector; Enter confirma; Escape cancela; blur confirma si válido.
- Vacío o >80: conserva anterior + error.
- Drag de nodos con transacción única (`begin` al start, `commit` al stop).
- Inspector muestra tipo y nombre de la selección (uno; si múltiple, estado «n seleccionados» sin edición batch).
- Flechas 1 px / Shift+flechas 16 px pueden esperar a TASK-012; si es barato, incluir movimiento por teclado aquí. Preferible TASK-012 para no mezclar. **No** incluir atajos de delete aquí.

## Fuera del alcance

- Reparent/resize boundary (TASK-011).
- Confirmación por cada move.
- Alineación inteligente.

## Archivos / módulos afectados

- `src/editor/interactions/*`
- `src/editor/components/Inspector/*`
- nodos (inline edit)
- tests / E2E

## Cambios esperados

Inspector no se re-renderiza cada frame de drag (selector de ids).

## Restricciones

Sin forzar geometría de boundary todavía.

## Criterios de aceptación

- [ ] Un drag = un undo.
- [ ] Rename válido persiste; inválido no pisa.
- [ ] Marquee selecciona varios; inspector no rompe.

## Tests

Edición/cancelación. E2E drag y selección múltiple (sin exigir reparent).

## Comandos de verificación

```bash
npm run test -- src/editor/interactions src/editor/components/Inspector
npm run test:e2e -- --project=chromium
npm run check
```

## Stop conditions

- Batch rename o propiedades visuales.

## Definition of Done

Mouse usable para seleccionar, mover y nombrar. Warnings de contención aún no obligatorios (TASK-011).
