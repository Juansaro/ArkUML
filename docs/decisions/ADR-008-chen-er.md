# ADR-008: Entidad-relación Chen como `document.kind`

## Status

Aceptada (TASK-051, 2026-09-14). Vigente para la línea **3.0** (ciclo
**Release 2**). No se implementa en esta TASK; el código es TASK-058
(dominio) y TASK-059 (chrome).

## Context

ArkUML es un editor UML (casos de uso, secuencia, y en Release 2
clases, componentes, despliegue, actividades e interacción general).
El humano pide además un diagrama **entidad-relación** en notación
**Chen**. ER no es un diagrama UML 2.5.1. [O-01](../product/post-mvp-spec.md)
partía «UML extra»; no cubría un kind no UML.

## Problem

¿Rechazar ER, simularlo con clases (W17-13), o admitir un
`document.kind` no UML con fuente y forma propias?

## Options

1. No hay ER. El usuario usa el diagrama de clases.
2. ER = el mismo kind `"class"` con multiplicidad (Crow’s foot o UML).
3. Kind nuevo `"entity-relationship"` con notación Chen y metamodelo
   cerrado, mismo shell (FR-P07), mismo autosave (ADR-007).

## Decision

Opción 3.

- Fuente: Peter P. Chen, «The Entity-Relationship Model—Toward a Unified
  View of Data», ACM TODS 1(1), 1976. Forma persistida:
  [`er-model.md`](../architecture/er-model.md).
- Un documento, un kind. No convierte un class diagram en ER ni al
  revés.
- W12-06 (multiplicidad de casos de uso) **no** se reabre. Chen usa
  cardinalidad `"1" | "N"` solo en `er-link` entidad–rombo.
- Crow’s foot / IE, entidad débil y atributos compuestos quedan fuera
  del subconjunto hasta revisar este ADR y `er-model.md`.
- Motor: React Flow (ADR-002). Elipse y rombo son nodos custom, no un
  segundo motor.
- Marca: addendum de iconos en TASK-059, mismo contrato SVG. Sin kit.

## Rationale

Clases y Chen no comparten notación ni semántica (rombo vs asociación
UML; elipse vs compartimento). Forzar ER dentro de `"class"` rompería
W17-13 y la fuente UML 2.5.1. Un kind propio encaja en FR-P07 y en la
biblioteca local sin IndexedDB.

## Consequences

- El producto 3.0 no es «solo UML»: el chrome puede listar «Entidad
  relación» junto a kinds UML. El tagline deja de decir solo «casos de
  uso».
- Un parser 2.0 que encuentre `kind: "entity-relationship"` lo trata
  como `UNKNOWN_KIND` (major 3.0).
- O-01 se parte otra vez: entra W17-17 (ER Chen); Crow’s foot permanece
  exclusión.

## Rejected alternatives

- **Opción 1:** contradice el alcance pedido para Release 2.
- **Opción 2:** inventaría Crow’s foot o class-as-ER sin fuente Chen, y
  mezclaría W17-13 con un modelo distinto.

## Relación con otros ADR

| ADR | Efecto |
| --- | --- |
| ADR-002 | Addendum de proyección (elipse/rombo). Sin segundo motor. |
| ADR-007 | Un documento ER es una fila más de la biblioteca. |
| ADR-004 | Sin cambio de backend. |
| ADR-006 | Raster por `exportDiagram`; el chrome no entra al PNG. |
