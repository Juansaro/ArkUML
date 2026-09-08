import { InertButton } from "./InertButton.tsx";
import {
  BOUNDARY_EXISTS_REASON,
  PALETTE_ELEMENT_TOOLS,
  PALETTE_RELATIONSHIP_TOOLS,
} from "./paletteTools.ts";
import { selectHasSystemBoundary, selectTool } from "../../store/selectors.ts";
import {
  useEditorStore,
  useEditorStoreApi,
} from "../../store/EditorStoreProvider.tsx";
import type { EditorTool } from "../../store/editorStore.ts";
import styles from "./Palette.module.css";

type PaletteProps = {
  headingId: string;
};

export function Palette({ headingId }: PaletteProps) {
  const store = useEditorStoreApi();
  const tool = useEditorStore(selectTool);
  const hasBoundary = useEditorStore(selectHasSystemBoundary);

  function selectElementTool(next: EditorTool) {
    store.getState().setTool(tool === next ? "select" : next);
  }

  return (
    <div className={styles.body}>
      <h2 id={headingId} className={styles.heading}>
        Paleta
      </h2>
      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Elementos</h3>
        <ul className={styles.list}>
          {PALETTE_ELEMENT_TOOLS.map((item) => (
            <li key={item.id}>
              {item.id === "system-boundary" && hasBoundary ? (
                <InertButton reason={BOUNDARY_EXISTS_REASON}>
                  {item.label}
                </InertButton>
              ) : (
                <button
                  type="button"
                  aria-pressed={tool === item.id}
                  onClick={() => {
                    selectElementTool(item.id);
                  }}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Relaciones</h3>
        <ul className={styles.list}>
          {PALETTE_RELATIONSHIP_TOOLS.map((item) => (
            <li key={item.id}>
              {"reason" in item ? (
                <InertButton reason={item.reason}>{item.label}</InertButton>
              ) : (
                <button
                  type="button"
                  aria-pressed={tool === item.id}
                  onClick={() => {
                    selectElementTool(item.id);
                  }}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
