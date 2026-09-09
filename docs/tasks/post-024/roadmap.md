# Roadmap Post-MVP (catálogo, no autorización)

Inventario exhaustivo de lo que el MVP declara fuera de alcance. Una entrada
**no** es una TASK. TASK-031 decide prioridades; TASK-032 decide schema;
TASK-033 es el único que puede promover entradas maduras a `TASK-034+`.

## Estados de catálogo

| Estado | Significado |
| --- | --- |
| Propuesta | Trazada; decisiones abiertas. |
| Bloqueada | Espera un gate, ADR o decisión humana. |
| Condicional | Solo se abre si hay evidencia medida (perf, cuota, privacidad). |
| Fuera de alcance vigente | Exclusión deliberada del producto actual. |

Promover una entrada exige: fuente canónica, decisiones cerradas, ADR
identificado o nuevo, dependencias y criterio de aceptación. Si falta
cualquiera, el implementador se detiene; no inventa UML, persistencia ni
export.

## Fase 12 — Semántica UML

| ID | Capacidad | Fuente | Valor / riesgo | Decisiones | ADR | Depende | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| W12-01 | Detección de ciclos Include/Extend | `mvp-spec.md:98`; `TASK-022.md:32-35` | Consistencia semántica; puede rechazar diagramas válidos hoy | ¿Aviso o bloqueo? ¿Qué se anuncia? | Posible addendum de dominio | TASK-033 | Propuesta |
| W12-02 | Generalization | `mvp-spec.md:66-70,196-197`; `domain-model.md:113` | Relación nueva, no un flag | ¿Actores, casos o ambos? Matriz `canConnect` | Schema (TASK-032) | TASK-033 | Propuesta |
| W12-03 | Extension points y condiciones de extend | `mvp-spec.md:66-70`; `TASK-014.md` | Semántica UML más rica | Forma persistida; copy de UI | Schema (TASK-032) | W12-02 | Propuesta |
| W12-04 | Notas | `mvp-spec.md:66-70` | Comentario visual | ¿Elemento o overlay? Relación con export | Schema (TASK-032) | TASK-033 | Propuesta |
| W12-05 | Paquetes | `mvp-spec.md:66-70` | Agrupación | Relación con boundary único del MVP | Schema (TASK-032) | TASK-033 | Propuesta |
| W12-06 | Multiplicidad | `mvp-spec.md:66-70` | Anotación de extremos | Dónde se persiste; a11y | Schema (TASK-032) | TASK-033 | Propuesta |
| W12-07 | Actores no humanos especializados | `mvp-spec.md:66-70` | Variante visual/semántica | ¿Nuevo `kind` o estereotipo? | Schema (TASK-032) | TASK-033 | Propuesta |

## Fase 13 — Potencia del editor

| ID | Capacidad | Fuente | Valor / riesgo | Decisiones | ADR | Depende | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| W13-01 | Waypoints / routing en el documento | `mvp-spec.md:50`; `TASK-013.md` | Control de trazado | Geometría persistida vs proyección RF | TASK-032; posible addendum ADR-002 | TASK-033 | Bloqueada |
| W13-02 | Alignment guides | `mvp-spec.md:50` | Precisión de layout | ¿Solo chrome o persistido? | — | TASK-033 | Propuesta |
| W13-03 | Minimap | `mvp-spec.md:50`; `TASK-009.md` | Navegación en diagramas grandes | Perf; exclusión de export | — | TASK-033 | Propuesta |
| W13-04 | Auto-layout | `mvp-spec.md:50,189` | Colocación automática | Algoritmo y dependencia (stop si hay paquete nuevo) | ADR-001/002 | TASK-033 | Bloqueada |

## Fase 14 — Persistencia y documentos

| ID | Capacidad | Fuente | Valor / riesgo | Decisiones | ADR | Depende | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| W14-01 | IndexedDB `DiagramRepository` | `ADR-004-persistence.md:37`; `mvp-spec.md:200` | Cuota ~5 MiB; umbral ~1 MiB habitual | Cuándo migrar; fallback | Reabrir ADR-004 | TASK-032; TASK-029 evidencia | Bloqueada |
| W14-02 | Multi-documento | `mvp-spec.md:200`; `TASK-015.md` | Varios diagramas locales | UX de lista/switch; un workspace vs N | ADR-004 | W14-01 | Bloqueada |
| W14-03 | Import/export JSON de usuario | `mvp-spec.md:194` | Intercambio de archivos | Schema público; no mezclar con persistencia interna | ADR-004 | TASK-032 | Propuesta |
| W14-04 | `migrate()` real | `domain-model.md:104` | Evolución sin pérdida | Política bump `schemaVersion`/`storageVersion` | TASK-032 | TASK-032 | Bloqueada |
| W14-05 | Sync multi-tab | `ADR-004-persistence.md:25-39` | Hoy last-write-wins | ¿BroadcastChannel, lock, o aceptar? | ADR-004 | TASK-031 | Fuera de alcance vigente |

## Fase 15 — Exportación

| ID | Capacidad | Fuente | Valor / riesgo | Decisiones | ADR | Depende | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| W15-01 | SVG persistido / export SVG | `mvp-spec.md:194`; `ADR-006-export.md` | Vectorial; no es el PNG actual | Formato y atribución RF | Reabrir ADR-006 | TASK-030 | Bloqueada |
| W15-02 | PDF | `mvp-spec.md:194`; `TASK-016.md` | Documento imprimible | SVG-print vs PNG embebido | ADR-006 | W15-01 o decisión en TASK-031 | Bloqueada |
| W15-03 | Clipboard de imagen | `mvp-spec.md:194` | Pegar en otras apps | Permisos; Safari | ADR-006 | TASK-030 | Propuesta |
| W15-04 | Markers Safari | `rendering-and-export.md:55-67` | Fidelidad UML | Aceptar, workaround o otro rasterizer | ADR-006 | TASK-029 | Condicional |

