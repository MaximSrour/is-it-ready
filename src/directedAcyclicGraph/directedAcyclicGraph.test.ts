import { describe, expect, it } from "vitest";

import { validateDirectedAcyclicGraph } from "./directedAcyclicGraph";

describe("validateDirectedAcyclicGraph", () => {
  it("accepts an empty graph", () => {
    expect(() => {
      validateDirectedAcyclicGraph([]);
    }).not.toThrow();
  });

  it("accepts a diamond dependency graph", () => {
    expect(() => {
      validateDirectedAcyclicGraph([
        { name: "lint" },
        { name: "type-check" },
        { name: "prettier", dependsOn: ["lint", "type-check"] },
      ]);
    }).not.toThrow();
  });

  it("accepts a longer dependency chain", () => {
    expect(() => {
      validateDirectedAcyclicGraph([
        { name: "prepare" },
        { name: "lint", dependsOn: ["prepare"] },
        { name: "test", dependsOn: ["lint"] },
        { name: "release", dependsOn: ["test"] },
      ]);
    }).not.toThrow();
  });

  it("accepts multiple root nodes with independent branches", () => {
    expect(() => {
      validateDirectedAcyclicGraph([
        { name: "lint" },
        { name: "type-check" },
        { name: "unit-test", dependsOn: ["lint"] },
        { name: "build", dependsOn: ["type-check"] },
      ]);
    }).not.toThrow();
  });

  it("throws when node names are duplicated", () => {
    expect(() => {
      validateDirectedAcyclicGraph([
        { name: "a" },
        { name: "b" },
        { name: "a" },
        { name: "b" },
      ]);
    }).toThrowError(/duplicate node names: a, b/i);
  });

  it("throws when a dependency references an unknown node", () => {
    expect(() => {
      validateDirectedAcyclicGraph([{ name: "lint", dependsOn: ["format"] }]);
    }).toThrowError(/depends on unknown node/i);
  });

  it("throws when dependencies form a cycle", () => {
    expect(() => {
      validateDirectedAcyclicGraph([
        { name: "a", dependsOn: ["b"] },
        { name: "b", dependsOn: ["a"] },
      ]);
    }).toThrowError(/cycle detected/i);
  });
});
