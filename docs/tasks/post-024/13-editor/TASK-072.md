# TASK-072: Botón de paleta para el ajuste

## Estado documental

Hecha

## Objetivo

Un botón de la paleta enciende y apaga el ajuste al arrastrar, en
cualquier kind de diagrama.

## Prioridad

P1

## Dependencias

TASK-071

## Contexto obligatorio

- @docs/tasks/post-024/13-editor/TASK-071.md
- @docs/product/brand-system.md
- @docs/product/mvp-spec.md
- @.cursor/rules/testing.mdc

## Estado inicial

TASK-071 está `Lista` y, al implementar esta, debe estar `Hecha`:
existe `snapEnabled` (default apagado) y el drag ya imanta cuando está
encendido. La paleta tiene Selección, elementos y relaciones por kind.
No hay control para el flag.

## Dentro del alcance

- Botón **Ajuste** en la paleta, visible en todos los kinds (incluido
  el drawer compacto, que reutiliza la paleta).
- No es una herramienta de creación: no cambia `tool` ni el modo
  Selección / relación.
- `aria-pressed` refleja `snapEnabled`. Pulsarlo alterna el flag.
- Tooltip: «Ajustar al arrastrar: ejes de otros elementos y grilla de
  16 px.»
- Icono SVG local, en el conjunto ya usado por la paleta. Sin webfont
  ni kit externo.
- El botón no entra en el PNG/JPG (es chrome, como el resto de la
  paleta).
- Al cambiar de documento o de kind, el flag de sesión se conserva
  (no es parte del documento). Recargar la página vuelve a apagado,
  porque no se persiste.

## Fuera del alcance

- Cambiar la matemática del snap (TASK-071).
- Atajo de teclado nuevo.
- Persistir el flag en localStorage o en el envelope.
- Auto-layout, temas, un segundo botón por kind.
- Schema, ADRs, paquetes.

## Archivos / módulos afectados

- `src/editor/components/shell/Palette.tsx`
- `src/editor/components/shell/Palette.module.css` (solo si hace falta
  separar el botón de las herramientas)
- `src/editor/components/common/icons.tsx`
- tests de paleta colocalizados, si existen
- `e2e/activity.spec.ts` o un spec de paleta/drag ya existente
- `docs/tasks/post-024/13-editor/TASK-072.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

El usuario pulsa Ajuste (queda oprimido), arrastra una lifeline y esta
se pega al eje de otra o a la grilla. Vuelve a pulsar y el arrastre
sigue el puntero sin imán.

## Restricciones

- El botón es operable por teclado (foco y activación como el resto de
  `ToolButton`).
- Nombre accesible «Ajuste». Sin `any` injustificado.
- No añadir el id `ajuste` al union `EditorTool`.

## Criterios de aceptación

- [x] La paleta muestra Ajuste en casos de uso, secuencia y al menos
      un tercer kind (actividades).
- [x] El estado inicial es no oprimido (`snapEnabled` false).
- [x] Pulsar lo marca oprimido y el drag siguiente imanta; pulsar de
      nuevo lo apaga y el drag no imanta.
- [x] Pulsar Ajuste no selecciona la herramienta Actor, Lifeline ni
      ninguna relación.
- [x] El nombre accesible es «Ajuste» y el tooltip es el de esta TASK.
- [x] El botón no aparece en el raster.

## Tests

Paleta: pressed alterna y `tool` no cambia. E2E mínimo: en secuencia,
activar Ajuste, arrastrar una lifeline hacia el eje vertical de otra
y comprobar que las cabeceras quedan alineadas; desactivar y comprobar
que un arrastre corto no salta a la grilla.

## Comandos de verificación

```bash
npm run test -- src/editor/components/shell
npx playwright test e2e/sequence.spec.ts --project=chromium
npm run typecheck
npm run lint
```

## Stop conditions

- Se pide persistir el ajuste entre recargas.
- Se pide que Ajuste sea la herramienta activa y desplace a Selección.
- Hace falta un paquete de iconos.

## Definition of Done

El botón alterna el flag en todos los kinds sin cambiar la herramienta;
el E2E de secuencia muestra el imán; criterios `[x]` con evidencia.

## Evidencia de cierre

2026-09-29. Criterios `[x]`. El botón Ajuste está en la paleta de todos
los kinds (casos de uso, secuencia, actividades y el drawer compacto,
que reutiliza `Palette`). `aria-pressed` sigue `snapEnabled` (default
`false`). Pulsarlo no cambia `tool`: Actor, Lifeline y las relaciones
siguen como estaban. El nombre accesible es «Ajuste» y el tooltip es
«Ajustar al arrastrar: ejes de otros elementos y grilla de 16 px.»
El flag vive en la UI de sesión: sigue encendido al crear un diagrama
de secuencia y al volver al anterior; no entra en `EditorTool`. El
botón es chrome de paleta, fuera del viewport que se rasteriza. Sin
commit.

Comandos realmente corridos:

```bash
npm run test -- src/editor/components/shell src/editor/components/common/Icon.test.tsx
npx playwright test e2e/sequence.spec.ts --project=chromium
npx eslint src/editor/components/shell/Palette.tsx src/editor/components/shell/EditorShell.test.tsx src/editor/components/common/icons.tsx src/editor/components/common/Icon.test.tsx src/editor/store/selectors.ts e2e/sequence.spec.ts
npm run typecheck
npm run lint
```

Unidad de paleta e icono: 3 archivos, 40 tests. Secuencia en Chromium: 2 tests. ESLint de los archivos tocados: limpio. `npm run typecheck` falla solo en `e2e/include-extend.spec.ts` (`SVGPathElement`, `DOMPoint`), ajeno a este cambio. `npm run lint` falla en e2e previos (`alignment-guides`, `include-extend`, `minimap`, `performance`); ningún archivo de esta TASK. `npm run check` se detiene en `format:check` por Prettier de archivos ajenos (92); ninguno de esta TASK.
