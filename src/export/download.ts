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

export const JPEG_SIGNATURE = Uint8Array.of(0xff, 0xd8);

const ILLEGAL_FILENAME_CHARS = new Set([
  "<",
  ">",
  ":",
  '"',
  "/",
  "\\",
  "|",
  "?",
  "*",
]);

export type ExportFormat = "png" | "jpg";

export function hasPngSignature(bytes: Uint8Array): boolean {
  return hasPrefix(bytes, PNG_SIGNATURE);
}

export function hasJpegSignature(bytes: Uint8Array): boolean {
  return hasPrefix(bytes, JPEG_SIGNATURE);
}

export function sanitizeExportBasename(title: string): string {
  const cleaned = [...title]
    .map((char) => (isIllegalFilenameChar(char) ? " " : char))
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.+$/, "");
  return cleaned.length === 0 ? "diagrama" : cleaned;
}

export function exportFilename(title: string, format: ExportFormat): string {
  return `${sanitizeExportBasename(title)}.${format}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function isIllegalFilenameChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return code < 32 || ILLEGAL_FILENAME_CHARS.has(char);
}

function hasPrefix(bytes: Uint8Array, prefix: Uint8Array): boolean {
  if (bytes.length < prefix.length) {
    return false;
  }
  return prefix.every((value, index) => bytes[index] === value);
}
