# Modelo de diagrama de actividades (Release 2)

Contrato del `document.kind` `"activity"` en la línea **3.0**. No
autoriza código; la implementación es TASK-060 (dominio) y TASK-061
(chrome).

`mvp-spec.md` gana para casos de uso. Este archivo gana para actividades.
La política de módulo por kind está en
[`diagram-kinds.md`](diagram-kinds.md). El bump es
[`schema-evolution.md`](schema-evolution.md).

## Fuente UML

[OMG Unified Modeling Language 2.5.1](https://www.omg.org/spec/UML/2.5.1/PDF)
(`formal/2017-12-05`), cláusula **15 Activities**:

| Concepto UML | Apartado | Uso en ArkUML |
| --- | --- | --- |
| `Action` (opaca) | 16.2 / 15.5 | Elemento `action` |
| `InitialNode` | 15.7.18 | Elemento `initial-node` |
| `ActivityFinalNode` | 15.7.3 | Elemento `activity-final` |
| `DecisionNode` / `MergeNode` | 15.7.12 / 15.7.21 | `decision-node` / `merge-node` |
| `ForkNode` / `JoinNode` | 15.7.15 / 15.7.19 | `fork-node` / `join-node` |
| `ControlFlow` | 15.7.11 | Relación `control-flow` |
| Guarda | 15.2.3 | `guard` opcional en el flujo |

## Dentro del subconjunto

Un documento `kind: "activity"` y `schemaVersion: 3` contiene solo:

### Nodos

```text
{
  id: UUID,
  kind: "action" | "initial-node" | "activity-final"
      | "decision-node" | "merge-node" | "fork-node" | "join-node",
  name: string,          // action: 1–80; control: 0–80 (vacío típico)
  geometry: { x, y, width, height }
}
```

| `kind` | Notación | Default | Mínimo |
| --- | --- | --- | --- |
| `action` | Rectángulo redondeado | `160×64` | `96×40` |
| `initial-node` | Círculo relleno | `24×24` | `16×16` |
| `activity-final` | Círculo con punto (bullseye) | `28×28` | `20×20` |
| `decision-node` / `merge-node` | Rombo | `48×48` | `32×32` |
| `fork-node` / `join-node` | Barra gruesa | `80×8` | `48×6` |

Fork/join: la barra es horizontal; no hay variante vertical persistida.

### Flujos

```text
{
  id: UUID,
  kind: "control-flow",
  sourceId: UUID,
  targetId: UUID,        // distinto de sourceId
  guard: string          // 0–80 tras trim; vacío = sin guarda
}
```

Notación: flecha continua con punta abierta. La guarda, si no está
vacía, se pinta junto al trazo (`[guard]`). El dominio **no** restringe
quién puede llevar guarda; el chrome sugiere usarla al salir de
`decision-node`. Self ilegal.

`canConnect`: cualquier nodo de este kind con cualquier otro distinto
de sí mismo. Un `initial-node` no es destino válido
(`INVALID_CONNECTION`). Un `activity-final` no es origen válido.

### Documento vacío

Título por defecto «Diagrama de actividades». Sin nodos ni flujos.
Viewport `{ x: 0, y: 0, zoom: 1 }`.

### Cardinalidad de kinds en el documento

Sin mezcla con otros módulos. `PARSE_INVALID` / `UNKNOWN_KIND`.

## Fuera del subconjunto

- `ObjectFlow`, pins, `CentralBufferNode`, `DataStoreNode`.
- `ActivityPartition` (calleras), regiones interrumpibles, `ExpansionRegion`.
- `AcceptEventAction`, `SendSignalAction`, `CallBehaviorAction` distintos
  de `action` opaca.
- Pesos en el edge, `isMultidimensional`.

Inventar cualquiera de esos en una TASK de implementación es stop.

## Operaciones de dominio

Factories por kind de nodo; rename (action exige 1–80; control permite
vacío); move/resize; delete con cascada de flujos; duplicate sin flujos;
`createRelationship` (`control-flow` + reglas initial/final);
`setControlFlowGuard`; `deleteRelationships`.

Warnings no bloqueantes: ninguno.

## Chrome (contrato para TASK-061)

Paleta: Selección; Acción; Inicial; Final; Decisión; Fusión; Fork;
Join; Flujo. Inspector: nombre; en flujo, guarda y extremos. Iconos:
addendum de marca antes de pintar.

## Qué no se decide aquí

Biblioteca (ADR-007). Envelope 3.x. Motor: addendum ADR-002 (nodos de
control = custom; no segundo motor).
