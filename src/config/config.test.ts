import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { loadUserConfig } from "../config";
import { type RunOptions } from "../runOptions/types";
import { defaultTools } from "../task";

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
    isNoColor: false,
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

  it("uses parallel executionMode by default", async () => {
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

    const config = await loadUserConfig(makeRunOptions());

    expect(config?.executionMode).toBe("parallel");

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

  it("throws when config exports a function with task-like properties", async () => {
    const directory = withTempDir(`
      const config = () => undefined;
      config.tasks = [
        {
          tool: "Prettier",
          command: "npm run prettier"
        }
      ];
      module.exports = config;
    `);

    await expect(loadUserConfig(makeRunOptions())).rejects.toThrowError(
      /invalid is-it-ready config/i
    );

    cleanupDir(directory);
  });

  it("accepts unknown tools and configures them for exit-code-only mode", async () => {
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

    const config = await loadUserConfig(makeRunOptions());

    expect(config).not.toBeNull();
    expect(config?.unsupportedTools).toEqual(["Unknown"]);
    expect(config?.tasks).toHaveLength(1);
    expect(config?.tasks[0]?.label).toBe("Unknown");
    expect(config?.tasks[0]?.tool).toBe("Unknown");
    expect(config?.tasks[0]?.command).toBe("npm run foo");
    expect(config?.tasks[0]?.usesExitCodeOnly).toBe(true);
    expect(config?.tasks[0]?.parseFailure("some output")).toBeUndefined();

    cleanupDir(directory);
  });

  it("deduplicates unsupported tool warnings across multiple tasks", async () => {
    const directory = withTempDir(`
      module.exports = {
        tasks: [
          {
            tool: "Unknown",
            command: "npm run foo"
          },
          {
            tool: "Prettier",
            command: "npm run prettier"
          },
          {
            tool: "Unknown",
            command: "npm run foo:again"
          },
          {
            tool: "Another",
            command: "npm run bar"
          }
        ]
      };
    `);

    const config = await loadUserConfig(makeRunOptions());

    expect(config).not.toBeNull();
    expect(config?.unsupportedTools).toEqual(["Unknown", "Another"]);

    cleanupDir(directory);
  });

  it("loads the sequential executionMode when configured", async () => {
    const directory = withTempDir(`
      module.exports = {
        executionMode: "sequential",
        tasks: [
          {
            tool: "Prettier",
            command: "npm run prettier"
          }
        ]
      };
    `);

    const config = await loadUserConfig(makeRunOptions());

    expect(config?.executionMode).toBe("sequential");

    cleanupDir(directory);
  });

  it("loads the parallel executionMode when configured explicitly", async () => {
    const directory = withTempDir(`
      module.exports = {
        executionMode: "parallel",
        tasks: [
          {
            tool: "Prettier",
            command: "npm run prettier"
          }
        ]
      };
    `);

    const config = await loadUserConfig(makeRunOptions());

    expect(config?.executionMode).toBe("parallel");

    cleanupDir(directory);
  });

  it("throws when executionMode is not a supported value", async () => {
    const directory = withTempDir(`
      module.exports = {
        executionMode: "serial",
        tasks: [
          {
            tool: "Prettier",
            command: "npm run prettier"
          }
        ]
      };
    `);

    await expect(loadUserConfig(makeRunOptions())).rejects.toThrowError(
      /invalid is-it-ready config/i
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

  it("loads configuration from a .cjs file", async () => {
    const directory = withTempDir(
      `
        module.exports = {
          tasks: [
            {
              tool: "Prettier",
              command: "npm run prettier"
            }
          ]
        };
      `,
      ".is-it-ready.config.cjs"
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
    expect(task?.label).toBe(defaultTools[0]?.label);
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

  it("throws when watchIgnore includes empty patterns", async () => {
    const directory = withTempDir(`
      module.exports = {
        watchIgnore: ["dist/**", ""],
        tasks: [
          {
            tool: "Prettier",
            command: "npm run prettier"
          }
        ]
      };
    `);

    await expect(loadUserConfig(makeRunOptions())).rejects.toThrowError(
      /invalid is-it-ready config/i
    );

    cleanupDir(directory);
  });

  it("throws when a task tool is blank after trimming", async () => {
    const directory = withTempDir(`
      module.exports = {
        tasks: [
          {
            tool: "   ",
            command: "npm run prettier"
          }
        ]
      };
    `);

    await expect(loadUserConfig(makeRunOptions())).rejects.toThrowError(
      /invalid is-it-ready config/i
    );

    cleanupDir(directory);
  });

  it("throws when a task command is blank after trimming", async () => {
    const directory = withTempDir(`
      module.exports = {
        tasks: [
          {
            tool: "Prettier",
            command: "   "
          }
        ]
      };
    `);

    await expect(loadUserConfig(makeRunOptions())).rejects.toThrowError(
      /invalid is-it-ready config/i
    );

    cleanupDir(directory);
  });

  it("throws when a task tool is not a string", async () => {
    const directory = withTempDir(`
      module.exports = {
        tasks: [
          {
            tool: 123,
            command: "npm run prettier"
          }
        ]
      };
    `);

    await expect(loadUserConfig(makeRunOptions())).rejects.toThrowError(
      /invalid is-it-ready config/i
    );

    cleanupDir(directory);
  });

  it("throws when tasks include non-object entries", async () => {
    const directory = withTempDir(`
      module.exports = {
        tasks: [null]
      };
    `);

    await expect(loadUserConfig(makeRunOptions())).rejects.toThrowError(
      /invalid is-it-ready config/i
    );

    cleanupDir(directory);
  });

  it("throws when at least one task entry is invalid", async () => {
    const directory = withTempDir(`
      module.exports = {
        tasks: [
          {
            tool: "Prettier",
            command: "npm run prettier"
          },
          {
            tool: "Prettier",
            command: "   "
          }
        ]
      };
    `);

    await expect(loadUserConfig(makeRunOptions())).rejects.toThrowError(
      /invalid is-it-ready config/i
    );

    cleanupDir(directory);
  });

  it("throws when a task fixCommand is blank after trimming", async () => {
    const directory = withTempDir(`
      module.exports = {
        tasks: [
          {
            tool: "Prettier",
            command: "npm run prettier",
            fixCommand: "   "
          }
        ]
      };
    `);

    await expect(loadUserConfig(makeRunOptions())).rejects.toThrowError(
      /invalid is-it-ready config/i
    );

    cleanupDir(directory);
  });

  it("loads config from package.json is-it-ready field", async () => {
    const directory = withTempDir(
      JSON.stringify(
        {
          name: "fixture",
          version: "1.0.0",
          "is-it-ready": {
            tasks: [{ tool: "Prettier", command: "npm run prettier" }],
          },
        },
        null,
        2
      ),
      "package.json"
    );

    const config = await loadUserConfig(makeRunOptions());

    expect(config).not.toBeNull();
    expect(config?.tasks).toHaveLength(1);
    expect(config?.tasks[0]?.tool).toBe("Prettier");

    cleanupDir(directory);
  });
});

describe("loadUserConfig (mocked loader errors)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("rethrows non-ENOENT loader errors", async () => {
    const loadMock = vi.fn(() => {
      throw new Error("boom");
    });

    vi.doMock("cosmiconfig", () => {
      return {
        cosmiconfig: () => {
          return {
            load: loadMock,
            search: vi.fn(),
          };
        },
      };
    });
    vi.doMock("is-installed-globally", () => {
      return { __esModule: true, default: false };
    });

    const { loadUserConfig: loadUserConfigWithMocks } =
      await import("./config");

    await expect(
      loadUserConfigWithMocks(
        makeRunOptions({ configPath: "custom.config.js" })
      )
    ).rejects.toThrowError(/boom/i);
  });

  it("maps ENOENT loader errors to a helpful missing-file message", async () => {
    const loadMock = vi.fn(() => {
      const error = new Error("missing file") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      throw error;
    });

    vi.doMock("cosmiconfig", () => {
      return {
        cosmiconfig: () => {
          return {
            load: loadMock,
            search: vi.fn(),
          };
        },
      };
    });
    vi.doMock("is-installed-globally", () => {
      return { __esModule: true, default: false };
    });

    const { loadUserConfig: loadUserConfigWithMocks } =
      await import("./config");

    await expect(
      loadUserConfigWithMocks(
        makeRunOptions({ configPath: "missing.config.js" })
      )
    ).rejects.toThrowError(/config file not found/i);
  });

  it("returns null when explicit loader resolves to null", async () => {
    const loadMock = vi.fn().mockResolvedValue(null);

    vi.doMock("cosmiconfig", () => {
      return {
        cosmiconfig: () => {
          return {
            load: loadMock,
            search: vi.fn(),
          };
        },
      };
    });
    vi.doMock("is-installed-globally", () => {
      return { __esModule: true, default: false };
    });

    const { loadUserConfig: loadUserConfigWithMocks } =
      await import("./config");

    await expect(
      loadUserConfigWithMocks(
        makeRunOptions({ configPath: "custom.config.js" })
      )
    ).resolves.toBeNull();
  });

  it("passes stopDir when running as a global install", async () => {
    const cosmiconfigMock = vi.fn(() => {
      return {
        load: vi.fn().mockResolvedValue(null),
        search: vi.fn().mockResolvedValue(null),
      };
    });

    vi.doMock("cosmiconfig", () => {
      return {
        cosmiconfig: cosmiconfigMock,
      };
    });
    vi.doMock("is-installed-globally", () => {
      return { __esModule: true, default: true };
    });

    const { loadUserConfig: loadUserConfigWithMocks } =
      await import("./config");

    await expect(loadUserConfigWithMocks(makeRunOptions())).resolves.toBeNull();
    expect(cosmiconfigMock).toHaveBeenCalledWith(
      "is-it-ready",
      expect.objectContaining({ stopDir: os.homedir() })
    );
  });
});
