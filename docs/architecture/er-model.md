# Modelo de diagrama entidad-relación Chen (Release 2)

Contrato del `document.kind` `"entity-relationship"` en la línea **3.0**.
No autoriza código; la implementación es TASK-058 (dominio) y TASK-059
(chrome).

Este kind **no es UML**. La decisión de producto está en
[ADR-008](../decisions/ADR-008-chen-er.md). `mvp-spec.md` gana para
casos de uso. Este archivo gana para ER. La política de módulo por kind
está en [`diagram-kinds.md`](diagram-kinds.md). El bump es
[`schema-evolution.md`](schema-evolution.md).

## Fuente

Peter P. Chen, «The Entity-Relationship Model—Toward a Unified View of
Data», *ACM Transactions on Database Systems* 1(1), 1976.

| Concepto Chen | Uso en ArkUML |
| --- | --- |
| Entidad | Elemento `entity` (rectángulo) |
| Atributo | Elemento `attribute` (elipse); `isKey` subraya el nombre |
| Relación | Elemento `er-relationship` (rombo) |
| Enlace entidad–atributo / entidad–relación | Relación `er-link` |
| Cardinalidad 1 / N | En el extremo entidad de un `er-link` hacia rombo |

W12-06 se levanta **solo** como cardinalidad Chen `"1" | "N"` en ese
extremo. Casos de uso siguen sin multiplicidad. No es Crow’s foot.

## Dentro del subconjunto

Un documento `kind: "entity-relationship"` y `schemaVersion: 3` contiene
solo:

### Entidad, atributo, rombo

```text
{
  id: UUID,
  kind: "entity" | "attribute" | "er-relationship",
  name: string,                 // 1–80 tras trim
  geometry: { x, y, width, height },
  isKey?: boolean               // solo attribute; default false
}
```

Notación: entidad = rectángulo; atributo = elipse (nombre subrayado si
`isKey`); relación = rombo. Sin entidad débil (doble rectángulo).

Valores por defecto: entidad `160×80` (mínimo `96×48`); atributo
`120×56` (mínimo `80×40`); rombo `120×80` (mínimo `80×48`).

### Enlaces

```text
{
  id: UUID,
  kind: "er-link",
  sourceId: UUID,
  targetId: UUID,               // distinto de sourceId
  cardinality?: "1" | "N"       // solo si un extremo es entity y el otro er-relationship
}
```

`canConnect` (ordenado origen → destino, o el inverso equivalente):

- `attribute` — `entity`
- `entity` — `er-relationship`

Nada más. Self ilegal. Un atributo no enlaza a un rombo. Un `er-link`
entre entidad y rombo **exige** `cardinality` `"1"` o `"N"` (default
`"N"` al crear). Un `er-link` atributo–entidad **prohíbe**
`cardinality`.

Un atributo puede enlazar a **una** entidad (segundo enlace →
`INVALID_CONNECTION`). Un rombo debe poder enlazar a dos o más
entidades; el dominio no obliga el mínimo 2 al persistir (warning no:
Release 2 no inventa avisos). El chrome no impide guardar un rombo con
un solo enlace.

### Documento vacío

Título por defecto «Diagrama entidad-relación». Sin elementos ni
enlaces. Viewport `{ x: 0, y: 0, zoom: 1 }`.

### Cardinalidad de kinds en el documento

Sin mezcla con módulos UML. `PARSE_INVALID` / `UNKNOWN_KIND`.

## Fuera del subconjunto

- Entidad débil, relación identificadora, atributo compuesto o
  multivaluado, atributo de relación.
- Crow’s foot / notación IE, UML class-as-ER.
- Roles nombrados distintos del `name` del rombo.
- Cardinalidades distintas de `"1"` / `"N"` (no hay `0..1`).

Inventar cualquiera de esos en una TASK de implementación es stop.

## Operaciones de dominio

`createEntity`, `createAttribute`, `createErRelationship`,
`setAttributeKey`, rename/move/resize/delete (cascada de `er-link`),
`duplicateElements` (sin enlaces), `createRelationship` (`er-link` +
cardinalidad según extremos), `setErCardinality`,
`deleteRelationships`.

## Chrome (contrato para TASK-059)

Paleta: Selección; Entidad; Atributo; Relación (rombo). El enlace se
crea con herramienta de relación (origen → destino). Inspector: nombre;
en atributo, `isKey`; en `er-link` entidad–rombo, cardinalidad.
Iconos: addendum de marca antes de pintar.

## Qué no se decide aquí

Biblioteca (ADR-007). Envelope 3.x. Motor: addendum ADR-002 (elipse y
rombo = nodos custom; no segundo motor).
