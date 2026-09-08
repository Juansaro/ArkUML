import { toCanvas } from "html-to-image";

/** Raster del spike TASK-008. En WebKit el marker SVG es intermitente; nodo+texto se conservan. */

export const PNG_SIGNATURE = Uint8Array.of(
  0x89,
  0x50,
  0x4e,
  0x47,
  0x0d,
  0x0a,
  0x1a,
  0x0a,
);

export const SPIKE_NODE_FILL = "#1060b4";
export const SPIKE_TEXT_FILL = "#111111";
export const SPIKE_MARKER_FILL = "#c81010";

const NODE_FILL_RGB = { r: 16, g: 96, b: 180 } as const;
const TEXT_RGB = { r: 17, g: 17, b: 17 } as const;
const MARKER_RGB = { r: 200, g: 16, b: 16 } as const;
const COLOR_TOLERANCE = 48;

export type SpikePixelReport = {
  opaquePixelCount: number;
  nodeFillDetected: boolean;
  textDetected: boolean;
  markerDetected: boolean;
};

export type ExportSpikeReport = SpikePixelReport & {
  pngBase64: string;
  byteLength: number;
  width: number;
  height: number;
  hasPngSignature: boolean;
};

export type ExportSpikeGlobal = Window & {
  __arkumlRasterizeExportSpike?: () => Promise<ExportSpikeReport>;
};

export function hasPngSignature(bytes: Uint8Array): boolean {
  if (bytes.length < PNG_SIGNATURE.length) {
    return false;
  }
  return PNG_SIGNATURE.every((value, index) => bytes[index] === value);
}

export function excludeReactFlowChrome(node: HTMLElement): boolean {
  if (typeof node.getAttribute !== "function") {
    return true;
  }
  const className = node.getAttribute("class") ?? "";
  return (
    !className.includes("react-flow__controls") &&
    !className.includes("react-flow__attribution") &&
    !className.includes("react-flow__minimap") &&
    !className.includes("react-flow__handle") &&
    !className.includes("react-flow__edge-interaction")
  );
}

export function analyzeSpikePixels(data: Uint8ClampedArray): SpikePixelReport {
  let opaquePixelCount = 0;
  let nodeFillDetected = false;
  let textDetected = false;
  let markerDetected = false;

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index] ?? 0;
    const g = data[index + 1] ?? 0;
    const b = data[index + 2] ?? 0;
    const a = data[index + 3] ?? 0;
    if (a < 128) {
      continue;
    }
    opaquePixelCount += 1;
    if (isNear(r, g, b, NODE_FILL_RGB)) {
      nodeFillDetected = true;
    }
    if (isNear(r, g, b, TEXT_RGB) || isDark(r, g, b)) {
      textDetected = true;
    }
    if (isNear(r, g, b, MARKER_RGB) || isRed(r, g, b)) {
      markerDetected = true;
    }
  }

  return {
    opaquePixelCount,
    nodeFillDetected,
    textDetected,
    markerDetected,
  };
}

export async function rasterizeExportSpike(
  element: HTMLElement,
): Promise<ExportSpikeReport> {
  const canvas = await toCanvas(element, {
    pixelRatio: 1,
    cacheBust: true,
    skipAutoScale: true,
    backgroundColor: "#ffffff",
    filter: excludeReactFlowChrome,
  });
  const blob = await canvasToPngBlob(canvas);
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("No se pudo leer el canvas rasterizado");
  }
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return {
    pngBase64: bytesToBase64(bytes),
    byteLength: bytes.byteLength,
    width: canvas.width,
    height: canvas.height,
    hasPngSignature: hasPngSignature(bytes),
    ...analyzeSpikePixels(image.data),
  };
}

async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (blob === null) {
    throw new Error("canvas.toBlob no produjo un PNG");
  }
  return blob;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const slice = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function isNear(
  r: number,
  g: number,
  b: number,
  target: { r: number; g: number; b: number },
): boolean {
  return (
    Math.abs(r - target.r) <= COLOR_TOLERANCE &&
    Math.abs(g - target.g) <= COLOR_TOLERANCE &&
    Math.abs(b - target.b) <= COLOR_TOLERANCE
  );
}

function isDark(r: number, g: number, b: number): boolean {
  return r < 50 && g < 50 && b < 50;
}

function isRed(r: number, g: number, b: number): boolean {
  return r > 140 && g < 90 && b < 90;
}
