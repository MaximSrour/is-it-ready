import { type ParsedFailure } from "../../types";

export const parseCSpell = (output: string): ParsedFailure | undefined => {
  const summaryPattern = /issues?\s+found:\s*(\d+)(?:\s+in\s+(\d+)\s+files?)?/i;
  const summaryMatch = output.match(summaryPattern);

  if (summaryMatch) {
    const issues = Number(summaryMatch[1]);
    const files = summaryMatch[2] ? Number(summaryMatch[2]) : undefined;

    if (Number.isFinite(issues) && issues > 0) {
      const filesText =
        files && Number.isFinite(files) && files > 0
          ? ` in ${files} file${files === 1 ? "" : "s"}`
          : "";

      return {
        message: `Failed - ${issues} issue${issues === 1 ? "" : "s"}${filesText}`,
        errors: issues,
      };
    }
  }

  return undefined;
};
