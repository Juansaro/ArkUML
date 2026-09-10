# Backlog de implementación

Orden exacto. No saltar gates.

```text
TASK-001 → TASK-002 → … → TASK-023 → TASK-024 → TASK-025
                                                      ↓
                                      post-024 (DAG gobernado por gates)
```

Cada archivo es el contrato para un chat de Grok 4.6. Workflow:
[agent-workflow.md](../development/agent-workflow.md). Plantilla:
[task-template.md](../development/task-template.md). TASK-001–025 conservan
ruta plana; TASK-026+ usan la ruta canónica del
[árbol post-024](post-024/README.md), sin aliases.

## Fases y gates

| Fase | Objetivo | Tareas | Gate |
| --- | --- | --- | --- |
| 1 Fundación | SPA y calidad reproducibles | 001–002 | `check` + smoke E2E |
| 2 Dominio | Datos y lógica puros + persistencia | 003–006 | tests de domain/store/persistence |
| 3 Editor | Shell, canvas, elementos, edición | 007–012 | E2E de interacción básica |
| 4 Relaciones | Tres relaciones UML | 013–014 | matriz unit + E2E conexiones |
| 5 Producto | Recuperación y export | 015–016 | reload + firmas PNG/JPG |
| 6 Validación | a11y, E2E estable | 017–018 | axe, keyboard, repeat=3 |
| 7 Hardening | Perf, CI, RC | 019–020 | presupuesto, CI, auditoría de alcance |
| 8 Cierre RC | Hallazgos del checklist manual | 021–022 | checklist firmado + FR-07 en inspector |
| 9 Identidad | Marca y ergonomía visual | 023–024 | contrato aprobado + iconos/tooltips accesibles |
| Puente | Gobierno del contexto futuro | 025 | árbol anidado + estados + trazabilidad |

Las fases 10+ y su orden por dependencias viven en
[post-024/README.md](post-024/README.md). No se ejecuta una entrada del roadmap
que aún no tenga archivo TASK y estado `Lista`.

## Índice

| ID | Nombre | Prioridad | Depende |
| --- | --- | --- | --- |
| [TASK-001](TASK-001.md) | Scaffold SPA | P0 | ninguna |
| [TASK-002](TASK-002.md) | Calidad y harness de tests | P0 | 001 |
| [TASK-003](TASK-003.md) | Modelo de documento y schema | P0 | 002 |
| [TASK-004](TASK-004.md) | Reglas UML y operaciones | P0 | 003 |
| [TASK-005](TASK-005.md) | Store e historial | P0 | 004 |
| [TASK-006](TASK-006.md) | LocalStorage y autosave | P0 | 003, 005 |
| [TASK-007](TASK-007.md) | Shell visual | P0 | 002 |
| [TASK-008](TASK-008.md) | React Flow adapter y spike de export | P0 | 005, 007 |
| [TASK-009](TASK-009.md) | Elementos UML y creación | P0 | 004, 008 |
| [TASK-010](TASK-010.md) | Selección, edición y movimiento | P0 | 009 |
| [TASK-011](TASK-011.md) | Contención, reparent y resize | P0 | 010 |
| [TASK-012](TASK-012.md) | Borrar, duplicar, atajos, undo UI | P1 | 005, 011 |
| [TASK-013](TASK-013.md) | Association | P0 | 012 |
| [TASK-014](TASK-014.md) | Include y Extend | P0 | 013 |
| [TASK-015](TASK-015.md) | Restore, recovery y nuevo diagrama | P0 | 006, 012 |
| [TASK-016](TASK-016.md) | Exportación PNG/JPG | P0 | 014, 015 |
| [TASK-017](TASK-017.md) | Accesibilidad y responsive | P1 | 016 |
| [TASK-018](TASK-018.md) | E2E crítico y visual | P0 | 017 |
| [TASK-019](TASK-019.md) | Presupuesto de rendimiento | P0 | 018 |
| [TASK-020](TASK-020.md) | CI, auditoría y release candidate | P0 | 019 |
| [TASK-021](TASK-021.md) | Cerrar huecos del checklist RC | P1 | 020 |
| [TASK-022](TASK-022.md) | Razón visible al conectar desde el inspector | P1 | 014, 020 |
| [TASK-023](TASK-023.md) | Contrato de identidad visual de ArkUML | P1 | 022 |
| [TASK-024](TASK-024.md) | Iconografía y tooltips accesibles | P1 | 023 |
| [TASK-025](TASK-025.md) | Habilitar el árbol oficial post-024 | P0 | 023 + contrato 024 |

## Estado documental

TASK-001–024 son contratos históricos sin estado formal versionado. Sus
checkboxes abiertos no permiten inferir por sí solos el estado del código. El
protocolo de estado y cierre comienza en TASK-025; el índice post-024 es la
fuente de estado para TASK-026+.

## Post-024

Gobierno y estado: [post-024/README.md](post-024/README.md). Roadmap
(catálogo): [post-024/roadmap.md](post-024/roadmap.md).

Wave 1 congelada (**Editor local sobre schema 1**). Wave 2 congelada
(**Intercambio y distribución sobre schema 1**). Próximo contrato
ejecutable: [TASK-039](post-024/13-editor/TASK-039.md). Siguientes
en la wave: [TASK-040](post-024/15-export/TASK-040.md),
[TASK-041](post-024/17-ecosystem/TASK-041.md). No duplicar aquí los
contratos.
