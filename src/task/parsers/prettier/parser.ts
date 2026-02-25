import { type ParsedFailure } from "../../types";

export const parsePrettier = (output: string): ParsedFailure | undefined => {
  const normalized = output.replace(/\s+/g, " ");
  const summaryPatterns = [
    /(\d+) files? (?:are|is) not formatted/i,
    /(\d+) files? with code style issues?/i,
    /Code style issues found in (\d+) files?/i,
  ];

  for (const pattern of summaryPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      return formatPrettierCount(match[1]);
    }
  }

  if (/Code style issues found in the above file/i.test(normalized)) {
    return formatPrettierCount(1);
  }

  return undefined;
};

const formatPrettierCount = (
  count: number | string
): ParsedFailure | undefined => {
  const value = Number(count);
  if (!Number.isFinite(value) || value <= 0) {
    return { message: "Failed", errors: 1 };
  }

  const label = value === 1 ? "file" : "files";

  return {
    message: `Failed - ${value} ${label} with formatting issues`,
    errors: value,
  };
};
