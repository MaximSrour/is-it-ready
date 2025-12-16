import chalk from "chalk";
import { beforeEach, describe, expect, it } from "vitest";

import { colorStatusMessage } from "./colorStatusMessage";

describe("colorStatusMessage", () => {
  beforeEach(() => {
    chalk.level = 1;
  });

  it("returns empty string when message missing", () => {
    expect(colorStatusMessage("", "pending")).toBe("");
  });

  it("colors message red for failure state", () => {
    expect(colorStatusMessage("Failed", "failure")).toBe(
      "\u001b[31mFailed\u001b[39m"
    );
  });

  it("leaves other states uncolored", () => {
    expect(colorStatusMessage("Working", "running")).toBe("Working");
  });
});
