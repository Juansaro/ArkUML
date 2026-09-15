import type { Geometry, Viewport } from "./model.ts";

export const SCHEMA_VERSION_V1 = 1;
export const SCHEMA_VERSION = 2;
export const STORAGE_VERSION_V1 = 1;
export const STORAGE_VERSION = 2;
export const DOCUMENT_KIND = "use-case";
export const SEQUENCE_DOCUMENT_KIND = "sequence";

export const DEFAULT_DOCUMENT_TITLE = "Diagrama de casos de uso";
export const DEFAULT_SEQUENCE_DOCUMENT_TITLE = "Diagrama de secuencia";
export const DEFAULT_BOUNDARY_NAME = "Sistema";
export const DEFAULT_LIFELINE_NAME = "Lifeline";

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

export const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};
