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
- `Propuesta`, `Autorizado en spec`, `Condicional` y
  `Fuera de alcance vigente` solo aparecen en [roadmap.md](roadmap.md);
  no son TASKs ejecutables. `Congelada` en el roadmap apunta al archivo
  TASK. `Autorizado en spec` sin freeze sigue siendo catálogo.

Una TASK por chat. La ruta completa del archivo es parte del prompt. El
`mvp-spec.md` y los ADRs prevalecen sobre este índice.

## Gate de entrada

TASK-025 habilita rutas y protocolo. TASK-026–032 están `Hecha`. TASK-030
cerró el gate de fase 10 (**ship**, 2026-09-09). TASK-031 publicó
[`post-mvp-spec.md`](../../product/post-mvp-spec.md). TASK-032 publicó
[`schema-evolution.md`](../../architecture/schema-evolution.md).
TASK-033 congeló la Wave 1 (**Editor local sobre schema 1**). TASK-034
y TASK-035 están `Hecha`. TASK-036 revisó el catálogo multi-kind
(W17-01, W17-13); no congeló implementación. TASK-037 congeló la Wave 2
(**Intercambio y distribución sobre schema 1**). TASK-038–041 están
`Hecha`. Wave 2 cerrada. TASK-042 y TASK-043 son remediación 1.x
(defectos de selección; no son freeze de catálogo). TASK-044 es
remediación 1.x (ocultar paleta/inspector en desktop).

## Estado

| ID | Ruta | Estado | Prioridad | Depende | Evidencia / bloqueo |
| --- | --- | --- | --- | --- | --- |
| 025 | [`../TASK-025.md`](../TASK-025.md) | Hecha | P0 | 023 + contrato 024 | 2026-09-09: árbol, registro, roadmap y 026–033 |
| 026 | [`10-release/TASK-026.md`](10-release/TASK-026.md) | Hecha | P0 | 024, 025 | 2026-09-09: checklist RC firmado post-identidad (Chrome 152 preview; Playwright Chromium/Firefox/WebKit). Safari nativo: desviación Windows → WebKit |
| 027 | [`10-release/TASK-027.md`](10-release/TASK-027.md) | Hecha | P0 | 025 | 2026-09-09: Juan Sarmiento eligió Apache-2.0; `LICENSE` versionada |
| 028 | [`10-release/TASK-028.md`](10-release/TASK-028.md) | Hecha | P0 | 025 | 2026-09-09: A-01–A-12 dispuestas; ADR-005 CI=preview; fase 9 no bloqueó RC 020 |
| 029 | [`10-release/TASK-029.md`](10-release/TASK-029.md) | Hecha | P1 | 025 | 2026-09-09: export 200/300 2x no cabe (1x 3280 ms); JSON ~95 KiB UTF-16; dominio 97.56 %/96.69 %; markers Safari aceptados |
| 030 | [`10-release/TASK-030.md`](10-release/TASK-030.md) | Hecha | P0 | 026–029 | 2026-09-09: ship; RC honesto (026–029); Post-MVP catálogo; TASK-031 desbloqueada |
| 031 | [`11-governance/TASK-031.md`](11-governance/TASK-031.md) | Hecha | P0 | 030 | 2026-09-09: `post-mvp-spec.md`; waves 12–17 con destino; O-01–O-10 dispuestos; mvp-spec enlaza Post-MVP |
| 032 | [`11-governance/TASK-032.md`](11-governance/TASK-032.md) | Hecha | P0 | 031 | 2026-09-09: `schema-evolution.md`; schema 1 cerrado; IndexedDB condicional; FR-P03 envelope; ningún ADR reabierto |
| 033 | [`11-governance/TASK-033.md`](11-governance/TASK-033.md) | Hecha | P0 | 031, 032 | 2026-09-09: Wave 1 **Editor local sobre schema 1** (W12-01, W13-02); TASK-034 y TASK-035 |
| 034 | [`12-uml/TASK-034.md`](12-uml/TASK-034.md) | Hecha | P0 | 033 | 2026-09-09: FR-P01; `INCLUDE_CYCLE`/`EXTEND_CYCLE`; schema 1 |
| 035 | [`13-editor/TASK-035.md`](13-editor/TASK-035.md) | Hecha | P0 | 033 | 2026-09-09: FR-P02; guías de alineación (chrome); schema 1 |
| 036 | [`11-governance/TASK-036.md`](11-governance/TASK-036.md) | Hecha | P0 | 031, 032 | 2026-09-09: W17-01 plataforma + W17-13 clases (bloqueadas); FR-P07; `diagram-kinds.md`; schema `1` intacto |
| 037 | [`11-governance/TASK-037.md`](11-governance/TASK-037.md) | Hecha | P0 | 033, 036 | 2026-09-09: Wave 2 **Intercambio y distribución sobre schema 1** (W14-03, W13-03, W15-03, W17-05); TASK-038–041 |
| 038 | [`14-persistence/TASK-038.md`](14-persistence/TASK-038.md) | Hecha | P0 | 037 | 2026-09-09: FR-P03; envelope `arkuml-usecase-json`; schema `1`; autosave `arkuml:workspace:v1` intacto |
| 039 | [`13-editor/TASK-039.md`](13-editor/TASK-039.md) | Hecha | P1 | 037 | 2026-09-09: FR-P04; MiniMap xyflow (chrome); schema `1`; ausente <1024 px |
| 040 | [`15-export/TASK-040.md`](15-export/TASK-040.md) | Hecha | P1 | 037 | 2026-09-09: FR-P05; Copiar PNG/JPG reutiliza `exportDiagram`; pin 1.11.11; schema `1` |
| 041 | [`17-ecosystem/TASK-041.md`](17-ecosystem/TASK-041.md) | Hecha | P1 | 037 | 2026-09-14: FR-P06; `docs/operations/static-hosting.md`; README enlaza; sin secrets ni workflow |
| 042 | [`13-editor/TASK-042.md`](13-editor/TASK-042.md) | Hecha | P0 | 014, 041 | 2026-09-14: click selecciona Association/Include/Extend; inspector y reconnect retargetean; interior del boundary pasante |
| 043 | [`13-editor/TASK-043.md`](13-editor/TASK-043.md) | Hecha | P0 | 042 | 2026-09-14: paleta Selección; crear relación vuelve a ese modo; click de nodo no conserva la relación |
| 044 | [`13-editor/TASK-044.md`](13-editor/TASK-044.md) | Hecha | P1 | 043 | 2026-09-14: rieles `<<`/`>>` en paleta/inspector ≥1024; drawers compactos intactos |

