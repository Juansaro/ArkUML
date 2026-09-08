import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand/react";
import {
  createEditorStore,
  type EditorStore,
  type EditorStoreApi,
} from "./editorStore.ts";

const EditorStoreContext = createContext<EditorStoreApi | undefined>(undefined);

type EditorStoreProviderProps = {
  children: ReactNode;
  store?: EditorStoreApi;
};

export function EditorStoreProvider({
  children,
  store,
}: EditorStoreProviderProps) {
  const [storeApi] = useState(() => store ?? createEditorStore());
  return (
    <EditorStoreContext.Provider value={storeApi}>
      {children}
    </EditorStoreContext.Provider>
  );
}

export function useOptionalEditorStoreApi(): EditorStoreApi | undefined {
  return useContext(EditorStoreContext);
}

export function useEditorStoreApi(): EditorStoreApi {
  const store = useOptionalEditorStoreApi();
  if (store === undefined) {
    throw new Error("useEditorStoreApi requiere EditorStoreProvider");
  }
  return store;
}

export function useEditorStore<T>(selector: (state: EditorStore) => T): T {
  const store = useEditorStoreApi();
  return useStore(store, selector);
}
