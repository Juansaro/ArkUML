import type { ExportFormat } from "./download.ts";
import { JPG_MIME, PNG_MIME } from "./exportDiagram.ts";

export const CLIPBOARD_COPY_FAILED_MESSAGE = "No se pudo copiar la imagen.";
export const CLIPBOARD_COPIED_MESSAGE = "Imagen copiada.";

export class ClipboardCopyError extends Error {
  constructor(message = CLIPBOARD_COPY_FAILED_MESSAGE) {
    super(message);
    this.name = "ClipboardCopyError";
  }
}

export function isClipboardCopyError(
  error: unknown,
): error is ClipboardCopyError {
  return error instanceof ClipboardCopyError;
}

export type CopyExportImageOptions = {
  toPng?: (blob: Blob) => Promise<Blob>;
};

export async function copyExportImage(
  blob: Blob,
  format: ExportFormat,
  options?: CopyExportImageOptions,
): Promise<void> {
  if (!canWriteClipboard()) {
    throw new ClipboardCopyError();
  }

  const mime = format === "jpg" ? JPG_MIME : PNG_MIME;
  const payload = typedBlob(blob, mime);

  if (format === "png") {
    try {
      await writeClipboardImage(payload, PNG_MIME);
      return;
    } catch (error) {
      throw wrapClipboardError(error);
    }
  }

  if (clipboardSupportsType(JPG_MIME)) {
    try {
      await writeClipboardImage(payload, JPG_MIME);
      return;
    } catch (error) {
      if (isClipboardPermissionDenied(error)) {
        throw new ClipboardCopyError();
      }
    }
  }

  try {
    const toPng = options?.toPng ?? blobToPng;
    const png = typedBlob(await toPng(payload), PNG_MIME);
    await writeClipboardImage(png, PNG_MIME);
  } catch (error) {
    throw wrapClipboardError(error);
  }
}

function canWriteClipboard(): boolean {
  if (typeof ClipboardItem === "undefined") {
    return false;
  }
  const clipboard = navigator.clipboard;
  return clipboard !== undefined && typeof clipboard.write === "function";
}

function clipboardSupportsType(type: string): boolean {
  const supports = (
    ClipboardItem as unknown as { supports?: (mime: string) => boolean }
  ).supports;
  if (typeof supports !== "function") {
    return true;
  }
  return supports(type);
}

async function writeClipboardImage(blob: Blob, type: string): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
}

async function blobToPng(blob: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(blob);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (context === null) {
        throw new ClipboardCopyError();
      }
      context.drawImage(bitmap, 0, 0);
      const png = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, PNG_MIME);
      });
      if (png === null) {
        throw new ClipboardCopyError();
      }
      return png;
    } finally {
      bitmap.close();
    }
  } catch (error) {
    if (error instanceof ClipboardCopyError) {
      throw error;
    }
    throw new ClipboardCopyError();
  }
}

function typedBlob(blob: Blob, type: string): Blob {
  return blob.type === type ? blob : new Blob([blob], { type });
}

function isClipboardPermissionDenied(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "NotAllowedError" || error.name === "SecurityError")
  );
}

function wrapClipboardError(error: unknown): ClipboardCopyError {
  if (error instanceof ClipboardCopyError) {
    return error;
  }
  return new ClipboardCopyError();
}
