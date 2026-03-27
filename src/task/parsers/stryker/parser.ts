import { type ParsedFailure } from "../../types";

export const parseStryker = (output: string): ParsedFailure | undefined => {
  // Stryker disable next-line Regex
  const pattern = /\d+\/\d+ (?:Mutants )?tested \(([^)]+)\)/g;
  let match: RegExpExecArray | null = null;
  let current: RegExpExecArray | null;
  while ((current = pattern.exec(output)) !== null) {
    match = current;
  }

  if (!match) {
    return undefined;
  }

  const details = match[1];
  const survivedMatch = details.match(/(\d+) survived/);
  const timedOutMatch = details.match(/(\d+) timed out/);

  const survived = survivedMatch ? Number.parseInt(survivedMatch[1], 10) : 0;
  const timedOut = timedOutMatch ? Number.parseInt(timedOutMatch[1], 10) : 0;
  const totalIssues = survived + timedOut;

  if (totalIssues === 0) {
    return undefined;
  }

  return {
    message: `Failed - ${totalIssues} issue${totalIssues === 1 ? "" : "s"}`,
    errors: totalIssues,
  };
};
