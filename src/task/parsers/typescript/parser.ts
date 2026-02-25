import { type ParsedFailure } from "../../types";

export const parseTypeCheck = (output: string): ParsedFailure | undefined => {
  const normalized = output.replace(/\s+/g, " ");
  const summary = normalized.match(/Found (\d+) errors? in (\d+) files?/i);

  if (summary) {
    const errorCount = Number(summary[1]);
    const fileCount = Number(summary[2]);

    if (errorCount === 0) {
      return undefined;
    }

    const fileLabel = fileCount === 1 ? "file" : "files";

    return {
      message: `Failed - ${errorCount} errors in ${fileCount} ${fileLabel}`,
      errors: errorCount,
    };
  }

  const fallback = normalized.match(/Found (\d+) errors?/i);
  if (!fallback) {
    const errorLines = Array.from(
      output.matchAll(/^([^\s][^(]+)\(\d+,\d+\):\s+error\s+TS\d+:/gim)
    );

    if (errorLines.length === 0) {
      return undefined;
    }

    const files = new Set(
      errorLines.map((match) => {
        return match[1].trim();
      })
    );
    const fileCount = files.size;
    const fileLabel = fileCount === 1 ? "file" : "files";
    const errorCount = errorLines.length;

    return {
      message: `Failed - ${errorCount} errors in ${fileCount} ${fileLabel}`,
      errors: errorCount,
    };
  }

  const count = Number(fallback[1]);
  if (!Number.isFinite(count) || count === 0) {
    return undefined;
  }

  return {
    message: `Failed - ${count} errors`,
    errors: count,
  };
};
