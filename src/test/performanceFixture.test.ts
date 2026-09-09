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
    expect(preview.allowed).toBe(true);
  });

  it("genera el escenario de estrés 200/300 válido", () => {
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
  });
});
