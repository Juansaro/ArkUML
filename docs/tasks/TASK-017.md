# TASK-017: Accesibilidad y responsive hardening

## Objetivo

Cerrar teclado, feedback y layouts compactos con un alcance a11y honesto.

## Prioridad

P1 (incluido en MVP recomendado)

## Dependencias

TASK-016

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/architecture/testing-strategy.md
- @docs/decisions/ADR-002-diagram-engine.md

## Estado inicial

Editor funcional; a11y parcial.

## Dentro del alcance

- Labels de nodos/relaciones: tipo, nombre, estado.
- Live region única, sin spam.
- Focus management en diálogos, inspector, create, delete.
- `@axe-core/playwright` en shell y estados principales.
- Drawers 768–1023 operables; `<768` aviso claro, datos intactos.
- Contraste y patrones de línea independientes del color.
- Alternativa de inspector para elegir extremos de relación por teclado.
- Documento corto `docs/product/accessibility.md` **solo** si hace falta publicar limitaciones; si cabe en mvp-spec, actualizar esa sección en lugar de un archivo nuevo.

## Fuera del alcance

- Declarar WCAG total.
- Editor paralelo para screen reader.
- Touch/mobile editing.

## Archivos / módulos afectados

- componentes editor, `src/editor/a11y/*`
- `e2e/accessibility.spec.ts`
- mvp-spec o accessibility.md

## Cambios esperados

Cero violaciones axe critical/serious en estados cubiertos.

## Restricciones

No ocultar controles enfocados.

## Criterios de aceptación

- [ ] Flujo crear → editar → conectar (vía inspector si hace falta) → borrar → undo sin mouse.
- [ ] Focus vuelve al control lógico al cerrar diálogos.
- [ ] 768 px operable; `<768` explica limitación.

## Tests

Axe + accessible name/role. E2E `@a11y`. Checklist manual zoom navegador 200 %.

## Comandos de verificación

```bash
npm run test:e2e -- --grep @a11y
npm run test:e2e -- --project=chromium
npm run check
```

## Stop conditions

- Reescribir el canvas «accesible de verdad» retrasando el MVP.

## Definition of Done

Limitaciones publicadas. Issues P0/P1 de a11y del MVP cerrados.
