import { toCanvas } from "html-to-image";
import {
  evaluateExportScale,
  exportViewportTransform,
  type ExportBounds,
  type ExportScale,
} from "./bounds.ts";
import type { ExportFormat } from "./download.ts";

export const JPG_QUALITY = 0.92;
export const PNG_MIME = "image/png";
export const JPG_MIME = "image/jpeg";

const CHROME_CLASS_FRAGMENTS = [
  "react-flow__controls",
  "react-flow__attribution",
  "react-flow__minimap",
  "react-flow__handle",
  "react-flow__edge-interaction",
  "react-flow__background",
  "react-flow__selection",
  "react-flow__nodesselection",
  "react-flow__resize-control",
  "alignment-guides",
] as const;

const CHROME_TEST_IDS = new Set([
  "inspector",
  "inspector-warnings",
  "inspector-warning",
  "editor-live",
  "alignment-guides",
]);

export type ExportDiagramInput = {
  viewportElement: HTMLElement;
  bounds: ExportBounds;
};

export type ExportDiagramOptions = {
  format: ExportFormat;
  scale: ExportScale;
};

export type ExportDiagramResult = {
  blob: Blob;
  width: number;
  height: number;
};

export const EXPORT_ERROR_CODES = ["SIZE_LIMIT", "RASTERIZE"] as const;

export type ExportErrorCode = (typeof EXPORT_ERROR_CODES)[number];

export class ExportError extends Error {
  readonly code: ExportErrorCode;
  readonly retryable = true as const;
  readonly suggestScale: 1 | undefined;

  constructor(
    code: ExportErrorCode,
    message: string,
    options?: { suggestScale?: 1 },
  ) {
    super(message);
    this.name = "ExportError";
    this.code = code;
    this.suggestScale = options?.suggestScale;
  }
}

export function isExportError(error: unknown): error is ExportError {
  return error instanceof ExportError;
}

export function excludeExportChrome(node: HTMLElement): boolean {
  if (typeof node.getAttribute !== "function") {
    return true;
  }
  if (node.getAttribute("role") === "alert") {
    return false;
  }
  const testId = node.getAttribute("data-testid");
  if (testId !== null && CHROME_TEST_IDS.has(testId)) {
    return false;
  }
  const className = node.getAttribute("class") ?? "";
  return CHROME_CLASS_FRAGMENTS.every(
    (fragment) => !className.includes(fragment),
  );
}

export async function exportDiagram(
  input: ExportDiagramInput,
  options: ExportDiagramOptions,
): Promise<ExportDiagramResult> {
  const check = evaluateExportScale(input.bounds, options.scale);
  if (!check.allowed) {
    if (check.suggestScale === 1) {
      throw new ExportError("SIZE_LIMIT", sizeLimitMessage(1), {
        suggestScale: 1,
      });
    }
    throw new ExportError("SIZE_LIMIT", sizeLimitMessage(undefined));
  }

  const canvasRoot = input.viewportElement.closest(
    '[data-testid="diagram-canvas"]',
  );
  canvasRoot?.setAttribute("data-exporting", "true");

  try {
    await nextPaint();
    const transform = exportViewportTransform(input.bounds);
    const canvas = await toCanvas(input.viewportElement, {
      pixelRatio: options.scale,
      cacheBust: true,
      skipAutoScale: true,
      width: input.bounds.width,
      height: input.bounds.height,
      ...(options.format === "jpg" ? { backgroundColor: "#ffffff" } : {}),
      style: {
        width: `${input.bounds.width}px`,
        height: `${input.bounds.height}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
      filter: excludeExportChrome,
    });
    const blob = await canvasToBlob(canvas, options.format);
    return {
      blob,
      width: canvas.width,
      height: canvas.height,
    };
  } catch (error) {
    if (isExportError(error)) {
      throw error;
    }
    throw new ExportError(
      "RASTERIZE",
      "No se pudo generar la imagen. Puedes reintentar.",
    );
  } finally {
    canvasRoot?.removeAttribute("data-exporting");
  }
}

function sizeLimitMessage(suggestScale: 1 | undefined): string {
  if (suggestScale === 1) {
    return "La imagen a 2x supera el límite (4096 px por lado o 16 megapíxeles). Prueba 1x.";
  }
  return "El diagrama es demasiado grande para exportar (máximo 4096 px por lado y 16 megapíxeles).";
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    if (format === "jpg") {
      canvas.toBlob(resolve, JPG_MIME, JPG_QUALITY);
      return;
    }
    canvas.toBlob(resolve, PNG_MIME);
  });
  if (blob === null) {
    throw new ExportError(
      "RASTERIZE",
      "No se pudo generar la imagen. Puedes reintentar.",
    );
  }
  return blob;
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        resolve();
      });
      return;
    }
    resolve();
  });
}
