# Modelo de diagrama de componentes (Release 2)

Contrato del `document.kind` `"component"` en la línea **3.0**. No
autoriza código; la implementación es TASK-054 (dominio) y TASK-055
(chrome).

`mvp-spec.md` gana para casos de uso. Este archivo gana para componentes.
La política de módulo por kind está en
[`diagram-kinds.md`](diagram-kinds.md). El bump es
[`schema-evolution.md`](schema-evolution.md).

## Fuente UML

[OMG Unified Modeling Language 2.5.1](https://www.omg.org/spec/UML/2.5.1/PDF)
(`formal/2017-12-05`), cláusula **11.6 Components** y **7.7 Dependencies**:

| Concepto UML | Apartado | Uso en ArkUML |
| --- | --- | --- |
| `Component` | 11.6.2 | Único elemento persistido |
| `Usage` | 7.7.4 | Relación `component-usage` |
| `Connector` de ensamblaje | 11.2.3 / 11.6.3 | Relación `assembly-connector` |

No hay clasificador `Interface` suelto: bola y zócalo son **notación
del edge** de ensamblaje (UML 2.5.1, ball-and-socket), no un elemento.

## Dentro del subconjunto

Un documento `kind: "component"` y `schemaVersion: 3` contiene solo:

### Componente

```text
{
  id: UUID,
  kind: "component",
  name: string,          // 1–80 tras trim
  geometry: { x, y, width, height }
}
```

Notación: rectángulo con el icono de componente (dos rectángulos
pequeños en el borde superior derecho, UML 2.5.1 fig. 11.28) y el
nombre. Sin estereotipo, sin clasificador anidado.

Valores por defecto al crear: geometría `200×120`, mínimo `120×72`.

### Relaciones

```text
{
  id: UUID,
  kind: "component-usage" | "assembly-connector",
  sourceId: UUID,        // component
  targetId: UUID,        // component; distinto de sourceId
  name: string           // 0–80; vacío = sin etiqueta
}
```

| `kind` | Trazo | Punta / adorno |
| --- | --- | --- |
| `component-usage` | Discontinuo | Abierta en `targetId`; etiqueta «use» derivada (no persistida) |
| `assembly-connector` | Continuo | Bola en `sourceId`, zócalo en `targetId` |

`sourceId === targetId` es ilegal (`SELF_RELATIONSHIP`). `canConnect`:
componente con componente, no consigo mismo.

### Documento vacío

Título por defecto «Diagrama de componentes». Sin elementos ni
relaciones. Viewport `{ x: 0, y: 0, zoom: 1 }`.

### Cardinalidad de kinds en el documento

Sin mezcla con use-case, sequence, class u otros módulos.
`PARSE_INVALID` / `UNKNOWN_KIND`.

## Fuera del subconjunto

- `Interface` como elemento, `Port`, `Provided`/`Required` persistidos.
- Artefactos internos, `Delegation` connector, profiling.
- Componentes anidados, `Realization` de clasificador.

Inventar cualquiera de esos en una TASK de implementación es stop.

## Operaciones de dominio

`createComponent`, `renameElement`, `moveElements` / `resizeElement`,
`deleteElements` (cascada de relaciones), `duplicateElements` (sin
relaciones), `createRelationship`, `renameRelationship`,
`deleteRelationships`. Códigos reutilizables; `SELF_RELATIONSHIP` en
bucle.

Warnings no bloqueantes: ninguno en Release 2 para este kind.

## Chrome (contrato para TASK-055)

Paleta: Selección; Componente; Uso; Ensamblaje. Inspector: nombre; en
relación, kind y extremos. Iconos: addendum de `brand-system.md` antes
de pintar.

## Qué no se decide aquí

Biblioteca (ADR-007). Envelope 3.x (`schema-evolution.md`). Motor:
addendum ADR-002 (bola-zócalo = edge custom; no segundo motor).
