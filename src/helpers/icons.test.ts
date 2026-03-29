import { describe, expect, it } from "vitest";

import { taskStateIcons } from "./icons";

describe("taskStateIcons", () => {
  it("maps every task state to the expected icon", () => {
    expect(taskStateIcons).toEqual({
      pending: "  ",
      running: "⏳",
      success: "🟢",
      failure: "🔴",
      cancelled: "⭕️",
    });
  });
});
