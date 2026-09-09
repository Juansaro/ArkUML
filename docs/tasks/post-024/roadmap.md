# Roadmap Post-MVP (catálogo, no spec)

Inventario alineado con
[`docs/product/post-mvp-spec.md`](../../product/post-mvp-spec.md). Una
entrada **no** es una TASK. La spec decide destinos y prioridades; este
archivo proyecta el estado operativo. TASK-032 publicó
[`schema-evolution.md`](../../architecture/schema-evolution.md).
TASK-033 es el único que puede promover entradas maduras a `TASK-034+`.

## Estados de catálogo

| Estado | Significado |
| --- | --- |
| Autorizado en spec | Incluido como FR o infra en `post-mvp-spec.md`. No es implementación. |
| Propuesta | Trazada; decisiones abiertas. |
| Bloqueada | Espera un gate, ADR, fuente UML o decisión humana. |
| Condicional | Solo se abre si hay evidencia medida (perf, cuota, raster). |
| Fuera de alcance vigente | Exclusión deliberada hasta revisar el Post-MVP spec. |

Promover una entrada a TASK exige: fuente canónica, decisiones cerradas,
ADR identificado o nuevo, dependencias y criterio de aceptación. Si falta
cualquiera, el implementador se detiene; no inventa UML, persistencia ni
export.

Prioridades P0/P1/P2 son las de la spec. «—» = no aplica (exclusión,
condicional o infra).

## Fase 12 — Semántica UML

| ID | Capacidad | Pri. | Fuente | Valor / riesgo | Decisiones | ADR | Depende | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W12-01 | Detección de ciclos Include/Extend (warning no bloqueante) | P0 | `post-mvp-spec.md` FR-P01; `mvp-spec.md` avisos geométricos | Consistencia; no rechaza documentos válidos hoy | Cerrada: aviso, no bloqueo | Posible addendum de dominio | TASK-033 | Autorizado en spec |
| W12-02 | Generalization | P1 | `mvp-spec.md`; `domain-model.md` (`kind` nuevo) | Relación nueva, no un flag | ¿Actores, casos o ambos? Matriz `canConnect`. Sin fuente UML acordada | Bump `schemaVersion` (`schema-evolution.md`) | TASK-033 | Bloqueada |
| W12-03 | Extension points y condiciones de extend | P2 | `mvp-spec.md`; `TASK-014.md` | Semántica UML más rica | Forma persistida; copy de UI | Bump `schemaVersion` (`schema-evolution.md`) | W12-02 | Bloqueada |
| W12-04 | Notas | P1 | `mvp-spec.md` | Comentario visual | ¿Elemento o overlay? Relación con export | Bump si se persisten (`schema-evolution.md`) | TASK-033 | Bloqueada |
| W12-05 | Paquetes | — | `mvp-spec.md`; `post-mvp-spec.md` | Agrupación vs boundary único | No se reabre aquí | — | — | Fuera de alcance vigente |
| W12-06 | Multiplicidad | — | `mvp-spec.md`; `post-mvp-spec.md` | Anotación de extremos | Sin fuente UML acordada | — | — | Fuera de alcance vigente |
| W12-07 | Actores no humanos especializados | P2 | `mvp-spec.md` | Variante visual/semántica | ¿Nuevo `kind` o estereotipo? | Bump si hay `kind` nuevo (`schema-evolution.md`) | TASK-033 | Bloqueada |

## Fase 13 — Potencia del editor

| ID | Capacidad | Pri. | Fuente | Valor / riesgo | Decisiones | ADR | Depende | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W13-01 | Waypoints / routing en el documento | P1 | `mvp-spec.md`; `TASK-013.md` | Control de trazado | Geometría persistida vs proyección RF | Bump si se persisten (`schema-evolution.md`); posible addendum ADR-002 | TASK-033 | Bloqueada |
| W13-02 | Alignment guides (solo chrome) | P0 | `post-mvp-spec.md` FR-P02 | Precisión de layout | Cerrada: no persistido, no historial, no export | — | TASK-033 | Autorizado en spec |
| W13-03 | Minimap | P1 | `post-mvp-spec.md` FR-P04; `TASK-009.md` | Navegación en diagramas grandes | Cerrada: chrome; exclusión de export | — | TASK-033 | Autorizado en spec |
| W13-04 | Auto-layout | P2 | `mvp-spec.md` | Colocación automática | Algoritmo y dependencia (stop si hay paquete nuevo) | ADR-001/002 | TASK-033 | Bloqueada |

