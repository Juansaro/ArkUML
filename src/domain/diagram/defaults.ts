import type { Geometry, Viewport } from "./model.ts";

export const SCHEMA_VERSION_V1 = 1;
export const SCHEMA_VERSION_V2 = 2;
export const SCHEMA_VERSION = 3;
export const STORAGE_VERSION_V1 = 1;
export const STORAGE_VERSION = 2;
export const DOCUMENT_KIND = "use-case";
export const SEQUENCE_DOCUMENT_KIND = "sequence";
export const CLASS_DOCUMENT_KIND = "class";
export const COMPONENT_DOCUMENT_KIND = "component";
export const DEPLOYMENT_DOCUMENT_KIND = "deployment";
export const ER_DOCUMENT_KIND = "entity-relationship";
export const ACTIVITY_DOCUMENT_KIND = "activity";

export const DEFAULT_DOCUMENT_TITLE = "Diagrama de casos de uso";
export const DEFAULT_SEQUENCE_DOCUMENT_TITLE = "Diagrama de secuencia";
export const DEFAULT_CLASS_DOCUMENT_TITLE = "Diagrama de clases";
export const DEFAULT_COMPONENT_DOCUMENT_TITLE = "Diagrama de componentes";
export const DEFAULT_DEPLOYMENT_DOCUMENT_TITLE = "Diagrama de despliegue";
export const DEFAULT_ER_DOCUMENT_TITLE = "Diagrama entidad-relación";
export const DEFAULT_ACTIVITY_DOCUMENT_TITLE = "Diagrama de actividades";
export const DEFAULT_BOUNDARY_NAME = "Sistema";
export const DEFAULT_LIFELINE_NAME = "Lifeline";
export const DEFAULT_ASSOCIATION_MULTIPLICITY = "1";
export const DEFAULT_ER_CARDINALITY = "N";

export const NAME_MIN_LENGTH = 1;
export const NAME_MAX_LENGTH = 80;

export const MIN_BOUNDARY_WIDTH = 320;
export const MIN_BOUNDARY_HEIGHT = 240;
export const DUPLICATE_OFFSET = 24;

export const DEFAULT_LIFELINE_WIDTH = 120;
export const DEFAULT_LIFELINE_HEIGHT = 40;
export const MIN_LIFELINE_WIDTH = 80;
export const MIN_LIFELINE_HEIGHT = 32;
export const DEFAULT_LIFELINE_STEM_LENGTH = 280;
export const MIN_LIFELINE_STEM_LENGTH = 80;

export const DEFAULT_CLASS_WIDTH = 180;
export const DEFAULT_CLASS_HEIGHT = 96;
export const MIN_CLASS_WIDTH = 120;
export const MIN_CLASS_HEIGHT = 72;

export const DEFAULT_COMPONENT_WIDTH = 200;
export const DEFAULT_COMPONENT_HEIGHT = 120;
export const MIN_COMPONENT_WIDTH = 120;
export const MIN_COMPONENT_HEIGHT = 72;

export const DEFAULT_NODE_WIDTH = 200;
export const DEFAULT_NODE_HEIGHT = 120;
export const MIN_NODE_WIDTH = 120;
export const MIN_NODE_HEIGHT = 72;

export const DEFAULT_ARTIFACT_WIDTH = 140;
export const DEFAULT_ARTIFACT_HEIGHT = 80;
export const MIN_ARTIFACT_WIDTH = 96;
export const MIN_ARTIFACT_HEIGHT = 48;

export const DEFAULT_ENTITY_WIDTH = 160;
export const DEFAULT_ENTITY_HEIGHT = 80;
export const MIN_ENTITY_WIDTH = 96;
export const MIN_ENTITY_HEIGHT = 48;

export const DEFAULT_ATTRIBUTE_WIDTH = 120;
export const DEFAULT_ATTRIBUTE_HEIGHT = 56;
export const MIN_ATTRIBUTE_WIDTH = 80;
export const MIN_ATTRIBUTE_HEIGHT = 40;

