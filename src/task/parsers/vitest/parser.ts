import { type ParsedFailure } from "../../types";

export const parseVitest = (output: string): ParsedFailure | undefined => {
  const normalized = output.replace(/\s+/g, " ");
  const suiteFailures = normalized.match(/Failed Suites (\d+)/i);

  if (suiteFailures) {
    const suiteCount = Number(suiteFailures[1]);
    if (Number.isFinite(suiteCount) && suiteCount !== 0) {
      return {
        message: `Failed - ${suiteCount} suite${suiteCount === 1 ? "" : "s"} failed`,
        errors: suiteCount,
      };
    }
  }

  const fileFailures = normalized.match(/Test Files (\d+) failed/i);
  const testFailures = normalized.match(/Tests (\d+) failed/i);

  const fileCount = Number(fileFailures?.[1] ?? 0);
  const testCount = Number(testFailures?.[1] ?? 0);
  const totalFailures = fileCount + testCount;

  if (!Number.isFinite(totalFailures) || totalFailures === 0) {
    return undefined;
  }

  const testPart = testFailures
    ? `${testCount} test${testCount === 1 ? "" : "s"} failed`
    : "";
  const filePart = fileFailures
    ? `${fileCount} file${fileCount === 1 ? "" : "s"}`
    : "";
  const messageBody =
    testPart && filePart ? `${testPart} in ${filePart}` : testPart;

  return {
    message: `Failed - ${messageBody}`,
    errors: totalFailures || 1,
  };
};
