import type { Geometry, Viewport } from "./model.ts";

export const SCHEMA_VERSION = 1;
export const STORAGE_VERSION = 1;
export const DOCUMENT_KIND = "use-case";

export const DEFAULT_DOCUMENT_TITLE = "Diagrama de casos de uso";
export const DEFAULT_BOUNDARY_NAME = "Sistema";

export const NAME_MIN_LENGTH = 1;
export const NAME_MAX_LENGTH = 80;

export const MIN_BOUNDARY_WIDTH = 320;
export const MIN_BOUNDARY_HEIGHT = 240;
export const DUPLICATE_OFFSET = 24;

export const DEFAULT_BOUNDARY_GEOMETRY: Geometry = {
  x: 0,
  y: 0,
  width: 640,
  height: 400,
};

export const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};
