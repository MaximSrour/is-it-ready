import chalk from "chalk";
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

  it("does not pad when display width equals target width", () => {
    expect(padCell("✅", 2)).toBe("✅");
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

  it("counts full-width CJK characters as double width", () => {
    expect(getDisplayWidth("漢")).toBe(2);
  });

  it("falls back when Intl.Segmenter is unavailable", () => {
    vi.stubGlobal("Intl", undefined);

    expect(getDisplayWidth("abc")).toBe(3);

    vi.unstubAllGlobals();
  });

  it("returns zero for undefined-like input", () => {
    expect(getDisplayWidth(undefined as unknown as string)).toBe(0);
  });

  it("uses grapheme granularity when segmenter is available", () => {
    const originalIntl = globalThis.Intl;
    let granularity: string | undefined;
    vi.stubGlobal("Intl", {
      Segmenter: class {
        constructor(
          _locale: string | undefined,
          options: { granularity: string }
        ) {
          granularity = options.granularity;
        }

        segment(value: string) {
          return Array.from(value).map((segment) => {
            return { segment };
          });
        }
      },
    });

    getDisplayWidth("abc");
    expect(granularity).toBe("grapheme");

    vi.stubGlobal("Intl", originalIntl);
  });
});

describe("isFullWidthCodePoint", () => {
  it("returns true for known full-width code point", () => {
    expect(isFullWidthCodePoint(0x1100)).toBe(true);
  });

  it("returns false for undefined or ASCII code points", () => {
    expect(isFullWidthCodePoint(0)).toBe(false);
    expect(isFullWidthCodePoint(0x41)).toBe(false);
  });

  it("excludes U+303F from full-width code points", () => {
    expect(isFullWidthCodePoint(0x303f)).toBe(false);
  });

  it("covers full-width range boundaries", () => {
    const inRange = [
      0x1100, 0x115f, 0x2329, 0x232a, 0x2e80, 0x3247, 0x3250, 0x4dbf, 0x4e00,
      0xa4c6, 0xa960, 0xa97c, 0xac00, 0xd7a3, 0xf900, 0xfaff, 0xfe10, 0xfe19,
      0xfe30, 0xfe6b, 0xff01, 0xff60, 0xffe0, 0xffe6, 0x1b000, 0x1b001, 0x1f200,
      0x1f251, 0x20000, 0x3fffd,
    ];
    inRange.forEach((codePoint) => {
      expect(isFullWidthCodePoint(codePoint)).toBe(true);
    });
  });

  it("rejects values just outside full-width boundaries", () => {
    const outOfRange = [
      0x10ff, 0x1160, 0x2e7f, 0x3248, 0x324f, 0x4dc0, 0x4dff, 0xa4c7, 0xa95f,
      0xa97d, 0xabff, 0xd7a4, 0xf8ff, 0xfb00, 0xfe0f, 0xfe1a, 0xfe2f, 0xfe6c,
      0xff00, 0xff61, 0xffdf, 0xffe7, 0x1afff, 0x1b002, 0x1f1ff, 0x1f252,
      0x1ffff, 0x3fffe,
    ];
    outOfRange.forEach((codePoint) => {
      expect(isFullWidthCodePoint(codePoint)).toBe(false);
    });
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

  it("uses footer values when they define the widest column", () => {
    const table = renderTable(
      [
        createTask({
          label: "Lint",
          tool: "ESLint",
          state: "success",
          message: "OK",
          duration: 1,
        }),
      ],
      ["Overall", "Tool", "This footer text is deliberately very long", "1 ms"]
    );

    const [topBorder] = table.split("\n");
    expect(topBorder).toContain("────────────────────────────────────────────");
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
    expect(table).not.toContain("Stryker was here!");
  });

  it("handles rows and footer cells with missing columns", () => {
    const tableWithMissingColumns = renderTable(
      [
        createTask({
          label: "OnlyLabel",
          tool: "ToolX",
          state: "success",
          message: "OK",
          duration: 1,
        }),
      ],
      ["summary only"]
    );
    const tableWithExplicitEmpties = renderTable(
      [
        createTask({
          label: "OnlyLabel",
          tool: "ToolX",
          state: "success",
          message: "OK",
          duration: 1,
        }),
      ],
      ["summary only", "", "", ""]
    );

    expect(tableWithMissingColumns).toContain("summary only");
    expect(tableWithMissingColumns).toContain("OnlyLabel");
    expect(tableWithMissingColumns).toContain("ToolX");

    const [missingTopBorder] = tableWithMissingColumns.split("\n");
    const [explicitTopBorder] = tableWithExplicitEmpties.split("\n");
    expect(missingTopBorder).toBe(explicitTopBorder);
  });

  it("keeps table rows separated by new lines", () => {
    const table = renderTable([
      createTask({
        label: "A",
        tool: "T1",
        state: "success",
        message: "ok",
        duration: 1,
      }),
      createTask({
        label: "B",
        tool: "T2",
        state: "success",
        message: "ok",
        duration: 2,
      }),
    ]);

    const lines = table.split("\n");
    expect(lines.length).toBeGreaterThan(5);
  });

  it("renders no footer section when footer is not provided", () => {
    const table = renderTable([
      createTask({
        label: "Lint",
        tool: "ESLint",
        state: "success",
        message: "OK",
        duration: 10,
      }),
    ]);

    expect(table).not.toContain("Stryker was here!");
    expect(table.match(/├/g)?.length ?? 0).toBe(1);
  });

  it("renders deterministic table layout for a pending task", () => {
    chalk.level = 0;

    const table = renderTable([
      createTask({
        label: "Tests",
        tool: "Vitest",
        state: "pending",
        message: "",
        duration: null,
      }),
    ]);

    expect(table).toBe(
      [
        "┌──────────┬────────┬─────────┬──────┐",
        "│ Label    │ Tool   │ Results │ Time │",
        "├──────────┼────────┼─────────┼──────┤",
        "│    Tests │ Vitest │         │      │",
        "└──────────┴────────┴─────────┴──────┘",
      ].join("\n")
    );
  });
});
