import { EditorStoreProvider } from "../editor/store/EditorStoreProvider.tsx";
import { EditorShell } from "../editor/components/shell/EditorShell.tsx";
import { ExportSpikePage } from "../export/ExportSpikePage.tsx";

export function App() {
  if (hasExportSpikeQuery()) {
    return <ExportSpikePage />;
  }

  return (
    <EditorStoreProvider>
      <EditorShell />
    </EditorStoreProvider>
  );
}

function hasExportSpikeQuery(): boolean {
  return new URLSearchParams(window.location.search).has("export-spike");
}
