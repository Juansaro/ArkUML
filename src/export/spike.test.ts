import { describe, expect, it } from "vitest";
import {
  analyzeSpikePixels,
  excludeReactFlowChrome,
  hasPngSignature,
  PNG_SIGNATURE,
} from "./spike.ts";

describe("spike raster helpers", () => {
  it("reconoce la firma PNG", () => {
    expect(hasPngSignature(PNG_SIGNATURE)).toBe(true);
    expect(hasPngSignature(Uint8Array.of(0xff, 0xd8))).toBe(false);
  });

  it("incluye nodos sin getAttribute (html-to-image recorre Text)", () => {
    expect(excludeReactFlowChrome({} as HTMLElement)).toBe(true);
  });

  it("excluye handles y el hit area de edges en el raster", () => {
    const handle = {
      getAttribute: () => "react-flow__handle",
    } as unknown as HTMLElement;
    const hitArea = {
      getAttribute: () => "react-flow__edge-interaction",
    } as unknown as HTMLElement;
    const path = {
      getAttribute: () => "react-flow__edge-path",
    } as unknown as HTMLElement;

    expect(excludeReactFlowChrome(handle)).toBe(false);
    expect(excludeReactFlowChrome(hitArea)).toBe(false);
    expect(excludeReactFlowChrome(path)).toBe(true);
  });

  it("detecta rectángulo, texto oscuro y marker rojo", () => {
    const data = new Uint8ClampedArray([
      16, 96, 180, 255, 17, 17, 17, 255, 200, 16, 16, 255, 255, 255, 255, 0,
    ]);
    expect(analyzeSpikePixels(data)).toEqual({
      opaquePixelCount: 3,
      nodeFillDetected: true,
      textDetected: true,
      markerDetected: true,
    });
  });
});
