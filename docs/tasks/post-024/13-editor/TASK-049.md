# TASK-049: Módulo de diagrama de secuencia

## Estado documental

Lista

## Objetivo

El editor abre y edita un `document.kind` `"sequence"` completo: paleta,
nodos, mensajes, inspector y creación, sin reescribir el shell ni dejar
el kind a medias.

## Prioridad

P0

## Dependencias

TASK-046, TASK-048

## Contexto obligatorio

- @docs/architecture/sequence-model.md
- @docs/architecture/diagram-kinds.md
- @docs/architecture/rendering-and-export.md
- @docs/product/brand-system.md
- @docs/product/mvp-spec.md
- @docs/product/post-mvp-spec.md
- @docs/decisions/ADR-002-diagram-engine.md
- @docs/decisions/ADR-006-export.md
- @.cursor/rules/domain.mdc
- @.cursor/rules/testing.mdc

## Estado inicial

Dominio y biblioteca existen. El combobox lista documentos. No hay
paleta ni proyección de secuencia. Crear «Secuencia» aún está prohibido
en UI (TASK-048). Export raster y React Flow siguen ADR-002/006.

## Dentro del alcance

- Módulo por kind: paleta, `nodeTypes` / `edgeTypes`, mapper,
  inspector, herramientas de creación. El shell se **resuelve** por
  `document.kind`; no un `if` copiado en cada archivo de chrome si se
  puede extraer el módulo (si la extracción es mayor que dos
  implementaciones reales, un registry mínimo está autorizado:
  `diagram-kinds.md`).
- Paleta secuencia: Selección; Lifeline; Mensaje síncrono; Reply.
  Copy según `sequence-model.md`.
- Lienzo: cabeza + línea de vida; flechas sync/reply; self-message en U.
  Sin barras de activación. Sin fragmentos.
- Crear lifeline por click-herramienta. Crear mensaje: herramienta de
  relación (origen → destino; `y` del pointer). Volver a Selección tras
  crear una relación (mismo patrón TASK-043).
- Inspector: nombre del lifeline; en mensaje, firma, kind, extremos.
- «Nuevo» / diálogo: se puede elegir **Casos de uso** o **Secuencia**.
  Crea un documento del kind, lo **añade** a la biblioteca, lo activa.
- Combobox: el kind secundario muestra «Secuencia». No ofrecer kinds
  sin módulo.
- Addendum de `brand-system.md` **antes** de pintar iconos. Mismo
  contrato SVG (viewBox 24, stroke 2, `currentColor`, sin kit). Trazos:

  **`lifeline`** — cabeza + vida:

  ```text
  <rect x="7" y="3" width="10" height="6" />
  <path d="M12 9v12" stroke-dasharray="2 2" />
  ```

  **`syncMessage`** — flecha continua:

  ```text
  <path d="M4 12h14" />
  <path d="M15 8l5 4-5 4z" fill="currentColor" stroke="none" />
  ```

  **`replyMessage`** — flecha discontinua abierta:

  ```text
  <path d="M4 12h14" stroke-dasharray="3 2" />
  <path d="M16 8l5 4-5 4" />
  ```

  Nombres: «Lifeline» / «Mensaje síncrono» / «Reply». Tooltips: «Crear
  línea de vida.» / «Mensaje síncrono (llamada).» / «Mensaje de
  respuesta.»
- PNG/JPG y clipboard reutilizan `exportDiagram`; el chrome no entra al
  raster. Pin `html-to-image@1.11.11` intacto.
- Ayuda: atajos que apliquen; no inventar teclas nuevas salvo las del
  MVP reutilizadas.
- Tests de mapper/nodos/inspector + E2E: crear dos lifelines, sync y
  reply, rename, export no vacío.

## Fuera del alcance

- Fragmentos, async, create/destroy, activaciones, clases.
- Envelope de archivo 2.x (TASK-050) salvo que el autosave local ya
  persista el documento secuencia (eso lo da TASK-047).
- Waypoints persistidos, segundo motor, temas, paquetes npm.
- Cambiar reglas de casos de uso.

## Archivos / módulos afectados

- `src/editor/nodes/` (Lifeline)
- `src/editor/edges/` (sync, reply)
- `src/editor/adapters/reactFlowMapper.ts`
- paleta, inspector, tools, diálogos Nuevo
- `docs/product/brand-system.md`
- `docs/architecture/architecture.md` (puntero de módulos)
- E2E nuevos
- `docs/tasks/post-024/13-editor/TASK-049.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Un usuario crea un diagrama de secuencia, lo edita y lo ve en el
selector junto a los de casos de uso. El kind use-case no se rompe.

## Restricciones

- Host vacío prohibido: no hay fila «Secuencia» sin este módulo.
- `src/domain` sin React.
- Notación = `sequence-model.md`; stop si se pide un fragmento.

## Criterios de aceptación

- [ ] Documento secuencia vacío se abre con paleta y lienzo propios.
- [ ] Crear/mover/borrar lifelines y mensajes; self-message visible.
- [ ] Inspector y selección alineados con el modelo.
- [ ] Nuevo con kind Secuencia añade a la biblioteca.
- [ ] Export PNG del diagrama secuencia no incluye shell.
- [ ] Casos de uso: paleta y matriz del MVP intactas al volver al
      documento use-case.
- [ ] Iconos en addendum de marca; sin kit.

## Tests

- Unit de mapper y de nodos/edges de secuencia.
- Inspector.
- E2E create + connect + switch de vuelta a use-case.
- Regression E2E de casos de uso existente que esta TASK deba seguir
  pasando (smoke de creación actor/caso).

## Comandos de verificación

```bash
npx vitest run src/editor src/domain
npx playwright test --project=chromium
npx tsc -b --pretty false
```

## Stop conditions

- Se pide `alt`/`loop`/activaciones/async.
- Se pide un paquete de combobox o de iconos.
- Se pide cambiar ADR-002 o el pin de export.

## Definition of Done

Módulo secuencia completo y acoplado al selector; use-case intacto.

## Evidencia de cierre

Pendiente.
