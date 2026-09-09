# Árbol oficial post-TASK-024

Índice canónico de estado para TASK-026+. TASK-001–025 permanecen en
`docs/tasks/`; no hay stubs ni copias de contratos anidados.

## Cómo leer este árbol

- `Lista`: contrato cerrado; puede ejecutarse cuando todas sus dependencias
  estén `Hecha`.
- `En curso`: existe un chat responsable y el índice debe identificar su
  evidencia al cerrar.
- `Bloqueada`: una dependencia o decisión explícita impide empezar/continuar.
- `Hecha`: criterios `[x]` y «Evidencia de cierre» versionada.
- `Propuesta`, `Condicional` y `Fuera de alcance vigente` solo aparecen en
  [roadmap.md](roadmap.md); no son TASKs ejecutables.

Una TASK por chat. La ruta completa del archivo es parte del prompt. El
`mvp-spec.md` y los ADRs prevalecen sobre este índice.

## Gate de entrada

TASK-025 habilita rutas y protocolo. TASK-026–030 son contratos listos, pero
las tareas que validan el producto post-identidad no empiezan hasta que
TASK-024 tenga evidencia de cierre. TASK-031+ espera además el gate TASK-030.

## Estado

| ID | Ruta | Estado | Prioridad | Depende | Evidencia / bloqueo |
| --- | --- | --- | --- | --- | --- |
| 025 | [`../TASK-025.md`](../TASK-025.md) | Hecha | P0 | 023 + contrato 024 | 2026-09-09: árbol, registro, roadmap y 026–033 |
| 026 | [`10-release/TASK-026.md`](10-release/TASK-026.md) | Hecha | P0 | 024, 025 | 2026-09-09: checklist RC firmado post-identidad (Chrome 152 preview; Playwright Chromium/Firefox/WebKit). Safari nativo: desviación Windows → WebKit |
| 027 | [`10-release/TASK-027.md`](10-release/TASK-027.md) | Hecha | P0 | 025 | 2026-09-09: Juan Sarmiento eligió Apache-2.0; `LICENSE` versionada |
| 028 | [`10-release/TASK-028.md`](10-release/TASK-028.md) | Hecha | P0 | 025 | 2026-09-09: A-01–A-12 dispuestas; ADR-005 CI=preview; fase 9 no bloqueó RC 020 |
| 029 | [`10-release/TASK-029.md`](10-release/TASK-029.md) | Hecha | P1 | 025 | 2026-09-09: export 200/300 2x no cabe (1x 3280 ms); JSON ~95 KiB UTF-16; dominio 97.56 %/96.69 %; markers Safari aceptados |
| 030 | [`10-release/TASK-030.md`](10-release/TASK-030.md) | Lista | P0 | 026–029 | Gate de salida fase 10 |
| 031 | [`11-governance/TASK-031.md`](11-governance/TASK-031.md) | Lista | P0 | 030 | Spec Post-MVP |
| 032 | [`11-governance/TASK-032.md`](11-governance/TASK-032.md) | Lista | P0 | 031 | Evolución schema/storage |
| 033 | [`11-governance/TASK-033.md`](11-governance/TASK-033.md) | Lista | P0 | 031, 032 | Congela primera wave |

## Fases y gates

### Fase 10 — Remediación del release

TASK-026–029 pueden avanzar en paralelo cuando sus dependencias lo permitan.
TASK-030 exige las cuatro y decide si el release es honesto y reproducible.
No introduce nuevos elementos UML.

Gate:

- TASK-024 verificada después de identidad.
- Checklist y navegadores firmados.
- Licencia decidida o afirmación Open Source retirada.
- Contradicciones documentales resueltas.
- Riesgos medidos o aceptados explícitamente.

### Fase 11 — Gobierno Post-MVP

TASK-031 define la spec futura; TASK-032 define cómo evolucionan documentos
persistidos; TASK-033 selecciona una sola wave y recién entonces crea
TASK-034+.

Gate:

- FR, non-goals y versión objetivo aprobados.
- Compatibilidad y migración decididas antes de tocar schema.
- Primera wave acotada con presupuesto y dependencias.

### Fases 12–17 — Catálogo, no ejecución

El inventario completo vive en [roadmap.md](roadmap.md). Las carpetas de estas
fases no se crean hasta TASK-033 o un gate posterior. Esto evita que un nombre
de archivo parezca autorización para implementar Post-MVP.

## Registro de auditoría

[risk-register.md](risk-register.md) asigna los 49 hallazgos a:

- una TASK ejecutable;
- una decisión humana;
- una contingencia condicionada por evidencia; o
- una exclusión vigente que TASK-031 puede reconsiderar.

Los 94 criterios históricos sin firma se registran como problema de proceso,
no como 94 features pendientes.

## Próximo paso

TASK-026–029 están `Hecha`. Siguiente:

- [TASK-030](10-release/TASK-030.md) (gate de salida fase 10).

TASK-031+ espera el gate TASK-030.
