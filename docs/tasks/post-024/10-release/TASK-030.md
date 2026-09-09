# TASK-030: Gate de salida de la remediación

## Estado documental

Lista

## Objetivo

Decidir si el RC es honesto y reproducible: evidencias 026–029 cerradas,
limitaciones publicadas y Post-MVP aún no empezado.

## Prioridad

P0

## Dependencias

TASK-026, TASK-027, TASK-028, TASK-029

## Contexto obligatorio

- @docs/product/mvp-spec.md
- @docs/tasks/post-024/README.md
- @docs/tasks/post-024/risk-register.md
- @docs/tasks/post-024/roadmap.md
- @README.md
- @docs/tasks/post-024/10-release/TASK-026.md
- @docs/tasks/post-024/10-release/TASK-027.md
- @docs/tasks/post-024/10-release/TASK-028.md
- @docs/tasks/post-024/10-release/TASK-029.md

## Estado inicial

La fase 10 reparte firma RC, licencia, docs y medidas. Nada de eso autoriza
Generalization, IndexedDB, PDF ni temas. El roadmap sigue en estado catálogo.

## Dentro del alcance

- Verificar que 026–029 están `Hecha` (o `Bloqueada` con dueño y sin fingir
  verde).
- Comprobar que ningún R/P/A de severidad alta queda sin disposición.
- Confirmar CI (`check`, E2E acordado, audit) según la política Playwright
  reconciliada.
- Publicar en README/mvp-spec: ship / no ship y por qué (fase 9, checklist,
  licencia).
- Desbloquear explícitamente TASK-031 o dejar Post-MVP `Bloqueada`.
- Actualizar el índice.

## Fuera del alcance

- Escribir `post-mvp-spec.md` (TASK-031).
- Crear TASK-034+ o carpetas 12–17.
- Implementar producto.

## Archivos / módulos afectados

- `README.md`
- `docs/product/mvp-spec.md` (solo clasificación ship / fase 9 si 028 no la
  cerró)
- `docs/tasks/post-024/README.md`
- `docs/tasks/post-024/risk-register.md`
- `docs/tasks/post-024/10-release/TASK-030.md`

## Cambios esperados

Un extraño puede saber: «este zip es el RC, con estas limitaciones, bajo esta
licencia (o sin claim Open Source), y el Post-MVP no está a medias».

## Restricciones

- No medio-implementar Post-MVP (regla TASK-020).
- No reabrir ADRs aquí.
- Dependencias 026–029 son reales: no cerrar 030 con 026 abierta.

## Criterios de aceptación

- [ ] 026–029 `Hecha` o `Bloqueada` documentada (nunca silenciosa).
- [ ] Hallazgos alta severidad del registro tienen disposición.
- [ ] README describe RC, limitaciones y licencia/silencio de forma
      consistente.
- [ ] TASK-031 queda `Lista` solo si este gate es `Hecha`.
- [ ] Índice actualizado.

## Tests

Revisión del índice y del registro. `npm run check` si el árbol de producto
no está sucio por otras TASK.

## Comandos de verificación

```bash
npm run check
```

## Stop conditions

- Una dependencia sigue `En curso` o `Lista` sin evidencia.
- Se pide «aprobar el RC» y a la vez empezar Generalization en el mismo chat.

## Definition of Done

Fase 10 cerrada; gobernanza Post-MVP habilitada o explícitamente aplazada.

## Evidencia de cierre

Pendiente.
