# TASK-043: Modo Selección en paleta y salida de relación

## Estado documental

Hecha

## Objetivo

La paleta expone **Selección** como primer botón. Tras crear Association,
Include o Extend, el editor vuelve a ese modo: los handles de conexión
se ocultan y se puede seleccionar otro elemento sin Escape.

## Prioridad

P0

## Dependencias

TASK-042

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/product/brand-system.md
- @docs/architecture/rendering-and-export.md
- @docs/tasks/TASK-013.md
- @docs/tasks/TASK-014.md
- @docs/tasks/post-024/13-editor/TASK-042.md
- @.cursor/rules/testing.mdc

## Estado inicial

El tool interno `"select"` ya existe y es el default. Colocar un
elemento ya vuelve a `"select"`. Crear una relación **no**: Include/
Extend/Asociación siguen activos, `data-show-handles` permanece
`true` y todos los nodos lucen «seleccionados». No hay botón de
paleta para entrar en Selección. Copiar, pegar y eliminar ya operan
sobre la selección (FR-13: copy/paste solo actores y casos). Hallazgo
de producto 2026-09-14 (remediación 1.x, no es entrada de catálogo
Post-MVP).

## Dentro del alcance

- Primer control de la paleta: etiqueta **Selección**, `aria-pressed`
  cuando `tool === "select"`. Click con otra herramienta activa
  entra en Selección; click ya en Selección permanece en Selección.
- Icono local 24×24 stroke 2 (puntero) + fila en la matriz de
  `brand-system.md`.
- Tras **un** `commitRelationship` exitoso: `setTool("select")`. La
  relación creada sigue seleccionada. Intento inválido permanece en
  la herramienta de relación.
- Click en un nodo en Selección (sin Shift) deja solo ese elemento;
  no conserva la relación que siguiera seleccionada.
- En Selección: click selecciona elementos y relaciones; copiar,
  pegar y eliminar aplican a lo seleccionado (semántica existente;
  no se inventa copy de relaciones).
- Schema `1` intacto.

## Fuera del alcance

- Atajo de teclado nuevo para Selección.
- Desactivar copy/paste/delete fuera de Selección.
- Waypoints, Generalization, marquee nuevo.
- Reabrir ADR. Paquetes nuevos. Bump de schema.

## Archivos / módulos afectados

- `src/editor/components/shell/paletteTools.ts`
- `src/editor/components/shell/Palette.tsx`
- `src/editor/components/common/icons.tsx`
- `src/editor/components/common/Icon.test.tsx`
- `src/editor/components/shell/EditorShell.test.tsx`
- `src/editor/tools/relationshipTool.ts`
- `src/editor/tools/relationshipTool.test.ts`
- `src/editor/canvas/DiagramCanvas.tsx`
- `docs/product/mvp-spec.md`
- `docs/product/brand-system.md`
- `docs/architecture/rendering-and-export.md`
- `e2e/include-extend.spec.ts`
- `e2e/association.spec.ts`
- `e2e/relationships.spec.ts`
- `e2e/editor-flow.spec.ts`
- `e2e/accessibility.spec.ts`
- `e2e/tooltips.spec.ts`
- `e2e/__screenshots__/shell-*.png` (layout de paleta)
- `docs/tasks/post-024/13-editor/TASK-043.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Con Include activo, conectar dos casos vuelve a Selección: handles
ocultos, botón Selección pulsado. Click en otro elemento lo
selecciona sin Escape. Para un segundo Include hay que pulsar
Include otra vez.

## Restricciones

- `src/domain` sin React/DOM/xyflow.
- Pin `html-to-image@1.11.11` intacto.
- Sin `any` injustificado.

## Criterios de aceptación

- [x] El primer botón de la paleta se llama **Selección** y está
      pulsado al abrir el editor.
- [x] Tras crear Association, Include o Extend, Selección queda
      pulsada, la herramienta de relación no, y `data-show-handles`
      es `false`.
- [x] Tras esa creación, click en otro elemento lo selecciona sin
      pulsar Escape.
- [x] Un intento de conexión inválido permanece en la herramienta de
      relación (handles visibles).
- [x] Copiar, pegar y eliminar siguen aplicando a la selección
      vigente (actores/casos en copy-paste; Delete también relaciones).
- [x] Round-trip workspace: ninguna clave nueva; `schemaVersion` `1`.

## Tests

Unidad: `commitRelationship` deja `tool === "select"`; inválido no.
Palette/EditorShell: botón Selección primero, pressed por default,
vuelve desde Include. Icono `select` en el inventario.
E2E: Include → crear → Selección pressed / handles hidden; segundo
Include exige re-click; tooltip de Selección; baselines del shell.

## Comandos de verificación

```bash
npm run test -- src/editor/tools/relationshipTool.test.ts src/editor/components/common/Icon.test.tsx src/editor/components/shell/EditorShell.test.tsx
npx playwright test e2e/association.spec.ts e2e/include-extend.spec.ts e2e/relationships.spec.ts e2e/editor-flow.spec.ts e2e/tooltips.spec.ts e2e/shell-layout.spec.ts --project=chromium
npm run check
```

## Stop conditions

- Se pide un atajo de herramienta o desactivar Delete fuera de
  Selección (no está en el hallazgo; parar y preguntar).
- Se pide un paquete o bump de schema.

## Definition of Done

Selección es el primer botón; crear una relación vuelve a ese modo;
criterios `[x]` con evidencia.

## Evidencia de cierre

2026-09-14. Criterios `[x]`. Defecto 1.x: Include/Extend ya no dejan
los handles de conexión visibles. El primer control de la paleta es
**Selección** (pressed por default). `commitRelationship` exitoso
vuelve a `tool === "select"`; inválido permanece en la herramienta.
Click en un nodo (sin Shift) reemplaza la selección y no conserva
la relación. Schema `1` intacto. Copy/paste/delete no cambian de
semántica (FR-13).

Comandos realmente corridos:

```bash
npx vitest run src/editor/tools/relationshipTool.test.ts src/editor/components/common/Icon.test.tsx src/editor/components/shell/EditorShell.test.tsx src/editor/canvas/DiagramCanvas.test.tsx
npx playwright test e2e/association.spec.ts e2e/include-extend.spec.ts e2e/relationships.spec.ts e2e/editor-flow.spec.ts e2e/tooltips.spec.ts e2e/accessibility.spec.ts e2e/shell-layout.spec.ts --project=chromium
npx eslint src/editor/components/shell/paletteTools.ts src/editor/components/shell/Palette.tsx src/editor/components/common/icons.tsx src/editor/tools/relationshipTool.ts src/editor/canvas/DiagramCanvas.tsx
npx prettier --write <archivos de la TASK>
```

Unidad: 43/43 en los cuatro archivos. E2E Chromium: 28/28 en la
primera tanda (tras actualizar baselines del shell) más 14/14 de
relationships/tooltips/accessibility. Lint de los módulos tocados:
OK. `npx tsc -b --noEmit` sigue fallando por
`e2e/document-file.spec.ts` (variable `canvas` no usada; sucio
previo) y por `SVGPathElement`/`DOMPoint` en el evaluate de
include interno (TASK-042, no tocado en esta TASK salvo re-click
de Include). `npm run check` no se da por verde entero por ese
typecheck previo.