## Fase 14 — Persistencia y documentos

| ID | Capacidad | Pri. | Fuente | Valor / riesgo | Decisiones | ADR | Depende | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W14-01 | IndexedDB `DiagramRepository` | — | `ADR-004`; `schema-evolution.md` | Cuota ~5 MiB; umbral ~1 MiB habitual | No elegido. Solo C-QUOTA. localStorage hasta evidencia | Reabrir ADR-004 **antes** de código | C-QUOTA | Condicional |
| W14-02 | Multi-documento | — | `mvp-spec.md`; `post-mvp-spec.md` | Varios diagramas locales | Excluido: un único workspace | ADR-004 si una revisión futura lo levanta | — | Fuera de alcance vigente |
| W14-03 | Import/export JSON de usuario | P0 | `post-mvp-spec.md` FR-P03; `schema-evolution.md` | Intercambio de archivos | Cerrada: envelope `arkuml-usecase-json` / `formatVersion` 1; payload schema 1; no es el snapshot interno | No reabrir ADR-004 | TASK-033 | Autorizado en spec |
| W14-04 | `migrate()` real | — | `domain-model.md`; `schema-evolution.md` | Evolución sin pérdida | Política publicada (bump, orden, rechazo, confirmación). Sin código hasta el primer bump | — | Primer bump de schema en una wave | Autorizado en spec |
| W14-05 | Sync multi-tab | — | `ADR-004`; `post-mvp-spec.md` | Hoy last-write-wins | Aceptado; no se reabre | ADR-004 | — | Fuera de alcance vigente |

## Fase 15 — Exportación

| ID | Capacidad | Pri. | Fuente | Valor / riesgo | Decisiones | ADR | Depende | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W15-01 | SVG persistido / export SVG | P1 | `mvp-spec.md`; `ADR-006` | Vectorial; no es el PNG actual | Formato y atribución RF | Reabrir ADR-006 | TASK-033 | Bloqueada |
| W15-02 | PDF | P2 | `mvp-spec.md`; `TASK-016.md` | Documento imprimible | SVG-print vs PNG embebido: no decidido | ADR-006 | W15-01 | Bloqueada |
| W15-03 | Clipboard de imagen | P1 | `post-mvp-spec.md` FR-P05 | Pegar en otras apps | Permisos; Safari. Exporter hermano de FR-12 | ADR-006 no hace falta si reutiliza `exportDiagram` | TASK-033 | Autorizado en spec |
| W15-04 | Markers Safari | — | `rendering-and-export.md`; TASK-029 | Fidelidad UML | Aceptado. Workaround solo si C-EXPORT | ADR-006 | C-EXPORT | Condicional |

## Fase 16 — Accesibilidad y plataforma

| ID | Capacidad | Pri. | Fuente | Valor / riesgo | Decisiones | ADR | Depende | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W16-01 | Estrategia SR del lienzo | P1 | `mvp-spec.md`; `TASK-017.md`; `TASK-021.md` | Equivalencia semántica del grafo | Modelo de documento paralelo vs RF | Posible `accessibility.md` | TASK-033 | Bloqueada |
| W16-02 | Recorrido teclado del grafo | P2 | igual que W16-01 | Conflicto con nudge de flechas | Mapa de teclas | — | W16-01 | Propuesta |
| W16-03 | Touch / edición móvil | — | `mvp-spec.md`; `post-mvp-spec.md` | Nuevo modo de interacción | Desktop-first se conserva | — | — | Fuera de alcance vigente |
| W16-04 | Temas / dark / inversa | — | `brand-system.md`; `post-mvp-spec.md` | Rompe identidad fija | No se enmienda ni se bifurca la marca | — | — | Fuera de alcance vigente |
| W16-05 | Plantillas y mapa de estilos | — | `domain-model.md`; `post-mvp-spec.md` | Estilos versionados | Van con temas | Bump de schema si existieran; exclusión con temas | W16-04 | Fuera de alcance vigente |

## Fase 17 — Escala y ecosistema

