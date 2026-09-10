# TASK-038: Import/export JSON de usuario

## Estado documental

Hecha

## Objetivo

El usuario descarga y abre el documento **activo** como archivo JSON de
intercambio, sin sustituir el autosave ni cambiar el adapter de workspace.

## Prioridad

P0

## Dependencias

TASK-037

## Contexto obligatorio

- @docs/product/post-mvp-spec.md
- @docs/architecture/schema-evolution.md
- @docs/architecture/domain-model.md
- @docs/decisions/ADR-004-persistence.md
- @docs/decisions/ADR-003-state-management.md
- @docs/product/brand-system.md
- @docs/product/mvp-spec.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

Wave 2 congelada: este archivo es W14-03 / FR-P03. El envelope
`arkuml-usecase-json` / `formatVersion` 1 está cerrado en
`schema-evolution.md`. El workspace sigue siendo
`LocalStorageDiagramRepository` + clave `arkuml:workspace:v1`. Schema `1`.
`z.strictObject`. No hay I/O de archivo de usuario. Top bar: Nuevo, undo,
redo, Exportar (PNG/JPG), Ayuda.

## Dentro del alcance

- Envelope exacto de `schema-evolution.md`:

  ```text
  { format: "arkuml-usecase-json", formatVersion: 1,
    document: DiagramDocument, view: { x, y, zoom } }
  ```

- Exportar: serializar el documento activo y el viewport actual. No incluir
  historial, selección ni herramienta. Nombre de archivo: título saneado +
  `.arkuml.json` (si el título queda vacío: `diagrama.arkuml.json`).
- Importar: `JSON.parse` → validar con Zod estricto del envelope y del
  `DiagramDocument` schema `1` → sustituir documento y viewport en memoria
  → vaciar la pila de historial (mismo efecto que «Nuevo diagrama») → el
  autosave escribe el `WorkspaceSnapshot` interno. El blob de localStorage
  **no** es el formato público.
- Si el workspace tiene cambios, la confirmación reutiliza el patrón de
  FR-11: mismo cuerpo («Se perderá el diagrama actual. Esta acción no se
  puede deshacer.»), título «Abrir archivo», confirmar «Abrir archivo».
  Cancelar no toca datos.
- Rechazo (no se escribe el workspace ni el documento en memoria): JSON
  inválido; `format` ≠ `arkuml-usecase-json`; `formatVersion` ≠ `1`;
  `schemaVersion` ≠ `1`; claves de más; `kind` desconocido. Copy visible:
  «El archivo no es un documento ArkUML válido.» Sin dump de Zod.
- Chrome: dos acciones en la top bar, icon-only, hit 32×32. Addendum de
  `brand-system.md` **antes** de pintar, mismo contrato SVG (viewBox 24,
  stroke 2, `currentColor`, sin kit). Trazos:

  **`openFile`** — documento con flecha de entrada:

  ```text
  <path d="M7 3h7l5 5v13H7z" />
  <path d="M14 3v5h5" />
  <path d="M12 18v-6" />
  <path d="M9 15l3-3 3 3" />
  ```

  **`saveJson`** — documento con flecha de salida:

  ```text
  <path d="M7 3h7l5 5v13H7z" />
  <path d="M14 3v5h5" />
  <path d="M12 10v6" />
  <path d="M9 13l3 3 3-3" />
  ```

  Nombres accesibles: «Abrir» / «Guardar JSON». Descripciones: «Abrir un
  archivo ArkUML.» / «Descargar el diagrama como JSON.»
- Input de archivo: `accept=".json,application/json"`. Sin atajo nuevo
  (Ctrl/Cmd+S sigue siendo flush del autosave).
- Validación del envelope en un módulo puro (p. ej.
  `src/domain/diagram/documentFile.ts`); `src/domain` no importa DOM.

## Fuera del alcance

- IndexedDB, multi-documento, sync, `migrate()`, schema `>1`.
- Reabrir ADR-004 o ADR-003.
- Reutilizar el envelope para clases (W17-13).
- PNG/JPG, clipboard (TASK-040), minimap (TASK-039).
- Atajos Ctrl+O / Ctrl+S distintos de los del MVP.
- Paquetes nuevos.

## Archivos / módulos afectados

