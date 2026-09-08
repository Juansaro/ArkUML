# Decisiones de arquitectura

| ADR | Tema |
| --- | --- |
| [ADR-001](ADR-001-frontend-stack.md) | Vite, React, TypeScript 6, Node 24.15+, ESLint/Prettier |
| [ADR-002](ADR-002-diagram-engine.md) | React Flow 12; reserva X6 |
| [ADR-003](ADR-003-state-management.md) | Zustand e historial de snapshots |
| [ADR-004](ADR-004-persistence.md) | LocalStorage + `DiagramRepository` |
| [ADR-005](ADR-005-testing.md) | Vitest + Testing Library + Playwright |
| [ADR-006](ADR-006-export.md) | `html-to-image@1.11.11` → `toBlob` |

No reabrir estas decisiones en una TASK de implementación. Si el spike de export (TASK-008) falla, el procedimiento es reabrir **ADR-006** (y solo entonces ADR-002).
