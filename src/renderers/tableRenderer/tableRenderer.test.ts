import { describe, expect, it, vi } from "vitest";

import { type Task } from "../../task";

import {
  getDisplayWidth,
  isFullWidthCodePoint,
  padCell,
  renderBorder,
  renderRow,
  renderTable,
} from "./tableRenderer";

describe("renderBorder", () => {
  it("renders top border with provided widths", () => {
    const result = renderBorder([2, 3], "top");
    expect(result).toBe("┌────┬─────┐");
  });

  it("renders bottom border with provided widths", () => {
    const result = renderBorder([3, 2], "bottom");
    expect(result).toBe("└─────┴────┘");
  });
});

describe("renderRow", () => {
  it("pads cells according to column widths", () => {
    const row = renderRow(["A", "B"], [3, 2]);
    expect(row).toBe("│ A   │ B  │");
  });
});

describe("padCell", () => {
  it("pads strings shorter than column width", () => {
    expect(padCell("Hi", 4)).toBe("Hi  ");
  });

  it("returns string unchanged when width already met", () => {
    expect(padCell("Hello", 3)).toBe("Hello");
  });

  it("returns string unchanged when width exactly matches", () => {
    expect(padCell("Hi", 2)).toBe("Hi");
  });
});

describe("getDisplayWidth", () => {
  it("returns zero for empty strings", () => {
    expect(getDisplayWidth("")).toBe(0);
  });

  it("counts ASCII characters as single width", () => {
    expect(getDisplayWidth("abc")).toBe(3);
  });

  it("counts emoji as double width", () => {
    expect(getDisplayWidth("✅")).toBe(2);
  });

  it("falls back when Intl.Segmenter is unavailable", () => {
    vi.stubGlobal("Intl", undefined);

    expect(getDisplayWidth("abc")).toBe(3);

    vi.unstubAllGlobals();
  });
});

describe("isFullWidthCodePoint", () => {
  it("returns true for known full-width code point", () => {
    expect(isFullWidthCodePoint(0x1100)).toBe(true);
  });

  it("returns false for undefined or ASCII code points", () => {
    expect(isFullWidthCodePoint(undefined)).toBe(false);
    expect(isFullWidthCodePoint(0x41)).toBe(false);
  });

  it("excludes U+303F from full-width code points", () => {
    expect(isFullWidthCodePoint(0x303f)).toBe(false);
  });
});

describe("renderTable", () => {
  const createTask = ({
    label,
    tool,
    state,
    message,
    duration,
  }: {
    label: string;
    tool: string;
    state: "pending" | "running" | "success" | "failure";
    message: string;
    duration: number | null;
  }) => {
    return {
      label,
      tool,
      getStatus: () => {
        return { state, message };
      },
      getDuration: () => {
        return duration;
      },
    } as unknown as Task;
  };

  it("renders rows and a footer section", () => {
    const table = renderTable(
      [
        createTask({
          label: "Lint",
          tool: "ESLint",
          state: "success",
          message: "OK",
          duration: 120,
        }),
      ],
      ["✅ Overall", "", "0 issues", "120 ms"]
    );

    expect(table).toContain("Label");
    expect(table).toContain("Tool");
    expect(table).toContain("Results");
    expect(table).toContain("Time");
    expect(table).toContain("✅ Lint");
    expect(table).toContain("OK");
    expect(table).toContain("120 ms");
    expect(table).toContain("✅ Overall");
  });

  it("renders an empty results cell for pending tasks", () => {
    const table = renderTable([
      createTask({
        label: "Tests",
        tool: "Vitest",
        state: "pending",
        message: "should-not-print",
        duration: null,
      }),
    ]);

    expect(table).toContain("  Tests");
    expect(table).not.toContain("should-not-print");
  });
});
