import { describe, expect, it } from "vitest";

import { defaultTools } from "./defaultTools";
import {
  parseCSpell,
  parseEslint,
  parseKnip,
  parseMarkdownLint,
  parseNpmAudit,
  parsePrettier,
  parseTypeCheck,
  parseVitest,
} from "./parsers";

describe("defaultTools", () => {
  it("defines the expected default tools and parser bindings", () => {
    expect(defaultTools).toEqual([
      {
        label: "Formatting",
        tool: "Prettier",
        parseFailure: parsePrettier,
      },
      {
        label: "Linting",
        tool: "ESLint",
        parseFailure: parseEslint,
      },
      {
        label: "MD Linting",
        tool: "MarkdownLint",
        parseFailure: parseMarkdownLint,
      },
      {
        label: "Spell Checking",
        tool: "CSpell",
        parseFailure: parseCSpell,
      },
      {
        label: "Type Checking",
        tool: "TypeScript",
        parseFailure: parseTypeCheck,
      },
      {
        label: "Tests",
        tool: "Vitest",
        parseFailure: parseVitest,
      },
      {
        label: "Inventory",
        tool: "Knip",
        parseFailure: parseKnip,
      },
      {
        label: "Package Health",
        tool: "npm audit",
        parseFailure: parseNpmAudit,
      },
    ]);
  });
});