## Fase 16 — Accesibilidad y plataforma

| ID | Capacidad | Fuente | Valor / riesgo | Decisiones | ADR | Depende | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| W16-01 | Estrategia SR del lienzo | `mvp-spec.md:171-181`; `TASK-017.md`; `TASK-021.md` | Equivalencia semántica del grafo | Modelo de documento paralelo vs RF | Posible `accessibility.md` | TASK-030 | Bloqueada |
| W16-02 | Recorrido teclado del grafo | igual que W16-01 | Conflicto con nudge de flechas | Mapa de teclas | — | W16-01 | Propuesta |
| W16-03 | Touch / edición móvil | `mvp-spec.md:52,202`; `TASK-017.md` | Nuevo modo de interacción | Alcance de gestos; drawers | — | TASK-030 | Bloqueada |
| W16-04 | Temas / dark / inversa | `mvp-spec.md:51`; `brand-system.md:61-62,444-450` | Rompe identidad fija | ¿Enmendar brand-system o fork? | Brand + posible ADR | TASK-030 | Bloqueada |
| W16-05 | Plantillas y mapa de estilos | `domain-model.md:114`; `mvp-spec.md:51` | Estilos versionados, no motor gráfico | Schema opcional | TASK-032 | TASK-032; W16-04 | Propuesta |

## Fase 17 — Escala y ecosistema

| ID | Capacidad | Fuente | Valor / riesgo | Decisiones | ADR | Depende | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| W17-01 | Segundo `kind` de diagrama | `architecture.md`; `domain-model.md:112` | Producto UML genérico | Identidad del segundo tipo; plugin solo tras 2 impls | TASK-032 | TASK-031 | Bloqueada |
| W17-02 | Backend / auth / collab | `mvp-spec.md:198-199`; `architecture.md` | SaaS | Producto, amenaza, datos | No en dominio | TASK-031 | Fuera de alcance vigente |
| W17-03 | Remote `DiagramRepository` | `architecture.md` | Sync | Contrato repo; no contaminar domain | ADR-004 | W17-02 | Fuera de alcance vigente |
| W17-04 | PWA | `mvp-spec.md:200` | Offline/install | Alcance vs SPA estática | — | TASK-030 | Fuera de alcance vigente |
| W17-05 | Hosting estático (runbook) | `TASK-020.md` | Distribución | Sin secrets cloud | — | TASK-026 | Propuesta |
| W17-06 | TypeScript 7 | `ADR-001-frontend-stack.md:49` | Toolchain | typescript-eslint; pin | Reabrir ADR-001 | — | Bloqueada |
| W17-07 | Husky / commitlint / lint-staged | `mvp-spec.md:203`; `ADR-001` | DX, no producto | Decisión explícita | ADR-001 | TASK-030 | Fuera de alcance vigente |
| W17-08 | Virtualización / Canvas / WebGL | `performance.md:50-52`; `mvp-spec.md:189` | Perf | Solo si 100/150 incumple medido | — | Evidencia TASK-029 | Condicional |
| W17-09 | Motor X6 o Konva | `ADR-002-diagram-engine.md:28-45` | Cambio de proyección | Medición + ADR-002 | ADR-002 | W17-08 | Condicional |
| W17-10 | Analytics | `README.md` fuera de alcance | Privacidad | Consentimiento, sin PII | Gate de privacidad | W17-02 | Fuera de alcance vigente |
| W17-11 | SEO/SSR / Next.js | `mvp-spec.md:200`; `ADR-001` | Distinto producto | No | — | — | Fuera de alcance vigente |
| W17-12 | Jest, Cypress, Vitest Browser, Tailwind, shadcn, Router | `ADR-001`; `ADR-005` | Stack cerrado | No | ADR-001/005 | — | Fuera de alcance vigente |

## Contingencias (no programadas)

| ID | Disparador | Acción |
| --- | --- | --- |
| C-PERF | Escenario 100/150 incumple p95 o restore en máquina de referencia | Abrir W17-08; si no basta, W17-09 con ADR-002 |
| C-QUOTA | JSON habitual se acerca a 1 MiB o localStorage falla por cuota | Adelantar W14-01 |
| C-EXPORT | Raster 2x irrecuperable o pin html-to-image insostenible | Reabrir ADR-006 antes de W15-\* |
| C-PRIVACY | Se decide telemetría | Gate de privacidad antes de W17-10 |

## Ambigüedades que no se resuelven aquí

Hasta TASK-031/032 siguen siendo stop conditions, no copy de implementación:

- Recorte v1.1 vs posterior.
- Ciclos: aviso vs bloqueo.
- Generalization: actores, casos o ambos.
- Forma persistida de waypoints, estilos y extension points.
- PDF: SVG vs PNG embebido.
- Modelo UX multi-documento.
- Identidad del segundo tipo de diagrama.
- Temas: enmendar o bifurcar `brand-system.md`.

## Relación con el registro

Los grupos O-01–O-10 de [risk-register.md](risk-register.md) se desglosan en
esta tabla. TASK-033 solo puede crear archivos TASK para filas cuyo estado
pase a `Lista` tras cerrar decisiones; el resto permanece catálogo.
