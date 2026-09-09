import { describe, expect, it } from "vitest";
import { parseWorkspaceSnapshot } from "../domain/diagram/schema.ts";
import {
  diagramContentBounds,
  evaluateExportScale,
  paddedExportBounds,
} from "../export/bounds.ts";
import {
  createPerformanceSnapshot,
  performanceCounts,
} from "./performanceFixture.ts";

describe("performanceFixture", () => {
  it("genera el escenario objetivo 100/150 válido y exportable a 2x", () => {
    const snapshot = createPerformanceSnapshot("target");
    const parsed = parseWorkspaceSnapshot(snapshot);
    const counts = performanceCounts("target");

    expect(parsed.ok).toBe(true);
    expect(snapshot.document.elements).toHaveLength(counts.elements);
    expect(snapshot.document.relationships).toHaveLength(counts.relationships);
    expect(counts).toEqual({
      actors: 30,
      useCases: 69,
      elements: 100,
      relationships: 150,
    });

    const preview = evaluateExportScale(
      paddedExportBounds(diagramContentBounds(snapshot.document)),
      2,
    );
    expect(preview).toEqual({
      width: 3456,
      height: 3936,
      allowed: true,
      suggestScale: undefined,
    });
    expect(persistedUtf16Bytes(snapshot)).toBeLessThan(256 * 1024);
  });

  it("genera el escenario de estrés 200/300 válido; 2x no cabe y 1x sí", () => {
    const snapshot = createPerformanceSnapshot("stress");
    const parsed = parseWorkspaceSnapshot(snapshot);
    const counts = performanceCounts("stress");

    expect(parsed.ok).toBe(true);
    expect(snapshot.document.elements).toHaveLength(counts.elements);
    expect(snapshot.document.relationships).toHaveLength(counts.relationships);
    expect(counts).toEqual({
      actors: 50,
      useCases: 149,
      elements: 200,
      relationships: 300,
    });

    const bounds = paddedExportBounds(diagramContentBounds(snapshot.document));
    expect(evaluateExportScale(bounds, 2)).toEqual({
      width: 4864,
      height: 6496,
      allowed: false,
      suggestScale: 1,
    });
    expect(evaluateExportScale(bounds, 1)).toEqual({
      width: 2432,
      height: 3248,
      allowed: true,
      suggestScale: undefined,
    });
    expect(persistedUtf16Bytes(snapshot)).toBeLessThan(256 * 1024);
  });
});

function persistedUtf16Bytes(snapshot: unknown): number {
  return JSON.stringify(snapshot).length * 2;
}
