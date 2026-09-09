import { afterEach, describe, expect, it, vi } from "vitest";
import {
  downloadBlob,
  exportFilename,
  hasJpegSignature,
  hasPngSignature,
  JPEG_SIGNATURE,
  PNG_SIGNATURE,
  sanitizeExportBasename,
} from "./download.ts";

describe("export filenames", () => {
  it("conserva el título del diagrama y la extensión del formato", () => {
    expect(exportFilename("Diagrama de casos de uso", "png")).toBe(
      "Diagrama de casos de uso.png",
    );
    expect(exportFilename("Diagrama de casos de uso", "jpg")).toBe(
      "Diagrama de casos de uso.jpg",
    );
  });

  it("sanea caracteres ilegales y títulos vacíos", () => {
    expect(sanitizeExportBasename('a/b<>:"|?*.x')).toBe("a b .x");
    expect(sanitizeExportBasename("   ")).toBe("diagrama");
    expect(sanitizeExportBasename("...")).toBe("diagrama");
    expect(sanitizeExportBasename("informe\nfinal")).toBe("informe final");
  });
});

describe("image signatures", () => {
  it("reconoce PNG y JPEG", () => {
    expect(hasPngSignature(PNG_SIGNATURE)).toBe(true);
    expect(hasJpegSignature(JPEG_SIGNATURE)).toBe(true);
    expect(hasPngSignature(JPEG_SIGNATURE)).toBe(false);
    expect(hasJpegSignature(PNG_SIGNATURE)).toBe(false);
    expect(hasPngSignature(Uint8Array.of(0x89))).toBe(false);
  });
});

describe("downloadBlob", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("descarga el blob y revoca el object URL", () => {
    const objectUrl = "blob:arkuml-export";
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => objectUrl),
      revokeObjectURL,
    });
    const click = vi.fn();
    const remove = vi.fn();
    const anchor = {
      href: "",
      download: "",
      rel: "",
      click,
      remove,
    };
    const createElement = vi
      .spyOn(document, "createElement")
      .mockReturnValue(anchor as unknown as HTMLAnchorElement);
    const append = vi
      .spyOn(document.body, "append")
      .mockImplementation(() => undefined);

    downloadBlob(new Blob(["png"], { type: "image/png" }), "diagrama.png");

    expect(createElement).toHaveBeenCalledWith("a");
    expect(anchor.href).toBe(objectUrl);
    expect(anchor.download).toBe("diagrama.png");
    expect(anchor.rel).toBe("noopener");
    expect(append).toHaveBeenCalledWith(anchor);
    expect(click).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
  });
});
