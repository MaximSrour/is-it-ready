import { type ParsedFailure } from "../../types";

export const parseVitest = (output: string): ParsedFailure | undefined => {
  const suiteFailures = output.match(/ Failed Suites\s+(\d+) /i);

  if (suiteFailures) {
    const suiteCount = Number(suiteFailures[1]);
    if (Number.isFinite(suiteCount) && suiteCount > 0) {
      return {
        message: `Failed - ${suiteCount} suite${suiteCount === 1 ? "" : "s"} failed`,
        errors: suiteCount,
      };
    }
  }

  const fileFailures = output.match(/Test Files\s+(\d+)\s+failed/i);
  const testFailures = output.match(/Tests\s+(\d+)\s+failed/i);

  if (!fileFailures && !testFailures) {
    return undefined;
  }

  let totalFailures = 0;
  const fileCount = Number(fileFailures?.[1] ?? 0);
  const testCount = Number(testFailures?.[1] ?? 0);

  if (Number.isFinite(fileCount)) {
    totalFailures += fileCount;
  }
  if (Number.isFinite(testCount)) {
    totalFailures += testCount;
  }

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
