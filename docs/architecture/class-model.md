# Modelo de diagrama de clases (Release 2)

Contrato del `document.kind` `"class"` en la línea **3.0**. No autoriza
código; la implementación es TASK-052 (dominio) y TASK-053 (chrome).

`mvp-spec.md` gana para casos de uso. Este archivo gana para clases.
La política de módulo por kind está en
[`diagram-kinds.md`](diagram-kinds.md). El bump es
[`schema-evolution.md`](schema-evolution.md).

## Fuente UML

[OMG Unified Modeling Language 2.5.1](https://www.omg.org/spec/UML/2.5.1/PDF)
(`formal/2017-12-05`):

| Concepto UML | Apartado | Uso en ArkUML |
| --- | --- | --- |
| `Class` | 11.4 / 9 | Único elemento persistido |
| `Property` (atributo) | 9.5 | String en el compartimento de atributos |
| `Operation` | 9.6 | String en el compartimento de operaciones |
| `Association` | 11.5 | Relación `class-association` |
| `aggregationKind` `shared` / `composite` | 9.5.3 / 11.5 | `aggregation` / `composition` |
| `Generalization` | 9.9.1 | Relación `generalization` |
| Multiplicidad de extremo | 7.5.3 | `"0..1" \| "1" \| "0..*" \| "1..*"` |

No se copia el metamodelo entero. Lo que no está en «Dentro del
subconjunto» **no** se persiste ni se pinta.

W12-06 (multiplicidad) y W12-02 (Generalization) se levantan **solo**
en este kind. Casos de uso siguen sin multiplicidad ni generalization.

## Dentro del subconjunto

Un documento `kind: "class"` y `schemaVersion: 3` contiene solo:

### Clase

```text
{
  id: UUID,
  kind: "class",
  name: string,                 // 1–80 tras trim
  geometry: { x, y, width, height },
  attributes: string[],         // cada ítem 0–80 tras trim; vacíos se descartan
  operations: string[]          // cada ítem 0–80 tras trim; vacíos se descartan
}
```

Notación: rectángulo de tres compartimentos (nombre / atributos /
operaciones), UML 2.5.1 fig. 11.23. Sin estereotipo, sin visibilidad
(`+`/`-`), sin `abstract`, sin tipo persistido aparte del texto.

Valores por defecto al crear: geometría `180×96`, mínimo `120×72`.
`attributes` y `operations` vacíos. Números finitos.

### Relaciones

```text
{
  id: UUID,
  kind: "class-association" | "aggregation" | "composition" | "generalization",
  sourceId: UUID,               // class
  targetId: UUID,               // class; distinto de sourceId
  name: string,                 // 0–80; vacío = sin etiqueta
  sourceMultiplicity: "0..1" | "1" | "0..*" | "1..*",  // omitido en generalization
  targetMultiplicity: "0..1" | "1" | "0..*" | "1..*"   // omitido en generalization
}
```

| `kind` | Trazo | Extremo destino | Multiplicidad |
| --- | --- | --- | --- |
| `class-association` | Continuo | Ninguno | Obligatoria en ambos extremos |
| `aggregation` | Continuo | Diamante vacío en `sourceId` | Obligatoria |
| `composition` | Continuo | Diamante relleno en `sourceId` | Obligatoria |
| `generalization` | Continuo | Triángulo vacío en `targetId` (general) | Prohibida |

`sourceId === targetId` es **ilegal** (`SELF_RELATIONSHIP`). Duplicados
(mismos extremos, mismo `kind`) están permitidos.

`canConnect`: clase con clase, no consigo misma. Nada más. Agregación y
composición: el diamante vive en el origen (`sourceId` = todo).
Generalization: `sourceId` = específico, `targetId` = general.

Al crear asociación/agregación/composición, multiplicidades por defecto
`"1"` / `"1"`.

### Documento vacío

1. Metadata: título por defecto «Diagrama de clases»; timestamps.
2. Sin clases ni relaciones.
3. Viewport `{ x: 0, y: 0, zoom: 1 }`.

El boundary único de casos de uso **no** existe aquí.

### Cardinalidad de kinds en el documento

Un documento `class` no puede contener actor, caso, boundary, lifeline
ni kinds de otros módulos. Un documento `use-case` o `sequence` no puede
contener `class` ni estas relaciones. Violación = `PARSE_INVALID` /
`UNKNOWN_KIND`.

## Fuera del subconjunto

No implementar, ni dejar hueco persistido, hasta una revisión de este
archivo y un bump de schema:

- `Interface`, `Enumeration`, `DataType`, `PrimitiveType`.
- Visibilidad, `isAbstract`, `isStatic`, tipos de Property/Operation.
- Association class, n-arias, cualificadores, navigability aparte.
- `Dependency`, `Realization`, `Usage` entre clases.
- Plantillas, nested classifiers, asociaciones reflexivas.

Inventar cualquiera de esos en una TASK de implementación es stop.

## Operaciones de dominio

Puras; mismo patrón que [domain-model.md](domain-model.md). Códigos
reutilizables (`INVALID_NAME`, `UNKNOWN_ELEMENT`, `INVALID_GEOMETRY`,
`INVALID_CONNECTION`, `SELF_RELATIONSHIP`, `UNKNOWN_RELATIONSHIP`).

| Operación | Comportamiento |
| --- | --- |
| `createClass` | Inserta con geometría por defecto o la del click. |
| `renameElement` | Nombre 1–80. |
| `setClassMembers` | Sustituye `attributes` / `operations` (trim, 0–80, descarta vacíos). |
| `moveElements` / `resizeElement` | Geometría; mínimo respetado. |
| `deleteElements` | Cascada: borra relaciones que toquen esas clases. |
| `duplicateElements` | Clases; offset 24; **sin** relaciones. |
| `createRelationship` | Valida extremos, kind y multiplicidad. |
| `renameRelationship` | Nombre 0–80. |
| `setAssociationEnds` | Multiplicidades; ilegal en generalization. |
| `deleteRelationships` | Por id. |

Warnings no bloqueantes: **ninguno** en Release 2 para clases.

## Chrome (contrato para TASK-053)

Paleta: Selección; Clase; Asociación; Agregación; Composición;
Generalización. Inspector: nombre; listas de atributos y operaciones;
en relación, kind, extremos y multiplicidades (ocultas si
generalization). Iconos: addendum de `brand-system.md` **antes** de
pintar; sin kit externo.

## Qué no se decide aquí

- Biblioteca y selector: [ADR-007](../decisions/ADR-007-workspace-library.md).
- Envelope de archivo 3.x: `schema-evolution.md`.
- Motor gráfico: addendum de [ADR-002](../decisions/ADR-002-diagram-engine.md)
  (compartimentos = nodo custom; no segundo motor).
