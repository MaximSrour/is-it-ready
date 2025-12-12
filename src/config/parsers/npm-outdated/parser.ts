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

  const outdatedPackages = dataLines.reduce<string[]>((acc, line) => {
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

    const [, packageName, current, wanted] = match;
    if (current === wanted) {
      return acc;
    }

    acc.push(packageName);

    return acc;
  }, []);

  if (outdatedPackages.length === 0) {
    return undefined;
  }

  const packageLabel = outdatedPackages.length === 1 ? "package" : "packages";

  return {
    message: `Failed - ${outdatedPackages.length} outdated ${packageLabel}`,
    errors: outdatedPackages.length,
  };
};
