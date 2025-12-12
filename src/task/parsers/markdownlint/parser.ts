import { type ParsedFailure } from "../../types";

export const parseMarkdownLint = (
  output: string
): ParsedFailure | undefined => {
  const summaryMatch = /Summary:\s*(\d+)\s*error\(s\)/i.exec(output);

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
