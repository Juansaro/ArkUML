import { createContext, useContext, type ReactNode } from "react";
import type { WorkspaceSession } from "./bootstrap.ts";

const WorkspaceSessionContext = createContext<WorkspaceSession | undefined>(
  undefined,
);

type WorkspaceSessionProviderProps = {
  session: WorkspaceSession;
  children: ReactNode;
};

export function WorkspaceSessionProvider({
  session,
  children,
}: WorkspaceSessionProviderProps) {
  return (
    <WorkspaceSessionContext.Provider value={session}>
      {children}
    </WorkspaceSessionContext.Provider>
  );
}

export function useOptionalWorkspaceSession(): WorkspaceSession | undefined {
  return useContext(WorkspaceSessionContext);
}

export function useWorkspaceSession(): WorkspaceSession {
  const session = useOptionalWorkspaceSession();
  if (session === undefined) {
    throw new Error("useWorkspaceSession requiere WorkspaceSessionProvider");
  }
  return session;
}