export const DEFAULT_ER_RELATIONSHIP_WIDTH = 120;
export const DEFAULT_ER_RELATIONSHIP_HEIGHT = 80;
export const MIN_ER_RELATIONSHIP_WIDTH = 80;
export const MIN_ER_RELATIONSHIP_HEIGHT = 48;

export const DEFAULT_ACTION_WIDTH = 160;
export const DEFAULT_ACTION_HEIGHT = 64;
export const MIN_ACTION_WIDTH = 96;
export const MIN_ACTION_HEIGHT = 40;

export const DEFAULT_INITIAL_NODE_WIDTH = 24;
export const DEFAULT_INITIAL_NODE_HEIGHT = 24;
export const MIN_INITIAL_NODE_WIDTH = 16;
export const MIN_INITIAL_NODE_HEIGHT = 16;

export const DEFAULT_ACTIVITY_FINAL_WIDTH = 28;
export const DEFAULT_ACTIVITY_FINAL_HEIGHT = 28;
export const MIN_ACTIVITY_FINAL_WIDTH = 20;
export const MIN_ACTIVITY_FINAL_HEIGHT = 20;

export const DEFAULT_DECISION_NODE_WIDTH = 48;
export const DEFAULT_DECISION_NODE_HEIGHT = 48;
export const MIN_DECISION_NODE_WIDTH = 32;
export const MIN_DECISION_NODE_HEIGHT = 32;

export const DEFAULT_FORK_NODE_WIDTH = 80;
export const DEFAULT_FORK_NODE_HEIGHT = 8;
export const MIN_FORK_NODE_WIDTH = 48;
export const MIN_FORK_NODE_HEIGHT = 6;

export const DEFAULT_BOUNDARY_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: 640,
  height: 400,
};

export const DEFAULT_LIFELINE_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: DEFAULT_LIFELINE_WIDTH,
  height: DEFAULT_LIFELINE_HEIGHT,
};

export const DEFAULT_CLASS_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: DEFAULT_CLASS_WIDTH,
  height: DEFAULT_CLASS_HEIGHT,
};

export const DEFAULT_COMPONENT_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: DEFAULT_COMPONENT_WIDTH,
  height: DEFAULT_COMPONENT_HEIGHT,
};

export const DEFAULT_NODE_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: DEFAULT_NODE_WIDTH,
  height: DEFAULT_NODE_HEIGHT,
};

export const DEFAULT_ARTIFACT_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: DEFAULT_ARTIFACT_WIDTH,
  height: DEFAULT_ARTIFACT_HEIGHT,
};

export const DEFAULT_ENTITY_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: DEFAULT_ENTITY_WIDTH,
  height: DEFAULT_ENTITY_HEIGHT,
};

export const DEFAULT_ATTRIBUTE_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: DEFAULT_ATTRIBUTE_WIDTH,
  height: DEFAULT_ATTRIBUTE_HEIGHT,
};

export const DEFAULT_ER_RELATIONSHIP_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: DEFAULT_ER_RELATIONSHIP_WIDTH,
  height: DEFAULT_ER_RELATIONSHIP_HEIGHT,
};

export const DEFAULT_ACTION_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: DEFAULT_ACTION_WIDTH,
  height: DEFAULT_ACTION_HEIGHT,
};

export const DEFAULT_INITIAL_NODE_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: DEFAULT_INITIAL_NODE_WIDTH,
  height: DEFAULT_INITIAL_NODE_HEIGHT,
};

export const DEFAULT_ACTIVITY_FINAL_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: DEFAULT_ACTIVITY_FINAL_WIDTH,
  height: DEFAULT_ACTIVITY_FINAL_HEIGHT,
};

export const DEFAULT_DECISION_NODE_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: DEFAULT_DECISION_NODE_WIDTH,
  height: DEFAULT_DECISION_NODE_HEIGHT,
};

export const DEFAULT_FORK_NODE_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: DEFAULT_FORK_NODE_WIDTH,
  height: DEFAULT_FORK_NODE_HEIGHT,
};

export const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};
