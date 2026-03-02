import { type ParsedFailure } from "../../types";

export const parseCSpell = (output: string): ParsedFailure | undefined => {
  const normalized = output.replace(/\s+/g, " ");
  const summaryPattern = /issues? found: (\d+)(?: in (\d+) files?)?/i;
  const summaryMatch = normalized.match(summaryPattern);

  if (summaryMatch) {
    const issues = Number(summaryMatch[1]);
    const files = Number(summaryMatch[2]);

    if (Number.isFinite(issues) && issues > 0) {
      const filesText =
        files > 0 ? ` in ${files} file${files === 1 ? "" : "s"}` : "";

      return {
        message: `Failed - ${issues} issue${issues === 1 ? "" : "s"}${filesText}`,
        errors: issues,
      };
    }
  }

  return undefined;
};
