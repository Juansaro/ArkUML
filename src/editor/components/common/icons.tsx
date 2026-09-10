export const ICON_NAMES = [
  "mark",
  "palette",
  "inspector",
  "newDiagram",
  "openFile",
  "saveJson",
  "undo",
  "redo",
  "export",
  "help",
  "zoomIn",
  "zoomOut",
  "fitView",
  "actor",
  "useCase",
  "systemBoundary",
  "association",
  "include",
  "extend",
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
  }
}