- `src/domain/diagram/documentFile.ts` (nuevo) y su test
- `src/editor/components/shell/TopBar.tsx` (y estilos si hace falta)
- `src/editor/components/common/icons.tsx` / `Icon.tsx`
- diálogo de confirmación de apertura (reutilizar estilos de
  `NewDiagramDialog` o extraer el patrón; no un segundo diseño)
- store: reemplazo de documento + viewport + clear historial
- `docs/product/brand-system.md` (addendum de los dos iconos y filas de
  top bar)
- E2E de round-trip archivo
- `docs/tasks/post-024/14-persistence/TASK-038.md`
- `docs/tasks/post-024/README.md` (estado/evidencia)

## Cambios esperados

Guardar JSON y volver a abrirlo restaura elementos, relaciones y viewport.
Un JSON ajeno o un snapshot de localStorage se rechaza. Autosave sigue en
`arkuml:workspace:v1`. Schema `1` intacto.

## Restricciones

- No cambiar `DiagramRepository`.
- No serializar la pila de historial.
- Pines intactos. Sin `any`. `src/domain` sin React/DOM/xyflow.

## Criterios de aceptación

- [x] El JSON exportado tiene `format` `arkuml-usecase-json`,
      `formatVersion` 1, `schemaVersion` 1 y `view` con x/y/zoom.
- [x] Round-trip: exportar → importar restaura documento y viewport;
      historial vacío tras importar.
- [x] Un `WorkspaceSnapshot` (clave interna) se rechaza; el documento
      actual no cambia.
- [x] JSON malformado, `format` distinto o clave de más: mensaje visible;
      storage intacto.
- [x] Con cambios pendientes, cancelar «Abrir archivo» no muta; confirmar
      sustituye.
- [x] `brand-system.md` lista `openFile` y `saveJson`; sin paquete de
      iconos.
- [x] Schema `1` / `storageVersion` `1`; ninguna clave nueva en el
      documento persistido (el archivo de usuario no es el snapshot).

## Tests

Unidad del parser/serializer: envelope válido, cada motivo de rechazo,
`strictObject`. Store o componente: confirmación cancelar/confirmar.
E2E Chromium: exportar, importar, ver un actor conocido; rechazar un
`.json` basura.

## Comandos de verificación

```bash
npm run test -- src/domain/diagram
npm run test:e2e -- --project=chromium
npm run check
```

Si el E2E vive en un spec dedicado, sustituir esa ruta. `npm run check`
al cierre.

## Stop conditions

- Se pide IndexedDB, lista de documentos o reabrir ADR-004.
- Se pide persistir historial en el archivo.
- Se pide aceptar schema `>1` o un `kind` distinto de `use-case`.

## Definition of Done

FR-P03 observable; autosave y schema `1` intactos; criterios `[x]` con
evidencia.

## Evidencia de cierre

2026-09-09. Criterios `[x]`. FR-P03 observable: Guardar JSON / Abrir el
documento activo. Envelope `arkuml-usecase-json` / `formatVersion` 1 /
`schemaVersion` 1. Autosave sigue en `arkuml:workspace:v1`. Un
`WorkspaceSnapshot` o JSON basura se rechaza con «El archivo no es un
documento ArkUML válido.» sin dump de Zod. Cancelar «Abrir archivo» no
muta. Historial vacío tras importar. Iconos `openFile` / `saveJson` en
`brand-system.md`, sin kit. `DiagramRepository` intacto.

Comandos realmente corridos:

```bash
npm run test -- src/domain/diagram
npx playwright test e2e/document-file.spec.ts --project=chromium
npm run test:e2e -- --project=chromium
npm run lint
npm run typecheck
npm run test
npm run build
```

Unidad: 301/301. Dominio `src/domain/diagram`: incluido en esa suite.
E2E Chromium: 57/57 (`document-file.spec.ts` 3/3; round-trip, rechazo de
basura y snapshot interno, cancelar confirmación). Lint, typecheck y
`vite build` OK.

`npm run check` falla en `format:check` por los mismos archivos de
chrome/tooltips de TASK-024 (028–038). Esta TASK no los reformateó. Los
archivos tocados pasan Prettier.

Baselines de shell (1024/1440/1920) actualizados por los dos botones de
la top bar. Baseline del diagrama de referencia regenerado: el UML no
cambia; el recorte enmascara chrome de zoom cuyo borde difería.

