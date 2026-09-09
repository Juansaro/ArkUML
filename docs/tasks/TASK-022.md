# TASK-022: Razón visible al conectar desde el inspector

## Objetivo

Cumplir FR-07 también en el formulario del inspector: un par origen/destino inválido muestra la misma razón que el drag y no muta.

## Prioridad

P1

## Dependencias

TASK-014, TASK-020

## Contexto obligatorio

- @docs/product/mvp-spec.md (FR-07, inspector, live region)
- @docs/architecture/testing-strategy.md

## Estado inicial

El drag de handles llama `canConnect` y anuncia `error.message` en la live region. El `ConnectForm` del inspector **filtra** destinos incompatibles: al elegir Asociación con un caso de uso como origen, Destino queda vacío y Conectar deshabilitado, sin el texto de `INVALID_CONNECTION`. El checklist RC lo registró como «no muta, pero sin razón visible».

## Dentro del alcance

- Cuando el origen elegido no admite ningún destino válido (o el usuario fuerza un par inválido), mostrar `canConnect(…).error.message` junto al formulario y/o en la live region existente.
- Association caso–caso, Include/Extend reflexivo o con actor: misma copy que el dominio (`rules.ts`), sin strings sueltos.
- El documento no cambia. Conectar sigue inhabilitado si el par no es válido.
- Test del inspector o del tool: origen inválido → mensaje, cero relaciones nuevas.

## Fuera del alcance

- Segunda región `aria-live`.
- Validar ciclos Include/Extend (fuera del MVP).
- Cambiar la matriz UML ni normalización Actor→UseCase.

## Archivos / módulos afectados

- `src/editor/components/Inspector/ConnectForm.tsx`
- `src/editor/tools/relationshipTool.ts` si el mensaje se centraliza
- tests colocalizados (`ConnectForm` / `relationshipTool` / `Inspector.test.tsx`)
- opcional: `e2e/relationships.spec.ts` o `@a11y`

## Cambios esperados

Elegir Asociación + origen «Caso de uso» anuncia o muestra la razón de tipos; no se crea edge.

## Restricciones

`src/domain` sigue puro. Reutilizar mensajes de `rules.ts` / `canConnect`.

## Criterios de aceptación

- [x] Intento inválido desde el inspector: razón visible, sin mutación.
- [x] Intento válido (Actor→Caso, Include/Extend entre casos distintos) sigue igual.
- [x] Una sola live region; avisos geométricos siguen en el inspector, no en esa región.

## Tests

Unit/integration del formulario o `commitRelationship`. E2E corto si el mensaje vive en `editor-live`.

## Comandos de verificación

```bash
npm run test -- src/editor/components/Inspector src/editor/tools/relationshipTool.test.ts
npm run check
```

## Stop conditions

- Duplicar el live region o inventar copy distinta del dominio.

## Definition of Done

FR-07 cubierto por teclado/inspector con la misma razón que el drag. Diff limitado a inspector/tool/tests.

## Evidencia de cierre

Registrada en TASK-028 (2026-09-09). El código versionado cumple FR-07 en el inspector: `ConnectForm` muestra `connectionRejectionMessage` (`data-testid="connect-error"`) y no envía si el par es inválido; `Inspector.test.tsx` cubre asociación caso–caso (razón, Conectar disabled, cero relaciones) e include reflexivo vs válido. `relationshipTool.test.ts` cubre `connectionRejectionMessage`. No se infiere de conversaciones: el árbol `src/` y los tests son la evidencia.