## Fases y gates

### Fase 10 — Remediación del release

TASK-026–029 están `Hecha`. TASK-030 cerró el gate: el RC es honesto y
reproducible. No introduce nuevos elementos UML. El Post-MVP no está a medias.

Gate (cumplido 2026-09-09):

- TASK-024 verificada después de identidad.
- Checklist y navegadores firmados (TASK-026).
- Licencia Apache-2.0 (TASK-027).
- Contradicciones documentales resueltas (TASK-028).
- Riesgos medidos o aceptados explícitamente (TASK-029).

### Fase 11 — Gobierno Post-MVP

TASK-031 definió la spec futura; TASK-032 publicó
[`schema-evolution.md`](../../architecture/schema-evolution.md);
TASK-033 congeló la Wave 1 y creó TASK-034 y TASK-035. TASK-036 publicó
[`diagram-kinds.md`](../../architecture/diagram-kinds.md) y enmendó
W17-01/W17-13. TASK-037 congeló la Wave 2 y creó TASK-038–041.

Gate (cumplido 2026-09-09):

- FR, non-goals y versión objetivo aprobados (TASK-031).
- Compatibilidad y migración publicadas (TASK-032).
- Primera wave acotada: **Editor local sobre schema 1** (TASK-033).
- Catálogo multi-kind: plataforma (W17-01) y clases (W17-13) bloqueadas
  (TASK-036).
- Segunda wave acotada: **Intercambio y distribución sobre schema 1**
  (TASK-037).

### Fases 12–17 — Catálogo salvo las waves congeladas

El inventario completo vive en [roadmap.md](roadmap.md), alineado con
[`post-mvp-spec.md`](../../product/post-mvp-spec.md). Existen
`12-uml/` (TASK-034), `13-editor/` (TASK-035, TASK-039, TASK-042, TASK-043 y TASK-044),
`14-persistence/` (TASK-038), `15-export/` (TASK-040) y
`17-ecosystem/` (TASK-041). No hay `16-a11y/`. W17-01/13 y el resto del
catálogo no son ejecutables.

## Registro de auditoría

[risk-register.md](risk-register.md) asigna los 49 hallazgos a:

- una TASK ejecutable;
- una decisión humana;
- una contingencia condicionada por evidencia; o
- una exclusión vigente o una entrada de catálogo (in-scope / más tarde /
  condicional) según [post-mvp-spec.md](../../product/post-mvp-spec.md).

Los 94 criterios históricos sin firma se registran como problema de proceso,
no como 94 features pendientes.

## Próximo paso

Wave 2 (**Intercambio y distribución sobre schema 1**) está `Hecha`
(TASK-038–041). TASK-042 y TASK-043 (remediación 1.x, selección)
están `Hecha`. TASK-044 (ocultar paleta/inspector en desktop) está
`Hecha`. W17-01/13 siguen bloqueadas.
Multi-documento: no. IndexedDB: no elegido (condicional C-QUOTA). No
implementar Generalization, PDF, temas ni un class diagram en estos
chats.
