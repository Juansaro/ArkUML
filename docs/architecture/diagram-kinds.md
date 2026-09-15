# Tipos de diagrama (`document.kind`)

Política de cómo el editor admite más de un `document.kind`. No autoriza
código por sí sola. El metamodelo de secuencia está en
[`sequence-model.md`](sequence-model.md). No metamodela clases.

`mvp-spec.md` gana para casos de uso. El contrato de alcance está en
[`post-mvp-spec.md`](../product/post-mvp-spec.md) (FR-P07, W17-01,
W17-13, W17-14). El bump de schema está en
[`schema-evolution.md`](schema-evolution.md). La lista de documentos es
[ADR-007](../decisions/ADR-007-workspace-library.md).

## Números vigentes

| Número | Valor | Efecto aquí |
| --- | --- | --- |
| Producto 1.x | Schema `1` | Un único `document.kind`: `use-case` |
| Producto 2.0 (Release 1) | `schemaVersion` `2` | Unión `"use-case" \| "sequence"`; el primero extra es secuencia (W17-14) |

Un documento schema `1` con `kind` distinto de `use-case` es
`UNKNOWN_KIND` / `PARSE_INVALID`. El primer kind persistido extra es
major 2.0: `migrate()` **antes** del primer save.

## Cardinalidad

Un documento, un `kind`. En 1.x hay un único documento activo y no hay
lista. En 2.0 la **biblioteca** (W14-02, ADR-007) guarda varios
documentos; cada uno tiene un `kind`. El combobox activa otra fila; no
convierte el kind del documento actual.

No hay switcher de tipo en 1.x. Un control que ofrezca un kind sin
módulo completo (paleta, reglas, export) es medio-implementar (regla
TASK-020). Clases no se listan hasta W17-13.

## Módulo por kind

Cada `document.kind` es un módulo, no un `if (kind)` repartido por el
chrome. Superficies que el módulo debe cubrir:

| Superficie | Qué resuelve el módulo |
| --- | --- |
| Paleta | Herramientas y copy de ese kind |
| Nodos / edges | `nodeTypes` / `edgeTypes` y notación |
| Reglas | `canConnect`, cardinalidades, nombres |
| Inspector | Campos y avisos del kind |
| Warnings | Códigos estables de ese kind |
| Export raster | Misma tubería `exportDiagram`; el módulo no añade chrome al PNG/JPG |

El kind `use-case` es el único módulo en 1.x. En Release 1 el segundo
módulo es secuencia. Extraer un registry o plugin **solo** cuando esas
dos implementaciones revelen el contrato real
([`architecture.md`](architecture.md)); TASK-049 puede introducir el
mínimo necesario.

Prohibido:

- Campo huérfano en el documento sin paleta ni reglas.
- Paleta de un kind que el schema no persiste.
- Export que ignore elementos de un kind persistido.
- Kit de iconos externo. Un kind nuevo exige addendum de
  [`brand-system.md`](../product/brand-system.md) **antes** de código.

## Qué no se decide aquí

- Forma persistida de clases (elementos, relaciones, anclas). W17-13
  sigue bloqueada.
- Fragmentos u otros mensajes fuera de `sequence-model.md`.
- Reabrir ADR-002 o ADR-006.

El envelope de archivo 2.x es `arkuml-document-json` / `formatVersion`
2 (`schema-evolution.md`). `arkuml-usecase-json` permanece para schema
`1`.

Inventar la forma de clases o de fragmentos en una TASK de
implementación es stop.

## Fuera de esta política

- Código en `src/` (eso es TASK-046–049).
- Paleta de clases o host vacío.
- Temas, segundo motor gráfico, IndexedDB.
