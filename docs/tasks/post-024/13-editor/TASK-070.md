# TASK-070: Resize del límite sin trasladar los casos

## Estado documental

Lista

## Objetivo

Redimensionar el **Límite del sistema** no desplaza los casos de uso
que contiene; mover el límite sí los arrastra, como hasta ahora.

## Prioridad

P0

## Dependencias

TASK-011

## Contexto obligatorio

- @docs/architecture/domain-model.md
- @docs/product/mvp-spec.md
- @docs/tasks/TASK-011.md
- @docs/decisions/ADR-003-state-management.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

TASK-011 está `Hecha`. Un caso con `parentId` guarda coordenadas
relativas al `SystemBoundary`. `moveElements` mueve los hijos al
mover el límite. `resizeBoundary` solo sustituye la geometría del
límite (mínimo 320×240) y no ajusta a los hijos. Hallazgo de producto
2026-09-28: al cambiar el tamaño, si el origen `x`/`y` se mueve, los
casos interiores se ven trasladados. No es entrada de catálogo
Post-MVP. Schema `3` en el producto actual; el documento de casos de
uso sigue en su `schemaVersion` vigente.

## Dentro del alcance

- **Mover** el límite sigue arrastrando los casos contenidos
  (coordenadas relativas). El E2E que espera un desplazamiento al
  arrastrar el título del boundary se conserva.
- **Redimensionar** conserva la posición absoluta en el lienzo. Si
  cambia el origen, se ajustan las coordenadas relativas de los casos
  con ese `parentId`. Si solo cambian ancho y alto, las relativas no
  se tocan.
- Mínimo 320×240 intacto. Un gesto de resize = una entrada de
  historial; undo restaura límite e hijos.
- Si al encoger el centro del caso queda fuera del rectángulo nuevo,
  `reparentUseCase` lo pasa al lienzo **sin salto visual** (la
  conversión de coordenadas ya definida).
- Enmendar en `domain-model.md` la fila `resizeBoundary`: además del
  mínimo, el resize no traslada la posición absoluta de los hijos.

## Fuera del alcance

- Dejar de arrastrar los hijos al **mover** el boundary.
- Waypoints, routing, auto-layout.
- Bump de schema, paquetes nuevos, reabrir ADRs.
- Actores (nunca tienen `parentId`).

## Archivos / módulos afectados

- `src/domain/diagram/operations.ts` (`resizeBoundary`)
- tests de operaciones de dominio colocalizados
- `src/editor/interactions/boundaryResize.ts`
- `src/editor/interactions/boundaryResize.test.ts`
- `src/editor/interactions/reparent.ts` (solo si el encoger debe
  reparentar al soltar)
- `docs/architecture/domain-model.md` (fila `resizeBoundary`)
- `e2e/reparent-resize.spec.ts`
- `docs/tasks/post-024/13-editor/TASK-070.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Un caso dentro del sistema permanece en el mismo sitio del lienzo
mientras se agranda o se encoge el límite desde un asa que mueve el
origen. Arrastrar el límite entero sigue llevándose el caso.

## Restricciones

- `src/domain` sin React, DOM ni `@xyflow/react`.
- No persistir tipos de `@xyflow/react`.
- Sin `any` injustificado. No borrar el E2E de movimiento del padre.
- Sin bump de `schemaVersion`.

## Criterios de aceptación

- [ ] Resize que solo cambia ancho/alto no modifica `x`/`y` relativos
      de los casos contenidos.
- [ ] Resize que cambia el origen del límite ajusta las coordenadas
      relativas para que la posición absoluta del caso no cambie.
- [ ] Mover el límite sigue desplazando los casos contenidos (el
      caso del E2E de arrastre del título sigue cumpliéndose).
- [ ] Por debajo de 320×240 el resize no se aplica.
- [ ] Si el centro del caso queda fuera del rectángulo encogido, deja
      de tener `parentId` y no salta en el lienzo.
- [ ] Undo del resize restaura geometría del límite y de los hijos
      (y el `parentId` si hubo reparent).
- [ ] `domain-model.md` describe el resize sin traslado absoluto.

## Tests

Unidad de `resizeBoundary`: origen que cambia frente a solo ancho/alto;
hijo cuyo centro sale del rectángulo. E2E: el arrastre del boundary
sigue moviendo al hijo; un resize desde un asa que mueve el origen no
traslada el caso (ajustar el spec si hoy asume el salto).

## Comandos de verificación

```bash
npm run test -- src/domain/diagram/operations.test.ts src/editor/interactions/boundaryResize.test.ts src/editor/interactions/reparent.test.ts
npx playwright test e2e/reparent-resize.spec.ts --project=chromium
npm run typecheck
npm run lint
```

## Stop conditions

- Se pide que mover el boundary deje los hijos quietos.
- Hace falta un campo persistido nuevo o bump de schema.
- El mínimo 320×240 debe cambiar.

## Definition of Done

Resize no traslada casos; mover el límite sí; reparent al salir sin
salto; fila de `domain-model.md` alineada; criterios `[x]` con
evidencia.

## Evidencia de cierre

Pendiente. Al cerrar: fecha, criterios comprobados, comandos realmente
ejecutados y commit/PR/handoff si existe.
