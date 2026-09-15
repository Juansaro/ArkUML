# TASK-053: Módulo de diagrama de clases

## Estado documental

Lista

## Objetivo

El editor abre y edita un `document.kind` `"class"` completo: paleta,
compartimentos, relaciones, inspector y creación, sin reescribir el
shell ni dejar el kind a medias.

## Prioridad

P0

## Dependencias

TASK-052

## Contexto obligatorio

- @docs/architecture/class-model.md
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

Dominio schema 3 incluye `"class"`. El combobox lista documentos. No hay
paleta ni proyección de clases. Crear «Clases» está prohibido en UI.

## Dentro del alcance

- Módulo por kind: paleta, `nodeTypes` / `edgeTypes`, mapper, inspector,
  herramientas. Shell se resuelve por `document.kind`.
- Paleta: Selección; Clase; Asociación; Agregación; Composición;
  Generalización. Copy según `class-model.md`.
- Lienzo: tres compartimentos; diamante vacío/relleno; triángulo de
  generalization; etiquetas de multiplicidad.
- Crear clase por click-herramienta. Relaciones: origen → destino;
  volver a Selección (TASK-043).
- Inspector: nombre; atributos y operaciones; en relación, kind,
  extremos y multiplicidades (ocultas si generalization).
- «Nuevo»: se puede elegir **Clases**. Añade y activa.
- Combobox: kind secundario «Clases». No ofrecer kinds sin módulo.
- Addendum de `brand-system.md` **antes** de pintar iconos. Contrato
  SVG (viewBox 24, stroke 2, `currentColor`, sin kit). Trazos y
  nombres se cierran en esa TASK; no se copian de un kit.
- PNG/JPG reutilizan `exportDiagram`. Pin `html-to-image@1.11.11`.
- Tagline del chrome según kind (contrato brand-system Release 2).

## Fuera del alcance

- Interfaces, enumeraciones, visibilidad, abstract, n-arias.
- Componentes y el resto de kinds de Release 2.
- Segundo motor, waypoints persistidos, temas, paquetes npm.
- Cambiar reglas de use-case o sequence.

## Archivos / módulos afectados

- `src/editor/nodes/` (Class)
- `src/editor/edges/` (asociación, agregación, composición, generalization)
- `src/editor/adapters/reactFlowMapper.ts`
- paleta, inspector, tools, diálogo Nuevo
- `docs/product/brand-system.md`
- E2E nuevos
- `docs/tasks/post-024/13-editor/TASK-053.md`
- `docs/tasks/post-024/README.md`

## Cambios esperados

Un usuario crea un diagrama de clases, lo edita y lo ve en el selector.
Use-case y sequence no se rompen.

## Restricciones

- Host vacío prohibido: no hay fila «Clases» sin este módulo.
- `src/domain` sin React. Notación = `class-model.md`.

## Criterios de aceptación

- [ ] Documento class vacío se abre con paleta y lienzo propios.
- [ ] Crear/mover/borrar clases y las cuatro relaciones; self ilegal.
- [ ] Compartimentos y multiplicidades visibles y persistidos.
- [ ] Nuevo con kind Clases añade a la biblioteca.
- [ ] Export PNG no incluye shell.
- [ ] Use-case y sequence intactos al volver al documento.
- [ ] Iconos en addendum de marca; sin kit.

## Tests

- Unit de mapper y nodos/edges. Inspector.
- E2E create + connect + switch de vuelta a use-case.

## Comandos de verificación

```bash
npx vitest run src/editor src/domain
npx playwright test --project=chromium
npx tsc -b --pretty false
```

## Stop conditions

- Se pide Interface, visibilidad o association class.
- Se pide un paquete de iconos o segundo motor.
- Se pide listar Componentes en Nuevo.

## Definition of Done

Módulo clases completo; use-case y sequence intactos.

## Evidencia de cierre

Pendiente.
