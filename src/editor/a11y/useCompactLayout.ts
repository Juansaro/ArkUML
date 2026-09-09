import { useEffect, useState } from "react";

const COMPACT_QUERY = "(max-width: 1023px)";

export function useCompactLayout(): boolean {
  return useMediaQuery(COMPACT_QUERY);
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => readMediaQuery(query));

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia(query);
    function onChange() {
      setMatches(media.matches);
    }

    onChange();
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, [query]);

  return matches;
}

function readMediaQuery(query: string): boolean {
  if (typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(query).matches;
}
