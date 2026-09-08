import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import {
  clientToFlowPosition,
  isCreateElementTool,
  placeElement,
} from "./createElementTool.ts";
import { selectTool } from "../store/selectors.ts";
import {
  useEditorStore,
  useEditorStoreApi,
} from "../store/EditorStoreProvider.tsx";

type PlaceEvent = {
  clientX: number;
  clientY: number;
};

export function useCreateElementTool() {
  const store = useEditorStoreApi();
  const tool = useEditorStore(selectTool);
  const canvasRef = useRef<HTMLDivElement>(null);
  const placingRef = useRef(false);
  const placing = isCreateElementTool(tool);

  const placeAtEvent = useCallback(
    (event: PlaceEvent) => {
      const currentTool = store.getState().tool;
      if (!isCreateElementTool(currentTool)) {
        return;
      }

      const pane = canvasRef.current?.querySelector(".react-flow");
      if (!(pane instanceof HTMLElement)) {
        return;
      }

      const position = clientToFlowPosition(
        { x: event.clientX, y: event.clientY },
        pane.getBoundingClientRect(),
        store.getState().viewport,
      );

      placingRef.current = true;
      placeElement(store, currentTool, position);
      window.setTimeout(() => {
        placingRef.current = false;
      }, 0);
    },
    [store],
  );

  const onPaneClick = useCallback(
    (event: MouseEvent) => {
      if (!isCreateElementTool(store.getState().tool)) {
        return;
      }
      placeAtEvent(event);
    },
    [placeAtEvent, store],
  );

  const onNodeClick = useCallback(
    (event: MouseEvent) => {
      if (!isCreateElementTool(store.getState().tool)) {
        return;
      }
      placeAtEvent(event);
    },
    [placeAtEvent, store],
  );

  const shouldIgnoreSelectionChange = useCallback((): boolean => {
    return placingRef.current || isCreateElementTool(store.getState().tool);
  }, [store]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (!isCreateElementTool(store.getState().tool)) {
        return;
      }
      store.getState().setTool("select");
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [store]);

  return {
    canvasRef,
    placing,
    onPaneClick,
    onNodeClick,
    shouldIgnoreSelectionChange,
  };
}
