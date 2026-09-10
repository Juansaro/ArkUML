# Decisiones de arquitectura

| ADR | Tema |
| --- | --- |
| [ADR-001](ADR-001-frontend-stack.md) | Vite, React, TypeScript 6, Node 24.15+, ESLint/Prettier |
| [ADR-002](ADR-002-diagram-engine.md) | React Flow 12; reserva X6 |
| [ADR-003](ADR-003-state-management.md) | Zustand e historial de snapshots |
| [ADR-004](ADR-004-persistence.md) | LocalStorage + `DiagramRepository` |
| [ADR-005](ADR-005-testing.md) | Vitest + Testing Library + Playwright |
| [ADR-006](ADR-006-export.md) | `html-to-image@1.11.11` → `toBlob` |

No reabrir estas decisiones en una TASK de implementación.

El spike de export (TASK-008) **ya se ejecutó** (2026-09-07): Chromium y Firefox rasterizan de forma estable; WebKit/Safari puede omitir `marker-end` de forma intermitente. Esa degradación está **aceptada**; no se reabrió ADR-006. Reabrir **ADR-006** (y solo entonces ADR-002) solo si un fallo nuevo de export lo exige.

## Reaperturas futuras (no en este árbol)

Ningún ADR nuevo aquí. La política está en
[`schema-evolution.md`](../architecture/schema-evolution.md). Primera
wave (schema `1`, chrome): ninguno.

| ADR | Abrir **antes** de tocar código si… | No abrir si… |
| --- | --- | --- |
| ADR-004 | C-QUOTA → IndexedDB, o una revisión futura pide multi-documento | FR-P03 (archivo JSON del documento activo); sync multi-tab (sigue exclusión); W17-01/13 (un documento, un kind) |
| ADR-003 | El historial deja de ser RAM-only o undo restaura viewport/selección | Warnings, guías, minimap o el JSON de usuario |
| ADR-006 | C-EXPORT, fallo nuevo de raster, o W15-01/02 | Clipboard de imagen que reutiliza `exportDiagram` |
| ADR-002 | Addendum cuando se desbloquee W17-13 (clases) o waypoints persistidos | Plataforma por `kind` (FR-P07) sin segundo motor |
