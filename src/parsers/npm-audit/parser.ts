import { type ParsedFailure } from "parsers/types";

import { registerParser } from "../registry";

const parseNpmAudit = (output: string): ParsedFailure | undefined => {
  const summaryRegex =
    /(?:found\s+)?(\d+)\s+vulnerabilities?(?:\s+\(([^)]+)\))?/gi;
  const summary = summaryRegex.exec(output);

  if (summary) {
    const total = Number(summary[1]);
    if (!Number.isFinite(total) || total === 0) {
      return undefined;
    }

    const breakdown = summary[2]
      .split(/,\s*/)
      .map((part) => part.trim())
      .filter(Boolean);
    const detail = breakdown.length > 0 ? ` (${breakdown.join(", ")})` : "";

    return {
      message: `Failed - ${total} vulnerabilit${
        total === 1 ? "y" : "ies"
      }${detail}`,
      errors: total,
    };
  }

  if (/0\s+vulnerabilities?/i.test(output)) {
    return undefined;
  }

  if (/npm err!/i.test(output) || /vulnerabilit/i.test(output)) {
    return { message: "Failed - vulnerabilities detected", errors: 1 };
  }

  return undefined;
};

registerParser("npm audit", parseNpmAudit);
