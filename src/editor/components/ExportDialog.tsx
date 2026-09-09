import { useId, useRef, useState } from "react";
import {
  diagramContentBounds,
  evaluateExportScale,
  paddedExportBounds,
  type ExportScale,
} from "../../export/bounds.ts";
import {
  downloadBlob,
  exportFilename,
  type ExportFormat,
} from "../../export/download.ts";
import {
  exportDiagram,
  isExportError,
  type ExportDiagramResult,
} from "../../export/exportDiagram.ts";
import { selectDocument, selectDocumentTitle } from "../store/selectors.ts";
import { useEditorStore } from "../store/EditorStoreProvider.tsx";
import { useFocusTrap } from "./useFocusTrap.ts";
import styles from "./ExportDialog.module.css";

export type ExportRunner = typeof exportDiagram;
export type ExportDownloader = typeof downloadBlob;
export type ViewportElementQuery = () => HTMLElement | null;

type ExportDialogProps = {
  onCancel: () => void;
  runExport?: ExportRunner;
  download?: ExportDownloader;
  queryViewport?: ViewportElementQuery;
};

const FORMATS: ReadonlyArray<{ value: ExportFormat; label: string }> = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
];

const SCALES: ReadonlyArray<{ value: ExportScale; label: string }> = [
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
];

export function ExportDialog({
  onCancel,
  runExport = exportDiagram,
  download = downloadBlob,
  queryViewport = queryDiagramViewport,
}: ExportDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const diagram = useEditorStore(selectDocument);
  const documentTitle = useEditorStore(selectDocumentTitle);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [scale, setScale] = useState<ExportScale>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [suggestScale, setSuggestScale] = useState<1 | undefined>();
  useFocusTrap(dialogRef, () => {
    if (!busy) {
      onCancel();
    }
  });

  const bounds = paddedExportBounds(diagramContentBounds(diagram));
  const preview = evaluateExportScale(bounds, scale);
  const filename = exportFilename(documentTitle, format);

  function handleCancel() {
    if (busy) {
      return;
    }
    onCancel();
  }

  async function handleDownload() {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(undefined);
    setSuggestScale(undefined);
    try {
      const viewportElement = queryViewport();
      if (viewportElement === null) {
        setError("No se pudo generar la imagen. Puedes reintentar.");
        return;
      }
      const result: ExportDiagramResult = await runExport(
        { viewportElement, bounds },
        { format, scale },
      );
      download(result.blob, filename);
      onCancel();
    } catch (caught) {
      if (isExportError(caught)) {
        setError(caught.message);
        setSuggestScale(caught.suggestScale);
        return;
      }
      setError("No se pudo generar la imagen. Puedes reintentar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={handleCancel} />
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={busy}
        data-testid="export-dialog"
      >
        <h2 id={titleId} className={styles.title}>
          Exportar
        </h2>
        <p id={descriptionId} className={styles.body}>
          Descarga el diagrama completo, también el contenido fuera del
          viewport. PNG conserva transparencia; JPG usa fondo blanco.
        </p>
        <fieldset className={styles.fieldset} disabled={busy}>
          <legend className={styles.legend}>Formato</legend>
          <div className={styles.options}>
            {FORMATS.map((option) => (
              <label key={option.value} className={styles.option}>
                <input
                  type="radio"
                  name="export-format"
                  value={option.value}
                  checked={format === option.value}
                  onChange={() => {
                    setFormat(option.value);
                  }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className={styles.fieldset} disabled={busy}>
          <legend className={styles.legend}>Escala</legend>
          <div className={styles.options}>
            {SCALES.map((option) => (
              <label key={option.value} className={styles.option}>
                <input
                  type="radio"
                  name="export-scale"
                  value={option.value}
                  checked={scale === option.value}
                  onChange={() => {
                    setScale(option.value);
                    setError(undefined);
                    setSuggestScale(undefined);
                  }}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <p className={styles.meta} data-testid="export-dimensions">
          {preview.width} × {preview.height} px · {filename}
        </p>
        {preview.allowed ? null : (
          <p className={styles.error} role="alert">
            {preview.suggestScale === 1
              ? "La imagen a 2x supera el límite (4096 px por lado o 16 megapíxeles). Prueba 1x."
              : "El diagrama es demasiado grande para exportar (máximo 4096 px por lado y 16 megapíxeles)."}
          </p>
        )}
        {error !== undefined ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {busy ? (
          <p className={styles.progress} role="status">
            Exportando…
          </p>
        ) : null}
        <div className={styles.actions}>
          <button type="button" disabled={busy} onClick={handleCancel}>
            Cancelar
          </button>
          {suggestScale === 1 ? (
            <button
              type="button"
              onClick={() => {
                setScale(1);
                setError(undefined);
                setSuggestScale(undefined);
              }}
            >
              Usar 1x
            </button>
          ) : null}
          <button
            type="button"
            className={styles.confirm}
            disabled={busy || !preview.allowed}
            onClick={() => {
              void handleDownload();
            }}
          >
            Descargar
          </button>
        </div>
      </div>
    </div>
  );
}

function queryDiagramViewport(): HTMLElement | null {
  return document.querySelector(
    '[data-testid="diagram-canvas"] .react-flow__viewport',
  );
}
