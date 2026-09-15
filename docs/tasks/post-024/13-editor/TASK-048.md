# TASK-048: Selector de diagramas (combobox + búsqueda)

## Estado documental

Lista

## Objetivo

La top bar muestra un combobox del documento activo: al abrirlo, una
barra de búsqueda filtra la biblioteca y elegir una fila la activa.
Diseño con tokens existentes, sin `<select>` nativo ni paquetes extra.

## Prioridad

P0

## Dependencias

TASK-047

## Contexto obligatorio

- @docs/product/brand-system.md
- @docs/product/post-mvp-spec.md
- @docs/decisions/ADR-007-workspace-library.md
- @docs/architecture/diagram-kinds.md
- @docs/product/mvp-spec.md
- @.cursor/rules/testing.mdc

## Estado inicial

TASK-047 dejó biblioteca y store. La top bar muestra el título del
documento como texto. «Nuevo» aún sustituye o debe pasar a **añadir**
según ADR-007. No hay UI de secuencia; el combobox lista lo que exista
(en 1.x migrado: un casos de uso; en tests: varios).

## Dentro del alcance

- Sustituir el título estático de la top bar por el **combobox**
  especificado en `brand-system.md` (addendum de esta TASK si hace falta
  copiar medidas ya cerradas en el freeze).
- Trigger: título del activo, ellipsis, kind como texto secundario
  («Casos de uso» / «Secuencia» cuando exista). Nombre accesible:
  «Diagrama activo».
- Listbox: input de búsqueda arriba (placeholder «Buscar diagrama»);
  filtro por `metadata.title`, recorte, sin distinción de mayúsculas;
  vacío: «Sin coincidencias.»
- Activar una fila: cambia `activeDocumentId`, restaura su `view`,
  muestra su pila de historial. Sin diálogo de confirmación (el anterior
  sigue en la biblioteca; autosave ya aplica).
- «Nuevo»: **añade** un documento del **mismo kind** que el activo,
  título por defecto de ese kind, lo activa. Sin confirmación FR-11.
- Borrar desde el listbox (botón por fila o acción explícita):
  confirmación; copy de pérdida de **ese** diagrama; deshabilitado si
  solo queda uno (motivo visible, patrón `aria-disabled`).
- Teclado: patrón combobox (Escape cierra el listbox sin cerrar
  diálogos del editor; flechas, Enter). Foco visible. Hit del trigger
  altura 32 px.
- Sin librerías de combobox. CSS modules + tokens. Sin webfonts.
- Tests de componente + E2E: abrir, filtrar, cambiar, nuevo añade,
  borrar el no-último.

## Fuera del alcance

- Paleta/nodos de secuencia (TASK-049). El combobox **no** ofrece
  «Crear secuencia» hasta TASK-049.
- Envelope de archivo (TASK-050).
- IndexedDB, temas, kits de iconos, cmdk, Radix, Headless UI.
- Editar el título dentro del trigger (sigue el inspector / flujo
  actual de metadata).

## Archivos / módulos afectados

- `src/editor/components/shell/TopBar.tsx` y CSS
- componente combobox nuevo bajo `src/editor/components/`
- `src/editor/store/actions.ts` (si «Nuevo»/borrar aún no están
  cableados a UI)
- `docs/product/brand-system.md` (fila de matriz + composición)
- E2E del shell
- `docs/tasks/post-024/13-editor/TASK-048.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

El usuario cambia de diagrama desde la top bar y encuentra por nombre.
«Nuevo» ya no destruye el anterior. Un solo documento impide borrar.

## Restricciones

- Spanish UI.
- No medio-implementar un kind: no hay acción «Secuencia» hasta TASK-049.
- Tooltips: no usar el título del documento como único nombre.
- No cambiar `--shell-topbar-height`.

## Criterios de aceptación

- [ ] Combobox sustituye el título estático; tokens y radio del sistema.
- [ ] Búsqueda filtra en vivo; Escape cierra el listbox, no Ayuda ni
      Exportar.
- [ ] Cambiar de fila restaura documento y viewport; undo no cruza.
- [ ] Nuevo añade y activa; la lista crece en uno.
- [ ] Borrar el último está indisponible; borrar otro pide confirmación
      y deja un activo válido.
- [ ] Sin `<select>` nativo; sin paquetes nuevos.
- [ ] Compacto (<1024): el combobox sigue usable (ellipsis, no se tapa
      con los icon-only).

## Tests

- Unit del combobox (filtro, teclado, empty).
- Store: switch / add / delete.
- E2E Playwright: dos diagramas, buscar, activar.

## Comandos de verificación

```bash
npx vitest run src/editor
npx playwright test e2e/shell-layout.spec.ts e2e/tooltips.spec.ts --project=chromium
npx tsc -b --pretty false
```

Añadir o extender spec E2E del switcher. Actualizar screenshots del
shell si el título deja de ser texto estático.

## Stop conditions

- Se pide un kit de combobox o un `<select>` nativo «por ahora».
- Se pide crear documentos `sequence` desde esta UI.
- Se pide IndexedDB.

## Definition of Done

Selector usable sobre la biblioteca; secuencia aún no se crea por UI.

## Evidencia de cierre

Pendiente.
