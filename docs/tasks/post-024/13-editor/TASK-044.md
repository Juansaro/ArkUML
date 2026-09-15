# TASK-044: Ocultar paleta e inspector en desktop

## Estado documental

Hecha

## Objetivo

En ≥1024 px, letras `<<` / `>>` arriba de cada columna ocultan o
restauran paleta e inspector. Al ocultar, el riel residual muestra la
letra invertida en esa esquina.

## Prioridad

P1

## Dependencias

TASK-043

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/product/brand-system.md
- @docs/architecture/architecture.md
- @docs/tasks/TASK-007.md
- @docs/tasks/TASK-017.md
- @.cursor/rules/testing.mdc

## Estado inicial

≥1024 px las columnas de paleta e inspector son fijas. Los botones
**Paleta** / **Inspector** de la top bar existen, pero
`brand-system.md` los limita a `max-width: 1023px` (drawers).
768–1023 px ya abre un overlay y cierra el otro; Escape y «Cerrar
paneles» aplican solo a ese modo. Chrome de sesión, no el documento.
Hallazgo de producto 2026-09-14 (remediación 1.x, no es entrada de
catálogo Post-MVP).

## Dentro del alcance

- Desktop ≥1024: letras `<<` / `>>` **arriba** de paleta e inspector,
  ghost (sin fondo ni borde). Nombres «Paleta» / «Inspector», tooltip
  «Abrir …» / «Cerrar …» según `aria-expanded`, `aria-controls`.
- Los toggles de paleta/inspector de la **top bar** siguen solo en
  drawers 768–1023 px.
- Desktop: paneles visibles al abrir el editor. Cada riel oculta o
  restaura **solo** ese panel. El grid cede la columna al lienzo y
  deja el riel. Independientes: ocultar uno no cierra el otro.
- Cuerpo del panel oculto: `aria-hidden` + `inert`. El riel permanece
  tabulable.
- Compacto 768–1023: drawers sin cambio (exclusión mutua, backdrop,
  Escape devuelve el foco al toggle de la top bar).
- Al cruzar el breakpoint se restaura el default del modo (desktop
  ambos visibles; compacto ambos cerrados).
- Estado local de UI: no documento, no historial, no localStorage.
- Schema `1` intacto.

## Fuera del alcance

- Atajo de teclado nuevo para los paneles.
- Persistencia del colapso (workspace, schema, preferencia).
- Un solo botón que oculte ambos, o drawers en ≥1024.
- Reabrir ADR. Paquetes nuevos. Bump de schema.
- Cambiar el aviso `<768` px.

## Archivos / módulos afectados

- `src/editor/components/shell/EditorShell.tsx`
- `src/editor/components/shell/EditorShell.module.css`
- `src/editor/components/shell/TopBar.tsx`
- `src/editor/components/shell/TopBar.module.css`
- `src/editor/components/common/icons.tsx`
- `src/editor/components/common/Icon.test.tsx`
- `src/editor/components/common/ToolButton.tsx`
- `src/editor/components/common/ToolButton.module.css`
- `src/app/styles/tokens.css`
- `src/editor/components/shell/EditorShell.test.tsx`
- `docs/product/mvp-spec.md`
- `docs/product/brand-system.md`
- `docs/architecture/architecture.md`
- `e2e/shell-layout.spec.ts`
- `e2e/tooltips.spec.ts`
- `e2e/__screenshots__/shell-*.png`
- `docs/tasks/post-024/13-editor/TASK-044.md`
- `docs/tasks/post-024/README.md`
- `docs/tasks/README.md`

## Cambios esperados

A 1440×900, `<<` está en el borde de Paleta y `>>` en el de Inspector.
Click en `<<` deja un riel con `>>` a la izquierda del lienzo; el
inspector permanece. Click en esa flecha restaura la paleta. En 800 px
el comportamiento de drawers no cambia.

## Restricciones

- `src/domain` sin React/DOM/xyflow.
- Pin `html-to-image@1.11.11` intacto.
- Sin `any` injustificado.
- Escape en desktop no oculta paneles (sigue cancelando herramienta /
  tooltip / diálogo).

## Criterios de aceptación

- [x] ≥1024 px: rieles Paleta e Inspector visibles, `aria-expanded`
      `true`, iconos `<<` / `>>`; no están en la top bar.
- [x] Click en el riel de Paleta oculta la navegación (inert /
      `aria-hidden`); el riel permanece con `>>`; el inspector sigue
      visible; no aparece «Cerrar paneles».
- [x] Click en el riel de Inspector oculta el complementary; el riel
      permanece con `<<`; la paleta sigue visible si no se ocultó.
- [x] Segundo click restaura el panel; el lienzo vuelve a las tres
      columnas (más rieles) cuando ambos están visibles.
- [x] 768–1023 px: drawers, exclusión mutua, Escape y backdrop
      intactos; toggles en la top bar.
- [x] Round-trip workspace: ninguna clave nueva; `schemaVersion` `1`.

## Tests

Unidad (jsdom): desktop (matchMedia no compacto) oculta/restaura de
forma independiente, sin backdrop, Escape no cierra; compacto stub
conserva drawers.
E2E: ≥1024 hide/show paleta e inspector; drawers a 800 px; tooltip
de Paleta en desktop; baselines del shell.

## Comandos de verificación

```bash
npm run test -- src/editor/components/shell/EditorShell.test.tsx
npx playwright test e2e/shell-layout.spec.ts e2e/tooltips.spec.ts --project=chromium
npm run check
```

## Stop conditions

- Se pide persistir el colapso o un atajo nuevo.
- Se pide un paquete o bump de schema.

## Definition of Done

Los paneles se ocultan y restauran en desktop; drawers compactos
intactos; criterios `[x]` con evidencia.

## Evidencia de cierre

2026-09-14. Criterios `[x]`. Remediación 1.x: en ≥1024 px los rieles
con chevrons `<<` / `>>` ocultan y restauran paleta e inspector; al
ocultar queda el riel con la flecha invertida. Top bar Paleta/Inspector
solo en drawers 768–1023. Chrome de sesión. Schema `1` intacto.

Comandos realmente corridos (tras el ajuste de rieles):

```bash
npx vitest run src/editor/components/shell/EditorShell.test.tsx src/editor/components/common/Icon.test.tsx src/editor/components/common/ToolButton.test.tsx
npx playwright test e2e/shell-layout.spec.ts e2e/tooltips.spec.ts --project=chromium --update-snapshots
npx eslint src/editor/components/shell/EditorShell.tsx src/editor/components/shell/TopBar.tsx src/editor/components/common/ToolButton.tsx src/editor/components/common/icons.tsx
```

Unidad: 26/26. E2E Chromium: 13/13. Navegador 1440×900: `<<` oculta
paleta y deja `>>` en el riel izquierdo; Inspector permanece.
