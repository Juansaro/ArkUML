import {
  DOCUMENT_KIND,
  SCHEMA_VERSION,
  STORAGE_VERSION,
} from "../domain/diagram/defaults.ts";
import type {
  Actor,
  DiagramDocument,
  Relationship,
  SystemBoundary,
  UseCase,
  WorkspaceSnapshot,
} from "../domain/diagram/model.ts";

export const PERFORMANCE_SCENARIOS = ["target", "stress"] as const;

export type PerformanceScenario = (typeof PERFORMANCE_SCENARIOS)[number];

export type PerformanceCounts = {
  elements: number;
  relationships: number;
  actors: number;
  useCases: number;
};

const ACTOR_SIZE = { width: 72, height: 112 } as const;
const USE_CASE_SIZE = { width: 160, height: 80 } as const;
const GRID_GAP = 16;
const CREATED_AT = "2026-09-08T00:00:00.000Z";

const SCENARIO_SHAPE = {
  target: {
    actors: 30,
    useCases: 69,
    associationsPerActor: 3,
    includes: 30,
    extends: 30,
  },
  stress: {
    actors: 50,
    useCases: 149,
    associationsPerActor: 4,
    includes: 50,
    extends: 50,
  },
} as const;

export function performanceCounts(
  scenario: PerformanceScenario,
): PerformanceCounts {
  const shape = SCENARIO_SHAPE[scenario];
  return {
    actors: shape.actors,
    useCases: shape.useCases,
    elements: 1 + shape.actors + shape.useCases,
    relationships:
      shape.actors * shape.associationsPerActor +
      shape.includes +
      shape.extends,
  };
}

export function createPerformanceSnapshot(
  scenario: PerformanceScenario,
): WorkspaceSnapshot {
  return {
    storageVersion: STORAGE_VERSION,
    document: createPerformanceDocument(scenario),
    view: { x: 220, y: 40, zoom: 0.5 },
  };
}

export function createPerformanceDocument(
  scenario: PerformanceScenario,
): DiagramDocument {
  const shape = SCENARIO_SHAPE[scenario];
  const columns = scenario === "target" ? 8 : 12;
  const boundary = createBoundary(shape.useCases, columns);
  const actors = Array.from({ length: shape.actors }, (_, index) =>
    createActorElement(index),
  );
  const useCases = Array.from({ length: shape.useCases }, (_, index) =>
    createUseCaseElement(index, boundary.id, columns),
  );
  const relationships = createRelationships(
    actors,
    useCases,
    shape.associationsPerActor,
    shape.includes,
    shape.extends,
  );

  return {
    schemaVersion: SCHEMA_VERSION,
    id: fixtureId(0),
    kind: DOCUMENT_KIND,
    metadata: {
      title:
        scenario === "target" ? "Rendimiento 100/150" : "Rendimiento 200/300",
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    },
    elements: [boundary, ...actors, ...useCases],
    relationships,
  };
}

function createBoundary(useCaseCount: number, columns: number): SystemBoundary {
  const rows = Math.ceil(useCaseCount / columns);
  return {
    id: fixtureId(1),
    kind: "system-boundary",
    name: "Sistema",
    geometry: {
      x: 0,
      y: 0,
      width:
        GRID_GAP * 2 + columns * USE_CASE_SIZE.width + (columns - 1) * GRID_GAP,
      height:
        48 + rows * USE_CASE_SIZE.height + Math.max(0, rows - 1) * GRID_GAP,
    },
  };
}

function createActorElement(index: number): Actor {
  const row = Math.floor(index / 2);
  const column = index % 2;
  return {
    id: fixtureId(2 + index),
    kind: "actor",
    name: `Actor ${index + 1}`,
    geometry: {
      x: -240 + column * 120,
      y: row * 128,
      width: ACTOR_SIZE.width,
      height: ACTOR_SIZE.height,
    },
  };
}

function createUseCaseElement(
  index: number,
  parentId: string,
  columns: number,
): UseCase {
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    id: fixtureId(1000 + index),
    kind: "use-case",
    name: `Caso ${index + 1}`,
    parentId,
    geometry: {
      x: GRID_GAP + column * (USE_CASE_SIZE.width + GRID_GAP),
      y: 48 + row * (USE_CASE_SIZE.height + GRID_GAP),
      width: USE_CASE_SIZE.width,
      height: USE_CASE_SIZE.height,
    },
  };
}

function createRelationships(
  actors: readonly Actor[],
  useCases: readonly UseCase[],
  associationsPerActor: number,
  includeCount: number,
  extendCount: number,
): Relationship[] {
  const relationships: Relationship[] = [];
  let nextId = 2000;

  for (const [actorIndex, actor] of actors.entries()) {
    for (let offset = 0; offset < associationsPerActor; offset += 1) {
      const useCase = useCases[(actorIndex + offset) % useCases.length];
      if (useCase === undefined) {
        continue;
      }
      relationships.push({
        id: fixtureId(nextId),
        kind: "association",
        sourceId: actor.id,
        targetId: useCase.id,
        sourceAnchor: "right",
        targetAnchor: "left",
      });
      nextId += 1;
    }
  }

  for (let index = 0; index < includeCount; index += 1) {
    const source = useCases[index];
    const target = useCases[(index + 1) % useCases.length];
    if (source === undefined || target === undefined) {
      continue;
    }
    relationships.push({
      id: fixtureId(nextId),
      kind: "include",
      sourceId: source.id,
      targetId: target.id,
      sourceAnchor: "bottom",
      targetAnchor: "top",
    });
    nextId += 1;
  }

  for (let index = 0; index < extendCount; index += 1) {
    const source = useCases[index];
    const target = useCases[(index + 2) % useCases.length];
    if (source === undefined || target === undefined) {
      continue;
    }
    relationships.push({
      id: fixtureId(nextId),
      kind: "extend",
      sourceId: source.id,
      targetId: target.id,
      sourceAnchor: "left",
      targetAnchor: "right",
    });
    nextId += 1;
  }

  return relationships;
}

function fixtureId(index: number): string {
  return `aaaaaaaa-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;
}
