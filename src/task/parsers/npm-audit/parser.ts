import { type ParsedFailure } from "../../types";

export const parseNpmAudit = (output: string): ParsedFailure | undefined => {
  const normalized = output.replace(/\s+/g, " ");
  const severitySummary =
    /(\d+) ([a-z]+) severity vulnerabilit(?:y|ies)/i.exec(normalized);
  if (severitySummary) {
    const total = Number(severitySummary[1]);
    if (!Number.isFinite(total) || !total) {
      return undefined;
    }

    const severity = severitySummary[2];
    return {
      message: `Failed - ${total} ${
        total === 1 ? "vulnerability" : "vulnerabilities"
      } (${total} ${severity})`,
      errors: total,
    };
  }

  const summaryRegex =
    /(?:found )?(\d+) (?:vulnerability|vulnerabilities)(?: \(([^)]+)\))?/i;
  const summary = summaryRegex.exec(normalized);

  if (summary) {
    const total = Number(summary[1]);
    if (!Number.isFinite(total) || !total) {
      return undefined;
    }

    const rawBreakdown = summary.at(2) ?? "";
    const breakdown = rawBreakdown
      .split(",")
      .map((part) => {
        return part.trim();
      })
      .filter(Boolean);
    const detail = breakdown.length > 0 ? ` (${breakdown.join(", ")})` : "";

    return {
      message: `Failed - ${total} ${
        total === 1 ? "vulnerability" : "vulnerabilities"
      }${detail}`,
      errors: total,
    };
  }

  if (
    /npm err!/i.test(normalized) ||
    /(?:vulnerability|vulnerabilities)/i.test(normalized)
  ) {
    return { message: "Failed - vulnerabilities detected", errors: 1 };
  }

  return undefined;
};
