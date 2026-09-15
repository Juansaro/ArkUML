# Modelo de diagrama de secuencia (Release 1)

Contrato del `document.kind` `"sequence"` en la línea **2.0**. No autoriza
código; la implementación es TASK-046 (dominio) y TASK-049 (chrome).

`mvp-spec.md` gana para casos de uso. Este archivo gana para secuencia.
La política de módulo por kind está en
[`diagram-kinds.md`](diagram-kinds.md). El bump es
[`schema-evolution.md`](schema-evolution.md).

## Fuente UML

[OMG Unified Modeling Language 2.5.1](https://www.omg.org/spec/UML/2.5.1/PDF)
(`formal/2017-12-05`), cláusula **17 Interactions**:

| Concepto UML | Apartado | Uso en ArkUML |
| --- | --- | --- |
| `Lifeline` | 17.12.17 | Único elemento persistido |
| `Message` con `MessageSort` `synchCall` | 17.4 / 17.12.18 | Relación `sync-message` |
| `Message` con `MessageSort` `reply` | 17.4 / 17.12.18 | Relación `reply-message` |
| Diagrama de secuencia (eje temporal vertical) | 17.8 | `y` persistido en el mensaje |

No se copia el metamodelo entero. Lo que no está en «Dentro del
subconjunto» **no** se persiste ni se pinta.

## Dentro del subconjunto

Un documento `kind: "sequence"` y `schemaVersion: 2` contiene solo:

### Lifeline

```text
{
  id: UUID,
  kind: "lifeline",
  name: string,          // 1–80 tras trim
  geometry: { x, y, width, height },  // caja de la cabeza
  stemLength: number     // px de línea de vida bajo la cabeza
}
```

Notación: rectángulo con el nombre; línea de vida discontinua vertical
desde el borde inferior de la cabeza hacia abajo. Sin tipo, sin selector,
sin estereotipo. No hay variante «actor palo» distinta: un lifeline es un
lifeline.

Valores por defecto al crear: cabeza `120×40`, mínimo `80×32`;
`stemLength` `280`, mínimo `80`. Números finitos.

### Mensajes

```text
{
  id: UUID,
  kind: "sync-message" | "reply-message",
  sourceId: UUID,        // lifeline
  targetId: UUID,        // lifeline; puede coincidir con sourceId
  name: string,          // 0–80 tras trim (vacío = flecha sin firma)
  y: number              // coordenada de documento, eje temporal
}
```

Notación (UML 2.5.1, flechas de mensaje):

| `kind` | Trazo | Punta |
| --- | --- | --- |
| `sync-message` | Continuo | Cerrada rellena |
| `reply-message` | Discontinuo | Abierta |

No hay anclas `top`/`right`/`bottom`/`left`: el mensaje es una flecha
horizontal (o en U si es a sí mismo) a la altura `y`. `y` debe ser un
número finito. Al **crear**, `y` no puede quedar dentro de la cabeza de
origen ni de destino (`y` ≥ borde inferior de ambas cabezas). Mover un
lifeline no recalcula `y`.

Self-message (`sourceId === targetId`) está **permitido**. No aplica el
error `SELF_RELATIONSHIP` de casos de uso.

Duplicados (mismos extremos, mismo `kind`, mismo `y`) están permitidos.

`canConnect`: cualquier lifeline con cualquier lifeline, incluido sí
mismo. Nada más.

### Documento vacío

1. Metadata: título por defecto «Diagrama de secuencia»; timestamps.
2. Sin lifelines ni mensajes.
3. Viewport `{ x: 0, y: 0, zoom: 1 }`.

El boundary único de casos de uso **no** existe aquí.

### Cardinalidad de kinds en el documento

Un documento `use-case` no puede contener `lifeline` ni mensajes de
secuencia. Un documento `sequence` no puede contener actor, caso, boundary
ni Association/Include/Extend. Violación al validar = `PARSE_INVALID` /
`UNKNOWN_KIND`.

## Fuera del subconjunto

No implementar, ni dejar hueco persistido, hasta una revisión de este
archivo y un bump de schema:

- `MessageSort` `asynchCall` / `asynchSignal`.
- Mensaje `createMessage` / `deleteMessage`.
- `ExecutionSpecification` (barras de activación) persistidas o pintadas.
- `CombinedFragment` (`alt`, `opt`, `loop`, `par`, `break`, …).
- `InteractionUse` (`ref`), gates, found/lost.
- Restricciones de duración/tiempo, state invariant, continuation, coregion.
- Occurrence specifications distintas del par origen/destino + `y`.
- Lifelines con `represents` tipado, partes, selector.

Inventar cualquiera de esos en una TASK de implementación es stop.

## Operaciones de dominio

Puras; mismo patrón que [domain-model.md](domain-model.md). Códigos
reutilizables (`INVALID_NAME`, `UNKNOWN_ELEMENT`, `INVALID_GEOMETRY`,
`INVALID_CONNECTION`, `UNKNOWN_RELATIONSHIP`). No crear códigos UML de
fragmentos.

| Operación | Comportamiento |
| --- | --- |
| `createLifeline` | Inserta con geometría por defecto o la del click. |
| `renameElement` | Nombre 1–80. |
| `moveElements` | Actualiza `geometry` de cabezas; `stemLength` no cambia. |
| `resizeLifelineStem` | `stemLength` ≥ 80. |
| `deleteElements` | Cascada: borra mensajes que toquen esos lifelines. |
| `duplicateElements` | Solo lifelines; offset 24; **sin** mensajes. |
| `createRelationship` | `sync-message` o `reply-message`; valida `y` y extremos. |
| `renameRelationship` | Firma 0–80. |
| `moveMessage` | Cambia `y` (misma regla que al crear). |
| `deleteRelationships` | Por id. |

No hay include/extend, ni `reparent`, ni boundary.

Warnings no bloqueantes: **ninguno** en Release 1 para secuencia. No se
inventan avisos de solape.

## Chrome (contrato para TASK-049)

El módulo cubre las superficies de `diagram-kinds.md`: paleta (Selección,
Lifeline, Mensaje síncrono, Reply), nodos/edges, inspector (nombre;
en mensaje además tipo y extremos), export raster por la tubería
existente. Iconos: addendum de `brand-system.md` **antes** de pintar; sin
kit externo.

## Qué no se decide aquí

- Biblioteca y selector: [ADR-007](../decisions/ADR-007-workspace-library.md).
- Envelope de archivo 2.x: `schema-evolution.md`.
- Motor gráfico: sigue ADR-002.
