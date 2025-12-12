import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { type RunOptions } from "@/runOptions/types";

import { taskConfig } from "../task";
import { loadUserConfig } from "./userConfig";

const withTempDir = (
  contents?: string,
  filename = ".is-it-ready.config.js"
) => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "is-it-ready-"));

  if (contents !== undefined) {
    writeFileSync(path.join(tempDir, filename), contents, "utf-8");
  }

  vi.spyOn(process, "cwd").mockReturnValue(tempDir);

  return tempDir;
};

const cleanupDir = (directory: string) => {
  rmSync(directory, { recursive: true, force: true });
};

const makeRunOptions = (overrides: Partial<RunOptions> = {}): RunOptions => {
  return {
    isFixMode: false,
    isLooseMode: false,
    isSilentMode: false,
    ...overrides,
  };
};

describe("loadUserConfigTasks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when no config file exists", async () => {
    const directory = withTempDir();

    const result = await loadUserConfig(makeRunOptions());

    expect(result).toBeNull();

    cleanupDir(directory);
  });

  it("returns null when the config file does not export default", async () => {
    const directory = withTempDir("module.exports = undefined;");

    const result = await loadUserConfig(makeRunOptions());

    expect(result).toBeNull();

    cleanupDir(directory);
  });

  it("throws when the config shape is invalid", async () => {
    const directory = withTempDir(`
      module.exports = {
        tasks: {}
      };
    `);

    await expect(loadUserConfig(makeRunOptions())).rejects.toThrowError(
      /invalid is-it-ready config/i
    );

    cleanupDir(directory);
  });

  it("throws when the tool referenced does not exist", async () => {
    const directory = withTempDir(`
      module.exports = {
        tasks: [
          {
            tool: "Unknown",
            command: "npm run foo"
          }
        ]
      };
    `);

    await expect(loadUserConfig(makeRunOptions())).rejects.toThrowError(
      /unknown tool/i
    );

    cleanupDir(directory);
  });

  it("loads configuration from an .mjs file with ESM syntax", async () => {
    const directory = withTempDir(
      `
        export default {
          tasks: [
            {
              tool: "Prettier",
              command: "npm run prettier"
            }
          ]
        };
      `,
      ".is-it-ready.config.mjs"
    );

    const tasks = await loadUserConfig(makeRunOptions());

    expect(tasks).not.toBeNull();
    expect(tasks).toHaveLength(1);
    expect(tasks?.[0]?.tool).toBe("Prettier");

    cleanupDir(directory);
  });

  it("creates tasks by merging defaults with user overrides", async () => {
    const directory = withTempDir(`
      module.exports = {
        tasks: [
          {
            tool: "Prettier",
            command: "npm run prettier:custom",
            fixCommand: "npm run prettier:fix"
          }
        ]
      };
    `);

    const tasks = await loadUserConfig(makeRunOptions());

    expect(tasks).not.toBeNull();
    expect(tasks).toHaveLength(1);
    const task = tasks?.[0];
    expect(task?.label).toBe(taskConfig[0]?.label);
    expect(task?.tool).toBe("Prettier");
    expect(task?.command).toBe("npm run prettier:custom");

    cleanupDir(directory);
  });

  it("uses override commands when fix mode is enabled", async () => {
    const directory = withTempDir(`
      module.exports = {
        tasks: [
          {
            tool: "Prettier",
            command: "npm run prettier",
            fixCommand: "npm run prettier:override-fix"
          }
        ]
      };
    `);

    const tasks = await loadUserConfig(makeRunOptions({ isFixMode: true }));

    expect(tasks).not.toBeNull();
    expect(tasks?.[0]?.command).toBe("npm run prettier:override-fix");
    expect(tasks?.[0]?.label).toBe("Formatting*");

    cleanupDir(directory);
  });

  it("does not fall back to default fix command when override not provided", async () => {
    const directory = withTempDir(`
      module.exports = {
        tasks: [
          {
            tool: "ESLint",
            command: "npm run lint"
          }
        ]
      };
    `);

    const tasks = await loadUserConfig(makeRunOptions({ isFixMode: true }));

    expect(tasks).not.toBeNull();
    expect(tasks?.[0]?.command).toBe("npm run lint");

    cleanupDir(directory);
  });
});