| ID | Capacidad | Pri. | Fuente | Valor / riesgo | Decisiones | ADR | Depende | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W17-01 | Segundo `kind` de diagrama | — | `architecture.md`; `post-mvp-spec.md` | Producto UML genérico | Excluido | — | — | Fuera de alcance vigente |
| W17-02 | Backend / auth / collab | — | `mvp-spec.md`; `post-mvp-spec.md` | SaaS | Excluido | No en dominio | — | Fuera de alcance vigente |
| W17-03 | Remote `DiagramRepository` | — | `architecture.md`; `post-mvp-spec.md` | Sync | Excluido | ADR-004 | W17-02 | Fuera de alcance vigente |
| W17-04 | PWA | — | `mvp-spec.md`; `post-mvp-spec.md` | Offline/install | Excluido | — | — | Fuera de alcance vigente |
| W17-05 | Hosting estático (runbook) | P1 | `post-mvp-spec.md` FR-P06; `TASK-020.md` | Distribución | Sin secrets cloud | — | TASK-033 | Autorizado en spec |
| W17-06 | TypeScript 7 | — | `ADR-001` | Toolchain | typescript-eslint; pin | Reabrir ADR-001 | Peer ESLint | Bloqueada |
| W17-07 | Husky / commitlint / lint-staged | — | `mvp-spec.md`; `ADR-001` | DX, no producto | Excluido | ADR-001 | — | Fuera de alcance vigente |
| W17-08 | Virtualización / Canvas / WebGL | — | `performance.md`; `mvp-spec.md` | Perf | Solo si 100/150 incumple medido | — | C-PERF | Condicional |
| W17-09 | Motor X6 o Konva | — | `ADR-002` | Cambio de proyección | Medición + ADR-002 | ADR-002 | W17-08 | Condicional |
| W17-10 | Analytics | — | `README.md`; `post-mvp-spec.md` | Privacidad | Excluido | Gate de privacidad | W17-02 | Fuera de alcance vigente |
| W17-11 | SEO/SSR / Next.js | — | `mvp-spec.md`; `ADR-001` | Distinto producto | No | — | — | Fuera de alcance vigente |
| W17-12 | Jest, Cypress, Vitest Browser, Tailwind, shadcn, Router | — | `ADR-001`; `ADR-005` | Stack cerrado | No | ADR-001/005 | — | Fuera de alcance vigente |

## Contingencias (no programadas)

| ID | Disparador | Acción | Estado |
| --- | --- | --- | --- |
| C-PERF | Escenario 100/150 incumple p95 o restore en máquina de referencia | Abrir W17-08; si no basta, W17-09 con ADR-002 | Condicional |
| C-QUOTA | JSON habitual se acerca a 1 MiB o localStorage falla por cuota | Reabrir ADR-004; entonces W14-01. Backend no elegido hasta ese gate | Condicional |
| C-EXPORT | Raster 2x irrecuperable o pin html-to-image insostenible | Reabrir ADR-006 antes de W15-01/02 | Condicional |
| C-PRIVACY | Se decide telemetría | Gate de privacidad antes de W17-10 | Fuera de alcance vigente |

## Ambigüedades que siguen abiertas

Cerradas en TASK-031 (ver spec): recorte 1.x vs 2.0; ciclos = warning;
multi-documento = no; segundo tipo de diagrama = exclusión; temas = no
enmendar `brand-system.md`; IndexedDB no elegido (condicional).

Cerradas en TASK-032
([`schema-evolution.md`](../../architecture/schema-evolution.md)): bump
vs chrome; rechazo de desconocidos; cuota; envelope
`arkuml-usecase-json`; ADRs a reabrir. IndexedDB sigue condicional.
`migrate()` no se implementa hasta un bump.

Siguen siendo stop conditions, no copy de implementación:

- Generalization: actores, casos o ambos (hace falta fuente UML).
- Forma persistida de waypoints, estilos y extension points: bump de
  schema; sigue stop por decisión de producto/UML, no por falta de
  política de migración.
- PDF: SVG-print vs PNG embebido.
- Notas: elemento vs overlay.
- Actores no humanos: `kind` vs estereotipo.

## Relación con el registro

Los grupos O-01–O-10 de [risk-register.md](risk-register.md) están
dispuestos en `post-mvp-spec.md`. TASK-033 solo puede crear archivos TASK
para filas `Autorizado en spec` cuyas decisiones estén cerradas; el resto
permanece catálogo.
