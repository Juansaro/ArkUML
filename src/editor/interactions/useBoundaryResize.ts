import { useCallback } from "react";
import type { OnResize, OnResizeEnd, OnResizeStart } from "@xyflow/react";
import { useEditorStoreApi } from "../store/EditorStoreProvider.tsx";
import {
  startBoundaryResize,
  stopBoundaryResize,
  updateBoundaryResize,
} from "./boundaryResize.ts";

export function useBoundaryResize(id: string) {
  const store = useEditorStoreApi();

  const onResizeStart = useCallback<OnResizeStart>(() => {
    startBoundaryResize(store);
  }, [store]);

  const onResize = useCallback<OnResize>(
    (_event, params) => {
      updateBoundaryResize(store, id, params);
    },
    [id, store],
  );

  const onResizeEnd = useCallback<OnResizeEnd>(
    (_event, params) => {
      stopBoundaryResize(store, id, params);
    },
    [id, store],
  );

  return { onResizeStart, onResize, onResizeEnd };
}
