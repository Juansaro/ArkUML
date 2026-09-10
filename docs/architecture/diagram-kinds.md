# Tipos de diagrama (`document.kind`)

Política de cómo el editor admite más de un `document.kind`. No autoriza
código. No metamodela clases ni ningún tipo extra.

`mvp-spec.md` gana para el producto actual (solo `use-case`). El
contrato de alcance está en
[`post-mvp-spec.md`](../product/post-mvp-spec.md) (FR-P07, W17-01,
W17-13). El bump de schema está en
[`schema-evolution.md`](schema-evolution.md).

## Números vigentes

| Número | Valor | Efecto aquí |
| --- | --- | --- |
| Producto 1.x | Schema `1` | Un único `document.kind`: `use-case` |
| Producto 2.x | `schemaVersion >= 2` | Unión de kinds; el primero extra es clases (W17-13) |

Un documento schema `1` con `kind` distinto de `use-case` es
`UNKNOWN_KIND` / `PARSE_INVALID`. El primer kind persistido extra es
major 2.0: `migrate()` **antes** del primer save.

## Cardinalidad

Un único documento activo. Un documento, un `kind`. No hay lista de
diagramas (W14-02 sigue exclusión). Cambiar de tipo no es «otro archivo
en el workspace»: es otro `DiagramDocument` que sustituye al activo, con
la misma confirmación que «Nuevo diagrama» cuando haya cambios.

No hay switcher de tipo en 1.x. Un control que ofrezca «Clases» sin
módulo completo (paleta, reglas, export) es medio-implementar un `kind`
(regla TASK-020).

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

El kind `use-case` es el único módulo en 1.x. Extraer un registry o
plugin **solo** cuando existan dos implementaciones que revelen el
contrato real ([`architecture.md`](architecture.md)).

Prohibido:

- Campo huérfano en el documento sin paleta ni reglas.
- Paleta de un kind que el schema no persiste.
- Export que ignore elementos de un kind persistido.
- Kit de iconos externo. Un kind nuevo exige addendum de
  [`brand-system.md`](../product/brand-system.md) **antes** de código.

## Qué no se decide aquí

- Forma persistida de clases (elementos, relaciones, anclas).
- Fuente UML de clases, Generalization de clases o atributos.
- Nombre del envelope de archivo 2.x (FR-P03 sigue
  `arkuml-usecase-json` para schema `1`).
- Reabrir ADR-002, ADR-004 o ADR-006.

Inventar esa forma en una TASK de implementación es stop. W17-13
permanece bloqueada hasta fuente citada, unión de kinds y bump de
schema.

## Fuera de esta política

- Código en `src/`.
- Selector de tipo, paleta de clases o host vacío en 1.x.
- Multi-documento, temas, segundo motor gráfico.
