import { type ParsedFailure } from "../../types";

export const parseKnip = (output: string): ParsedFailure | undefined => {
  const normalized = output.replace(/\s+/g, " ");
  const sectionPattern = /\((\d+)\)/g;
  let total = 0;

  for (const match of normalized.matchAll(sectionPattern)) {
    total += Number(match[1]);
  }

  if (total === 0) {
    const match = normalized.match(/(\d+) issues?/i);
    if (match) {
      total = Number(match[1]);
    }
  }

  if (total === 0) {
    return undefined;
  }

  return {
    message: `Failed - ${total} issue${total === 1 ? "" : "s"}`,
    errors: total,
  };
};
