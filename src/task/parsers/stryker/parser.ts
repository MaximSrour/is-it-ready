import { type ParsedFailure } from "../../types";

const expectedColumnCount = 9;
const firstIssueColumnIndex = 4;
const lastIssueColumnIndex = 7;

export const parseStryker = (output: string): ParsedFailure | undefined => {
  const summaryLine = output.split("\n").find((line) => {
    const columns = line.split("|").map((value) => {
      return value.trim();
    });

    return columns[0] === "All files";
  });

  if (!summaryLine) {
    return undefined;
  }

  const columns = summaryLine.split("|");

  if (columns.length !== expectedColumnCount) {
    return undefined;
  }

  const issueColumns = columns.slice(
    firstIssueColumnIndex,
    lastIssueColumnIndex + 1
  );
  const issueCounts = issueColumns.map((value) => {
    return Number.parseInt(value, 10);
  });

  if (
    issueCounts.some((value) => {
      return Number.isNaN(value);
    })
  ) {
    return undefined;
  }

  const totalIssues = issueCounts.reduce((total, value) => {
    return total + value;
  }, 0);

  if (totalIssues === 0) {
    return undefined;
  }

  return {
    message: `Failed - ${totalIssues} issue${totalIssues === 1 ? "" : "s"}`,
    errors: totalIssues,
  };
};
