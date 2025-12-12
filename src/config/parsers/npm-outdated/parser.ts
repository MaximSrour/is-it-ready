import { type ParsedFailure } from "../../types";

const headerRegex = /^package\s+current\s+wanted\s+latest/i;
const rowRegex = /^(\S+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/i;

export const parseNpmOutdated = (output: string): ParsedFailure | undefined => {
  if (!output.trim()) {
    return undefined;
  }

  const lines = output
    .split(/\r?\n/)
    .map((line) => {
      return line.trim();
    })
    .filter((line) => {
      return line.length > 0;
    });

  if (lines.length === 0) {
    return undefined;
  }

  const headerIndex = lines.findIndex((line) => {
    return headerRegex.test(line);
  });
  const dataLines = headerIndex >= 0 ? lines.slice(headerIndex + 1) : lines;

  const { outdatedPackages, pinnedPackages } = dataLines.reduce<{
    outdatedPackages: string[];
    pinnedPackages: string[];
  }>(
    (acc, line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        return acc;
      }

      if (/^npm\s+/i.test(trimmedLine)) {
        return acc;
      }

      const match = rowRegex.exec(trimmedLine);
      if (!match) {
        return acc;
      }

      const [, packageName, current, wanted, latest] = match;
      const latestIsUnknown = latest.toLowerCase() === "n/a";

      if (current !== wanted) {
        acc.outdatedPackages.push(packageName);
      } else if (!latestIsUnknown && wanted !== latest) {
        acc.pinnedPackages.push(packageName);
      }

      return acc;
    },
    { outdatedPackages: [], pinnedPackages: [] }
  );

  const outdatedCount = outdatedPackages.length;
  const pinnedCount = pinnedPackages.length;

  if (outdatedCount === 0 && pinnedCount === 0) {
    return undefined;
  }

  const totalIssues = outdatedCount + pinnedCount;

  return {
    message: `Failed - ${totalIssues} outdated ${totalIssues === 1 ? "package" : "packages"}`,
    errors: outdatedCount > 0 ? outdatedCount : undefined,
    warnings: pinnedCount > 0 ? pinnedCount : undefined,
  };
};
