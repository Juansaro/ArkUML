import { InertButton } from "./InertButton.tsx";
import { ToolButton } from "../common/ToolButton.tsx";
import type { IconName } from "../common/icons.tsx";
import {
  BOUNDARY_EXISTS_REASON,
  PALETTE_SELECT_TOOL,
  paletteElementTools,
  paletteRelationshipTools,
} from "./paletteTools.ts";
import {
  selectDocumentKind,
  selectHasSystemBoundary,
  selectTool,
} from "../../store/selectors.ts";
import {
  useEditorStore,
  useEditorStoreApi,
} from "../../store/EditorStoreProvider.tsx";
import type { EditorTool } from "../../store/editorStore.ts";
import styles from "./Palette.module.css";

const PALETTE_ICONS: Record<string, IconName> = {
  select: "select",
  actor: "actor",
  "use-case": "useCase",
  "system-boundary": "systemBoundary",
  association: "association",
  include: "include",
  extend: "extend",
  lifeline: "lifeline",
  "sync-message": "syncMessage",
  "reply-message": "replyMessage",
  class: "class",
  "class-association": "classAssociation",
  aggregation: "aggregation",
  composition: "composition",
  generalization: "generalization",
};

const PALETTE_DESCRIPTIONS: Record<string, string> = {
  select:
    "Seleccionar elementos y relaciones. Copiar, pegar o eliminar lo seleccionado.",
  actor: "Crear actor.",
  "use-case": "Crear caso de uso.",
  "system-boundary": "Crear límite del sistema.",
  association: "Unir un actor y un caso de uso.",
  include:
    "Origen: caso que incluye. Destino: caso incluido. Arrastra del origen al destino; el sentido no se invierte.",
  extend:
    "Origen: caso que extiende. Destino: caso base. Arrastra del origen al destino; el sentido no se invierte.",
  lifeline: "Crear línea de vida.",
  "sync-message": "Mensaje síncrono (llamada).",
  "reply-message": "Mensaje de respuesta.",
  class: "Crear clase.",
  "class-association": "Unir dos clases.",
  aggregation:
    "Origen: todo (diamante vacío). Destino: parte. Arrastra del origen al destino.",
  composition:
    "Origen: compuesto (diamante relleno). Destino: parte. Arrastra del origen al destino.",
  generalization:
    "Origen: específico. Destino: general. Arrastra del origen al destino; el sentido no se invierte.",
};

function paletteIcon(id: string): IconName {
  return PALETTE_ICONS[id] ?? "select";
}

function paletteDescription(id: string): string {
  return PALETTE_DESCRIPTIONS[id] ?? "";
}

type PaletteProps = {
  headingId: string;
};

export function Palette({ headingId }: PaletteProps) {
  const store = useEditorStoreApi();
  const tool = useEditorStore(selectTool);
  const kind = useEditorStore(selectDocumentKind);
  const hasBoundary = useEditorStore(selectHasSystemBoundary);
  const elementTools = paletteElementTools(kind);
  const relationshipTools = paletteRelationshipTools(kind);

  function selectElementTool(next: EditorTool) {
    store.getState().setTool(tool === next ? "select" : next);
  }

  return (
    <div className={styles.body}>
      <h2 id={headingId} className={styles.heading}>
        Paleta
      </h2>
      <section className={styles.group}>
        <ul className={styles.list}>
          <li>
            <ToolButton
              variant="row"
              icon={paletteIcon(PALETTE_SELECT_TOOL.id)}
              label={PALETTE_SELECT_TOOL.label}
              description={paletteDescription(PALETTE_SELECT_TOOL.id)}
              placement="right"
              pressed={tool === PALETTE_SELECT_TOOL.id}
              onClick={() => {
                selectElementTool(PALETTE_SELECT_TOOL.id);
              }}
            />
          </li>
        </ul>
      </section>
      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Elementos</h3>
        <ul className={styles.list}>
          {elementTools.map((item) => (
            <li key={item.id}>
              {item.id === "system-boundary" && hasBoundary ? (
                <InertButton
                  icon={paletteIcon(item.id)}
                  reason={BOUNDARY_EXISTS_REASON}
                >
                  {item.label}
                </InertButton>
              ) : (
                <ToolButton
                  variant="row"
                  icon={paletteIcon(item.id)}
                  label={item.label}
                  description={paletteDescription(item.id)}
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
          {relationshipTools.map((item) => (
            <li key={item.id}>
              <ToolButton
                variant="row"
                icon={paletteIcon(item.id)}
                label={item.label}
                description={
                  "hint" in item && item.hint !== undefined
                    ? item.hint
                    : paletteDescription(item.id)
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
