import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { type RunOptions } from "@/runOptions/types";

import { taskConfig } from "../task";
import { loadUserConfig } from "./config";

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
    isSilentMode: false,
    isWatchMode: false,
    configPath: undefined,
    ...overrides,
  };
};

describe("loadUserConfig", () => {
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

    const config = await loadUserConfig(makeRunOptions());

    expect(config).not.toBeNull();
    expect(config?.tasks).toHaveLength(1);
    expect(config?.tasks[0]?.tool).toBe("Prettier");

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

    const config = await loadUserConfig(makeRunOptions());

    expect(config).not.toBeNull();
    expect(config?.tasks).toHaveLength(1);
    const task = config?.tasks[0];
    expect(task?.label).toBe(taskConfig[0]?.label);
    expect(task?.tool).toBe("Prettier");
    expect(task?.command).toBe("npm run prettier:custom");

    cleanupDir(directory);
  });

  it("loads configuration from a custom path when provided via run options", async () => {
    const filename = "custom.config.mjs";
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
      filename
    );

    const config = await loadUserConfig(
      makeRunOptions({ configPath: filename })
    );

    expect(config).not.toBeNull();
    expect(config?.tasks).toHaveLength(1);
    expect(config?.tasks[0]?.tool).toBe("Prettier");

    cleanupDir(directory);
  });

  it("throws a helpful error when the provided config path does not exist", async () => {
    const directory = withTempDir();

    await expect(
      loadUserConfig(makeRunOptions({ configPath: "missing.config.js" }))
    ).rejects.toThrowError(/config file not found/i);

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

    const config = await loadUserConfig(makeRunOptions({ isFixMode: true }));

    expect(config).not.toBeNull();
    expect(config?.tasks[0]?.command).toBe("npm run prettier:override-fix");
    expect(config?.tasks[0]?.label).toBe("Formatting*");

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

    const config = await loadUserConfig(makeRunOptions({ isFixMode: true }));

    expect(config).not.toBeNull();
    expect(config?.tasks[0]?.command).toBe("npm run lint");

    cleanupDir(directory);
  });

  it("loads project configuration when installed globally", async () => {
    vi.resetModules();

    vi.doMock("is-installed-globally", () => {
      return { __esModule: true, default: true };
    });

    const directory = withTempDir(`
      module.exports = {
        tasks: [
          {
            tool: "Prettier",
            command: "npm run prettier"
          }
        ]
      };
    `);

    const { loadUserConfig: loadUserConfigWhenGlobal } =
      await import("./config");

    const config = await loadUserConfigWhenGlobal(makeRunOptions());

    expect(config).not.toBeNull();
    expect(config?.tasks[0]?.tool).toBe("Prettier");

    cleanupDir(directory);
    vi.resetModules();
  });

  it("includes watchIgnore patterns from user config", async () => {
    const directory = withTempDir(`
      module.exports = {
        watchIgnore: ["dist/**", "build/**"],
        tasks: [
          {
            tool: "Prettier",
            command: "npm run prettier"
          }
        ]
      };
    `);

    const config = await loadUserConfig(makeRunOptions());

    expect(config).not.toBeNull();
    expect(config?.watchIgnore).toEqual(["dist/**", "build/**"]);

    cleanupDir(directory);
  });
});
