import { InertButton } from "./InertButton.tsx";
import { ToolButton } from "../common/ToolButton.tsx";
import type { IconName } from "../common/icons.tsx";
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

const PALETTE_ICONS: Record<
  | (typeof PALETTE_ELEMENT_TOOLS)[number]["id"]
  | (typeof PALETTE_RELATIONSHIP_TOOLS)[number]["id"],
  IconName
> = {
  actor: "actor",
  "use-case": "useCase",
  "system-boundary": "systemBoundary",
  association: "association",
  include: "include",
  extend: "extend",
};

const PALETTE_DESCRIPTIONS: Record<
  | (typeof PALETTE_ELEMENT_TOOLS)[number]["id"]
  | (typeof PALETTE_RELATIONSHIP_TOOLS)[number]["id"],
  string
> = {
  actor: "Crear actor.",
  "use-case": "Crear caso de uso.",
  "system-boundary": "Crear límite del sistema.",
  association: "Unir un actor y un caso de uso.",
  include:
    "Origen: caso que incluye. Destino: caso incluido. Arrastra del origen al destino; el sentido no se invierte.",
  extend:
    "Origen: caso que extiende. Destino: caso base. Arrastra del origen al destino; el sentido no se invierte.",
};

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
                <InertButton
                  icon={PALETTE_ICONS[item.id]}
                  reason={BOUNDARY_EXISTS_REASON}
                >
                  {item.label}
                </InertButton>
              ) : (
                <ToolButton
                  variant="row"
                  icon={PALETTE_ICONS[item.id]}
                  label={item.label}
                  description={PALETTE_DESCRIPTIONS[item.id]}
                  placement="right"
                  pressed={tool === item.id}
                  onClick={() => {
                    selectElementTool(item.id);
                  }}
                />
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
              <ToolButton
                variant="row"
                icon={PALETTE_ICONS[item.id]}
                label={item.label}
                description={
                  "hint" in item ? item.hint : PALETTE_DESCRIPTIONS[item.id]
                }
                placement="right"
                pressed={tool === item.id}
                onClick={() => {
                  selectElementTool(item.id);
                }}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
