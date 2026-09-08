import { useEffect, useState } from "react";
import { EditorStoreProvider } from "../editor/store/EditorStoreProvider.tsx";
import { EditorShell } from "../editor/components/shell/EditorShell.tsx";
import { ExportSpikePage } from "../export/ExportSpikePage.tsx";
import { bootstrapWorkspace, type WorkspaceSession } from "./bootstrap.ts";
import { WorkspaceSessionProvider } from "./WorkspaceSessionProvider.tsx";
import styles from "./App.module.css";

export function App() {
  if (hasExportSpikeQuery()) {
    return <ExportSpikePage />;
  }

  return <BootstrappedEditor />;
}

function BootstrappedEditor() {
  const [session, setSession] = useState<WorkspaceSession>();

  useEffect(() => {
    let cancelled = false;
    let created: WorkspaceSession | undefined;

    void bootstrapWorkspace().then((next) => {
      if (cancelled) {
        next.coordinator.dispose();
        return;
      }
      created = next;
      setSession(next);
    });

    return () => {
      cancelled = true;
      created?.coordinator.dispose();
    };
  }, []);

  if (session === undefined) {
    return (
      <p className={styles.loading} role="status">
        Cargando el diagrama…
      </p>
    );
  }

  return (
    <WorkspaceSessionProvider session={session}>
      <EditorStoreProvider store={session.store}>
        <EditorShell />
      </EditorStoreProvider>
    </WorkspaceSessionProvider>
  );
}

function hasExportSpikeQuery(): boolean {
  return new URLSearchParams(window.location.search).has("export-spike");
}
