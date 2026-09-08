# ADR-003: Gestión de estado

## Context

El editor combina un documento UML, selección, viewport, herramienta activa, historial undo/redo y status de persistencia. React Flow ofrece estado interno de nodos/edges; usarlo como fuente de verdad acoplaría el dominio al motor.

## Problem

Dónde vive el estado, cómo se deshace y cómo se evita re-renderizar chrome durante el drag.

## Options

1. Zustand con slices y acciones semánticas; historial de snapshots del documento.
2. Redux Toolkit + listener middleware / zundo.
3. Context + `useReducer`.
4. Estado 100 % interno de React Flow (`useNodesState` / `useEdgesState`) persistiendo `toObject()`.
5. Event sourcing o clases Command.

## Decision

Opción 1.

- Un store Zustand 5.
- Acciones semánticas (`createActor`, `commitMove`, …). Los componentes no hacen `setState` genérico del documento.
- Historial: pila de `DiagramDocument`, máximo 100, con `beginTransaction` / `commitTransaction` / `cancelTransaction` para drag y resize.
- Selectores pequeños; `useShallow` cuando se proyecte un objeto.
- **No** usar `persist` middleware de Zustand: avisa que `JSON.parse` no valida. La persistencia es un adapter (ADR-004).
- Viewport y selección en el store, fuera del historial.

## Rationale

Zustand tiene poco boilerplate, selectores baratos y tests simples (store sin React). Redux aporta más ceremonia sin beneficio en un único cliente. Context re-renderiza con facilidad. Event sourcing y command classes son ilegibles para un MVP y para agentes. El estado interno de React Flow es exactamente el acoplamiento que queremos evitar.

## Consequences

- Hay que mapear ida y vuelta en cada commit de geometría.
- 100 snapshots copian el documento; el tamaño JSON esperado es pequeño. Si crece, TASK-019 lo medirá.
- Undo no restaura selección ni zoom (intencional).

## Rejected alternatives

- **Redux Toolkit:** más archivos y conceptos (slices, thunks) sin requisito de DevTools empresariales.
- **Context:** malo para drag de alta frecuencia.
- **React Flow como source of truth:** bloquea cambiar de motor y ensucia el JSON.
- **Event sourcing / Immer+zundo obligatorio:** sobreingeniería. Immer no se añade salvo que las actualizaciones inmutables se vuelvan error-prone de forma demostrable.
