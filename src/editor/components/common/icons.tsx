export const ICON_NAMES = [
  "mark",
  "palette",
  "inspector",
  "newDiagram",
  "deleteDiagram",
  "openFile",
  "saveJson",
  "undo",
  "redo",
  "export",
  "help",
  "zoomIn",
  "zoomOut",
  "fitView",
  "collapseView",
  "select",
  "actor",
  "useCase",
  "systemBoundary",
  "association",
  "include",
  "extend",
  "lifeline",
  "syncMessage",
  "replyMessage",
  "class",
  "classAssociation",
  "aggregation",
  "composition",
  "generalization",
  "component",
  "componentUsage",
  "assemblyConnector",
  "node",
  "artifact",
  "communicationPath",
  "deploy",
  "entity",
  "attribute",
  "erRelationship",
  "erLink",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export function IconPaths({ name }: { name: IconName }) {
  switch (name) {
    case "mark":
      return (
        <>
          <path d="M4 20V6H9L12 3L15 6H20V20Z" />
          <circle cx="8" cy="14" r="1.5" />
          <circle cx="16" cy="14" r="1.5" />
          <path d="M9.5 14H14.5" />
        </>
      );
    case "palette":
      return (
        <>
          <path d="M4 5h16v14H4z" />
          <path d="M9 5v14" />
        </>
      );
    case "inspector":
      return (
        <>
          <path d="M4 5h16v14H4z" />
          <path d="M15 5v14" />
        </>
      );
    case "newDiagram":
      return (
        <>
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M14 3v5h5" />
          <path d="M12 11v6" />
          <path d="M9 14h6" />
        </>
      );
    case "deleteDiagram":
      return (
        <>
          <path d="M5 7h14" />
          <path d="M9 7V4h6v2" />
          <path d="M8 7l1 13h6l1-13" />
          <path d="M10 11v5" />
          <path d="M14 11v5" />
        </>
      );
    case "openFile":
      return (
        <>
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M14 3v5h5" />
          <path d="M12 18v-6" />
          <path d="M9 15l3-3 3 3" />
        </>
      );
    case "saveJson":
      return (
        <>
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M14 3v5h5" />
          <path d="M12 10v6" />
          <path d="M9 13l3 3 3-3" />
        </>
      );
    case "undo":
      return (
        <>
          <path d="M8 13 4 9l4-4" />
          <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
        </>
      );
    case "redo":
      return (
        <>
          <path d="M16 13l4-4-4-4" />
          <path d="M20 9H9a5 5 0 0 0 0 10h3" />
        </>
      );
    case "export":
      return (
        <>
          <path d="M4 7h11v12H4z" />
          <path d="M14 9l6-5" />
          <path d="M16 4h4v4" />
        </>
      );
    case "help":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.1 9.2a3 3 0 1 1 3.7 2.9c-.8.4-1.3 1-1.3 1.9" />
          <path d="M12 17.5v.01" />
        </>
      );
    case "zoomIn":
      return (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.2 15.2 20 20" />
          <path d="M10.5 8v5" />
          <path d="M8 10.5h5" />
        </>
      );
    case "zoomOut":
      return (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.2 15.2 20 20" />
          <path d="M8 10.5h5" />
        </>
      );
    case "fitView":
      return (
        <>
          <path d="M9 4H4v5" />
          <path d="M15 4h5v5" />
          <path d="M20 15v5h-5" />
          <path d="M4 15v5h5" />
        </>
      );
    case "collapseView":
      return (
        <>
          <path d="M9 4v5H4" />
          <path d="M15 4v5h5" />
          <path d="M20 15h-5v5" />
          <path d="M4 15h5v5" />
        </>
      );
    case "select":
      return <path d="M6 4v16l4.5-4.5 2.2 5.3 2.4-1-2.2-5.3H19z" />;
    case "actor":
      return (
        <>
          <circle cx="12" cy="5" r="3" />
          <path d="M12 8v7" />
          <path d="M7 11h10" />
          <path d="M12 15 8 21" />
          <path d="M12 15l4 6" />
        </>
      );
    case "useCase":
      return <ellipse cx="12" cy="12" rx="9" ry="5.5" />;
    case "systemBoundary":
      return (
        <>
          <path d="M4 5h16v14H4z" />
          <path d="M4 9h16" />
        </>
      );
    case "association":
      return (
        <>
          <circle cx="5" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
          <path d="M7 12h10" />
        </>
      );
    case "include":
      return (
        <>
          <path d="M3 12h11" strokeDasharray="4 3" />
          <path d="M12 9.5 15 12l-3 2.5" />
          <path d="M18 8v8" />
          <path d="M16.5 8h3" />
          <path d="M16.5 16h3" />
        </>
      );
    case "extend":
      return (
        <>
          <path d="M3 12h11" strokeDasharray="4 3" />
          <path d="M12 9.5 15 12l-3 2.5" />
          <path d="M17 8v8" />
          <path d="M17 8h3.5" />
          <path d="M17 12h2.5" />
          <path d="M17 16h3.5" />
        </>
      );
    case "lifeline":
      return (
        <>
          <rect x="7" y="3" width="10" height="6" />
          <path d="M12 9v12" strokeDasharray="2 2" />
        </>
      );
    case "syncMessage":
      return (
        <>
          <path d="M4 12h14" />
          <path d="M15 8l5 4-5 4z" fill="currentColor" stroke="none" />
        </>
      );
    case "replyMessage":
      return (
        <>
          <path d="M4 12h14" strokeDasharray="3 2" />
          <path d="M16 8l5 4-5 4" />
        </>
      );
    case "class":
      return (
        <>
          <path d="M5 4h14v16H5z" />
          <path d="M5 9h14" />
          <path d="M5 14h14" />
        </>
      );
    case "classAssociation":
      return (
        <>
          <path d="M3 8h5v8H3z" />
          <path d="M16 8h5v8h-5z" />
          <path d="M8 12h8" />
        </>
      );
    case "aggregation":
      return (
        <>
          <path d="M3 12l4-4 4 4-4 4z" />
          <path d="M11 12h10" />
        </>
      );
    case "composition":
      return (
        <>
          <path d="M3 12l4-4 4 4-4 4z" fill="currentColor" stroke="none" />
          <path d="M11 12h10" />
        </>
      );
    case "generalization":
      return (
        <>
          <path d="M3 12h10" />
          <path d="M13 7l8 5-8 5z" />
        </>
      );
    case "component":
      return (
        <>
          <path d="M8 5h12v14H8z" />
          <path d="M4 8h5v3H4z" />
          <path d="M4 13h5v3H4z" />
        </>
      );
    case "componentUsage":
      return (
        <>
          <path d="M3 12h10" strokeDasharray="4 3" />
          <path d="M11 9.5 14 12l-3 2.5" />
          <path d="M17 8v5a2.5 2.5 0 0 0 5 0V8" />
        </>
      );
    case "assemblyConnector":
      return (
        <>
          <circle cx="6" cy="12" r="2.5" fill="currentColor" stroke="none" />
          <path d="M9 12h6" />
          <path d="M18 8a4 4 0 0 1 0 8" />
        </>
      );
    case "node":
      return (
        <>
          <path d="M4 9h14v10H4z" />
          <path d="M4 9l4-4h14l-4 4" />
          <path d="M18 9v10l4-4V5" />
        </>
      );
    case "artifact":
      return (
        <>
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M14 3v5h5" />
        </>
      );
    case "communicationPath":
      return (
        <>
          <path d="M3 9h5v8H3z" />
          <path d="M3 9l2-2h5l-2 2" />
          <path d="M16 9h5v8h-5z" />
          <path d="M16 9l2-2h5l-2 2" />
          <path d="M8 13h8" />
        </>
      );
    case "deploy":
      return (
        <>
          <path d="M3 12h10" strokeDasharray="4 3" />
          <path d="M11 9.5 14 12l-3 2.5" />
          <path d="M17 8v8" />
          <path d="M17 8h3a2 2 0 0 1 0 4h-3" />
        </>
      );
    case "entity":
      return <path d="M4 6h16v12H4z" />;
    case "attribute":
      return <ellipse cx="12" cy="12" rx="9" ry="6" />;
    case "erRelationship":
      return <path d="M12 3l9 9-9 9-9-9z" />;
    case "erLink":
      return (
        <>
          <path d="M3 8h6v8H3z" />
          <path d="M9 12h5" />
          <path d="M17 6l5 6-5 6-5-6z" />
        </>
      );
  }
}
