import type { Geometry } from "../../domain/diagram/model.ts";
import type { EditorStoreApi } from "../store/editorStore.ts";

export type BoundaryResizeParams = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const resizingStores = new WeakSet<EditorStoreApi>();

export function isBoundaryResizing(store: EditorStoreApi): boolean {
  return resizingStores.has(store);
}

export function startBoundaryResize(store: EditorStoreApi): void {
  if (resizingStores.has(store)) {
    return;
  }
  resizingStores.add(store);
  store.getState().endRename();
  store.getState().beginTransaction();
}

export function updateBoundaryResize(
  store: EditorStoreApi,
  id: string,
  params: BoundaryResizeParams,
): void {
  const element = store
    .getState()
    .document.elements.find((candidate) => candidate.id === id);
  if (element === undefined || element.kind !== "system-boundary") {
    return;
  }
  if (sameGeometry(element.geometry, params)) {
    return;
  }
  store.getState().commitResize({
    id,
    geometry: copyGeometry(params),
  });
}

export function stopBoundaryResize(
  store: EditorStoreApi,
  id: string,
  params: BoundaryResizeParams,
): void {
  updateBoundaryResize(store, id, params);
  store.getState().commitTransaction();
  resizingStores.delete(store);
}

function sameGeometry(
  geometry: Geometry,
  params: BoundaryResizeParams,
): boolean {
  return (
    geometry.x === params.x &&
    geometry.y === params.y &&
    geometry.width === params.width &&
    geometry.height === params.height
  );
}

function copyGeometry(params: BoundaryResizeParams): Geometry {
  return {
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height,
  };
}
