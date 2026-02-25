import { type ParsedFailure } from "../../types";

export const parseMarkdownLint = (
  output: string
): ParsedFailure | undefined => {
  const normalized = output.replace(/\s+/g, " ");
  const summaryMatch = /Summary: (\d+) error\(s\)/i.exec(normalized);

  if (summaryMatch) {
    const errorCount = Number(summaryMatch[1]);
    if (!Number.isFinite(errorCount) || errorCount === 0) {
      return undefined;
    }

    return {
      message: `Failed - ${errorCount} error${errorCount === 1 ? "" : "s"}`,
      errors: errorCount,
    };
  }

  return undefined;
};
