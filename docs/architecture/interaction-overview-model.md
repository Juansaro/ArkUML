# Modelo de diagrama de interacción general (Release 2)

Contrato del `document.kind` `"interaction-overview"` en la línea **3.0**.
No autoriza código; la implementación es TASK-062 (dominio) y TASK-063
(chrome).

`mvp-spec.md` gana para casos de uso. Este archivo gana para interacción
general. La política de módulo por kind está en
[`diagram-kinds.md`](diagram-kinds.md). El bump es
[`schema-evolution.md`](schema-evolution.md).

## Fuente UML

[OMG Unified Modeling Language 2.5.1](https://www.omg.org/spec/UML/2.5.1/PDF)
(`formal/2017-12-05`), cláusula **17.9 Interaction Overview Diagrams**:

| Concepto UML | Apartado | Uso en ArkUML |
| --- | --- | --- |
| Interaction Overview | 17.9 | `document.kind` `"interaction-overview"` |
| `InteractionUse` | 17.7 / 17.12.16 | Elemento `interaction-occurrence` |
| Nodos de control de actividad | 15.7 | Mismos kinds que [activity-model.md](activity-model.md) |
| `ControlFlow` | 15.7.11 | Relación `control-flow` |

Un Interaction Overview es un Activity cuyos nodos invocables son
ocurrencias de interacción (`ref`), no Actions opacas.

El `ref` es un **nombre** (string 1–80). **No** es un `document.id` de
la biblioteca: no hay enlace persistido a un diagrama de secuencia.
Resolver o embeber otra Interaction es stop.

## Dentro del subconjunto

Un documento `kind: "interaction-overview"` y `schemaVersion: 3`
contiene solo:

### Nodos

```text
{
  id: UUID,
  kind: "interaction-occurrence" | "initial-node" | "activity-final"
      | "decision-node" | "merge-node" | "fork-node" | "join-node",
  name: string,          // occurrence: 1–80 (el ref); control: 0–80
  geometry: { x, y, width, height }
}
```

`interaction-occurrence`: marco con pentágono «ref» y el nombre en el
compartimento (UML 2.5.1 fig. 17.16). Default `200×80`, mínimo
`140×56`. Nodos de control: mismas geometrías por defecto que
`activity-model.md`.

No hay elemento `action` en este kind.

### Flujos

Igual que actividades: `control-flow` con `guard` 0–80. Self ilegal.
`initial-node` no es destino; `activity-final` no es origen.
`canConnect`: cualquier nodo de este documento con otro distinto.

### Documento vacío

Título por defecto «Diagrama de interacción general». Sin nodos ni
flujos. Viewport `{ x: 0, y: 0, zoom: 1 }`.

### Cardinalidad de kinds en el documento

Sin mezcla con `activity` ni con sequence. Un `interaction-occurrence`
no es un lifeline. `PARSE_INVALID` / `UNKNOWN_KIND`.

## Fuera del subconjunto

- Interaction **inline** (secuencia dibujada dentro del marco).
- `ref` tipado a UUID de otro `DiagramDocument`.
- `Gate`, `CombinedFragment` dentro del overview.
- Object flow, particiones.

Inventar cualquiera de esos en una TASK de implementación es stop.

## Operaciones de dominio

`createInteractionOccurrence` (nombre = ref), factories de nodos de
control, rename (occurrence 1–80), move/resize/delete (cascada),
duplicate sin flujos, `createRelationship` / `setControlFlowGuard` /
`deleteRelationships` con las mismas reglas de initial/final que
actividad.

Warnings no bloqueantes: ninguno.

## Chrome (contrato para TASK-063)

Paleta: Selección; Interacción (ref); Inicial; Final; Decisión;
Fusión; Fork; Join; Flujo. Inspector: en occurrence, el `ref`; en
flujo, guarda. Iconos: addendum de marca antes de pintar. «Nuevo»
ofrece el kind solo cuando este módulo existe.

## Qué no se decide aquí

Biblioteca (ADR-007): el combobox lista el documento; no resuelve
`ref`. Envelope 3.x. Motor: addendum ADR-002 (marco `ref` = nodo
custom).
