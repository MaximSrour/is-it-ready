import { type ParsedFailure } from "../../types";

export const parseEslint = (output: string): ParsedFailure | undefined => {
  const normalized = output.replace(/\s+/g, " ");
  const summary = normalized.match(
    /(\d+) problems? \((\d+) errors?(?:, (\d+) warnings?)?/i
  );

  if (!summary) {
    return undefined;
  }

  const [, total, errors, warnings] = summary;
  const errorCount = Number(errors);
  const warningCount = warnings ? Number(warnings) : 0;
  const totalProblems = Number(total);

  if (totalProblems !== errorCount + warningCount) {
    console.warn(
      `Unexpected ESLint summary totals: problems=${totalProblems}, errors=${errorCount}, warnings=${warningCount}`
    );
    return undefined;
  }

  if (errorCount === 0 && warningCount === 0) {
    return undefined;
  }

  if (errorCount === 0) {
    return {
      message: `Failed - ${warningCount} warning${
        warningCount === 1 ? "" : "s"
      }`,
      warnings: warningCount,
    };
  }

  const parts = [`${errors} errors`];

  if (warningCount > 0) {
    parts.push(`${warnings} warnings`);
  }

  return {
    message: `Failed - ${parts.join(" and ")}`,
    errors: errorCount,
    warnings: warningCount > 0 ? warningCount : undefined,
  };
};
