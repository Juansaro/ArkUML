# TASK-009: Elementos UML y creación directa

## Objetivo

Renderizar y crear Actor, Use Case y System Boundary con notación y feedback coherentes.

## Prioridad

P0

## Dependencias

TASK-004, TASK-008

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/architecture/domain-model.md
- @docs/architecture/rendering-and-export.md
- @.cursor/rules/domain.mdc

## Estado inicial

Canvas placeholder + operaciones de dominio.

## Dentro del alcance

- Nodos memoizados: Actor (figura + nombre), UseCase (elipse + nombre), SystemBoundary (rect + nombre superior).
- Handles en cuatro lados; hit targets suficientes; handles ocultos salvo hover/selección/modo relación.
- Herramienta paleta → click en canvas crea; Escape cancela.
- Nombres por defecto «Actor», «Caso de uso», «Sistema» con contador de presentación si hace falta unicidad visual (nombres duplicados legales).
- Paleta: boundary deshabilitado si ya existe uno.
- Selección automática al crear; anuncio live.
- Conversión screen → flow coordinates.

## Fuera del alcance

- Drag desde paleta, imágenes remotas, rotación, resize de actor/use case.
- Auto-layout, minimapa.
- Relaciones (TASK-013+).

## Archivos / módulos afectados

- `src/editor/nodes/ActorNode.tsx`, `UseCaseNode.tsx`, `SystemBoundaryNode.tsx`
- `src/editor/tools/createElementTool.ts`
- paleta shell
- tests y E2E de creación

## Cambios esperados

Documento default pinta el boundary. Click crea elementos reales en el store.

## Restricciones

Sin assets remotos. `React.memo` en nodos custom.

## Criterios de aceptación

- [ ] Tres notaciones reconocibles a zoom 50–200 %.
- [ ] Posición creada = punto del diagrama, no de pantalla.
- [ ] Imposible un segundo boundary.
- [ ] Creación por mouse y por activación de herramienta con teclado + click.

## Tests

Render/ARIA de nodos. Conversión de coordenadas. E2E crear cada tipo y cancelar con Escape.

## Comandos de verificación

```bash
npm run test -- src/editor/nodes src/editor/tools
npm run test:e2e -- --project=chromium
npm run check
```

## Stop conditions

- Segundo boundary «para paquetes».

## Definition of Done

Apariencia UML coherente. Screenshot estable opcional del diagrama default.
