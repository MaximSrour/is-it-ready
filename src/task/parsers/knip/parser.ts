import { type ParsedFailure } from "~/task/types";

export const parseKnip = (output: string): ParsedFailure | undefined => {
  const sectionPattern = /\((\d+)\)/g;
  let total = 0;

  for (const match of output.matchAll(sectionPattern)) {
    const value = Number(match[1]);
    if (Number.isFinite(value) && value > 0) {
      total += value;
    }
  }

  if (total === 0) {
    const match = output.match(/(\d+)\s+issues?/i);
    if (match) {
      const fallback = Number(match[1]);
      if (Number.isFinite(fallback) && fallback > 0) {
        total = fallback;
      }
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
