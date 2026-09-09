# TASK-033: Freeze de la primera wave Post-MVP

## Estado documental

Lista

## Objetivo

Congelar la primera wave autorizada y promover **solo** sus entradas maduras
del roadmap a TASK-034+, con contratos ejecutables.

## Prioridad

P0

## Dependencias

TASK-031, TASK-032

## Contexto obligatorio

- @docs/tasks/post-024/11-governance/TASK-031.md
- @docs/tasks/post-024/11-governance/TASK-032.md
- @docs/tasks/post-024/roadmap.md
- @docs/tasks/post-024/README.md
- @docs/development/task-template.md
- @docs/development/agent-workflow.md

## Estado inicial

Las fases 12–17 existen solo como catálogo. No hay carpetas `12-uml/` …
`17-ecosystem/` ni TASK-034+. Crear esas TASK ahora, sin freeze, obligaría
al implementador a inventar UML, persistencia o export.

## Dentro del alcance

- Elegir la primera wave (una fase o un subconjunto priorizado por 031).
- Crear `docs/tasks/post-024/<fase>/` **solo** para esa wave.
- Redactar TASK-034+ **únicamente** para ítems `Lista`: decisiones cerradas,
  contexto obligatorio, CA, stops, sin stubs.
- Dejar el resto del roadmap en `propuesta` / `bloqueado` / `condicional`.
- Actualizar el índice (próximo contrato ejecutable = TASK-034 o la primera
  de la wave).
- Numerar en secuencia global; un ID = un archivo; sin alias planos.

## Fuera del alcance

- Implementar la wave.
- Inventar semántica para ítems `bloqueado`.
- Reabrir ADRs (solo listarlos en el contexto de cada TASK nueva si 032 lo
  exige).
- Mover TASK-001–025 de su ruta.

## Archivos / módulos afectados

- `docs/tasks/post-024/11-governance/TASK-033.md`
- `docs/tasks/post-024/<fase>/TASK-034.md` … (los que el freeze autorice)
- `docs/tasks/post-024/README.md`
- `docs/tasks/post-024/roadmap.md`
- `docs/tasks/README.md` (puntero a la wave, sin duplicar contratos)

## Cambios esperados

Hay un siguiente chat ejecutable. El catálogo deja de parecer un backlog
fingido.

## Restricciones

- Una TASK = contrato listo. Si falta una decisión UML/ADR, no se crea el
  archivo.
- Una TASK por chat sigue vigente.
- Contexto obligatorio mínimo; mvp-spec y ADRs ganan sobre el Post-MVP si
  chocan con el producto actual (el MVP no se rompe).

## Criterios de aceptación

- [ ] Wave 1 nombrada y acotada.
- [ ] Solo esa wave tiene carpeta y TASK-034+.
- [ ] Cada TASK nueva pasa el template (estado Lista, CA, stops, evidencia
      vacía).
- [ ] Ítems no maduros siguen en el roadmap, no como TASK.
- [ ] Índice y `docs/tasks/README.md` apuntan al próximo contrato.

## Tests

Glob `docs/tasks/**/TASK-*.md`: IDs únicos, enlaces rotos ausentes.

## Comandos de verificación

```bash
npm run format:check
git diff --check
```

## Stop conditions

- Se pide crear TASK para toda la fase 12–17 de una vez.
- Un ítem de la wave sigue `bloqueado` y se pide TASK «para ir avanzando».

## Definition of Done

Primera wave congelada; TASK-034+ existen solo donde el contrato es ejecutable.

## Evidencia de cierre

Pendiente. Esta TASK **crea** archivos 034+; no los implementa.
