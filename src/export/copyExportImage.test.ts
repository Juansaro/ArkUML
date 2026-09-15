import { afterEach, describe, expect, it, vi } from "vitest";
import { JPG_MIME, PNG_MIME } from "./exportDiagram.ts";
import {
  CLIPBOARD_COPY_FAILED_MESSAGE,
  ClipboardCopyError,
  copyExportImage,
  isClipboardCopyError,
} from "./copyExportImage.ts";

const PNG_BLOB = new Blob(["png-bytes"], { type: PNG_MIME });
const JPEG_BLOB = new Blob(["jpeg-bytes"], { type: JPG_MIME });

class StubClipboardItem {
  readonly types: string[];
  readonly blobs: Record<string, Blob>;

  static allowed = new Set([PNG_MIME, JPG_MIME]);

  constructor(items: Record<string, Blob>) {
    this.blobs = items;
    this.types = Object.keys(items);
  }

  static supports(type: string): boolean {
    return StubClipboardItem.allowed.has(type);
  }
}

function installClipboard(write: (items: ClipboardItem[]) => Promise<void>) {
  vi.stubGlobal("ClipboardItem", StubClipboardItem);
  vi.stubGlobal("navigator", {
    clipboard: { write },
  });
}

function writtenItem(
  write: {
    mock: { calls: ReadonlyArray<[items: ClipboardItem[]] | undefined> };
  },
  call = 0,
): StubClipboardItem {
  const item = write.mock.calls[call]?.[0]?.[0];
  if (!(item instanceof StubClipboardItem)) {
    throw new Error("Expected StubClipboardItem");
  }
  return item;
}

describe("copyExportImage", () => {
  afterEach(() => {
    StubClipboardItem.allowed = new Set([PNG_MIME, JPG_MIME]);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("escribe image/png en el clipboard", async () => {
    const write = vi
      .fn<(items: ClipboardItem[]) => Promise<void>>()
      .mockResolvedValue(undefined);
    installClipboard(write);

    await copyExportImage(PNG_BLOB, "png");

    expect(write).toHaveBeenCalledTimes(1);
    const written = writtenItem(write);
    expect(written.types).toEqual([PNG_MIME]);
    expect(written.blobs[PNG_MIME]).toBe(PNG_BLOB);
  });

  it("escribe image/jpeg cuando el navegador lo acepta", async () => {
    const write = vi
      .fn<(items: ClipboardItem[]) => Promise<void>>()
      .mockResolvedValue(undefined);
    installClipboard(write);

    await copyExportImage(JPEG_BLOB, "jpg");

    expect(write).toHaveBeenCalledTimes(1);
    const written = writtenItem(write);
    expect(written.types).toEqual([JPG_MIME]);
    expect(written.blobs[JPG_MIME]).toBe(JPEG_BLOB);
  });

  it("cae a PNG del mismo raster si image/jpeg no es aceptado", async () => {
    StubClipboardItem.allowed = new Set([PNG_MIME]);
    const write = vi
      .fn<(items: ClipboardItem[]) => Promise<void>>()
      .mockResolvedValue(undefined);
    const pngFromRaster = new Blob(["from-raster"], { type: PNG_MIME });
    const toPng = vi.fn((blob: Blob) => {
      expect(blob.type).toBe(JPG_MIME);
      return Promise.resolve(pngFromRaster);
    });
    installClipboard(write);

    await copyExportImage(JPEG_BLOB, "jpg", { toPng });

    expect(toPng).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledTimes(1);
    const written = writtenItem(write);
    expect(written.types).toEqual([PNG_MIME]);
    expect(written.blobs[PNG_MIME]).toBe(pngFromRaster);
  });

  it("cae a PNG si write rechaza el JPEG por tipo, no por permiso", async () => {
    const write = vi
      .fn<(items: ClipboardItem[]) => Promise<void>>()
      .mockRejectedValueOnce(new Error("Type image/jpeg not supported"))
      .mockResolvedValueOnce(undefined);
    const pngFromRaster = new Blob(["from-raster"], { type: PNG_MIME });
    const toPng = vi.fn(() => Promise.resolve(pngFromRaster));
    installClipboard(write);

    await copyExportImage(JPEG_BLOB, "jpg", { toPng });

    expect(toPng).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledTimes(2);
    const written = writtenItem(write, 1);
    expect(written.types).toEqual([PNG_MIME]);
  });

  it("no intenta PNG si el permiso está denegado", async () => {
    const write = vi
      .fn<(items: ClipboardItem[]) => Promise<void>>()
      .mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    const toPng = vi.fn(() => Promise.resolve(PNG_BLOB));
    installClipboard(write);

    const error = await copyExportImage(JPEG_BLOB, "jpg", { toPng }).catch(
      (caught: unknown) => caught,
    );

    expect(isClipboardCopyError(error)).toBe(true);
    expect(error).toBeInstanceOf(ClipboardCopyError);
    if (!isClipboardCopyError(error)) {
      throw new Error("Expected ClipboardCopyError");
    }
    expect(error.message).toBe(CLIPBOARD_COPY_FAILED_MESSAGE);
    expect(toPng).not.toHaveBeenCalled();
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("falla de forma visible si la API de clipboard no existe", async () => {
    vi.stubGlobal("ClipboardItem", undefined);
    vi.stubGlobal("navigator", {});

    await expect(copyExportImage(PNG_BLOB, "png")).rejects.toThrow(
      CLIPBOARD_COPY_FAILED_MESSAGE,
    );
  });

  it("envuelve un rechazo de write en ClipboardCopyError", async () => {
    const write = vi
      .fn<(items: ClipboardItem[]) => Promise<void>>()
      .mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    installClipboard(write);

    await expect(copyExportImage(PNG_BLOB, "png")).rejects.toBeInstanceOf(
      ClipboardCopyError,
    );
  });
});
