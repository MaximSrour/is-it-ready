import { type RunOptions } from "@/runOptions/types";

import { runCommand, selectCommand, stripAnsi } from "../helpers";
import {
  type FailureDetails,
  type ParsedFailure,
  type TaskConfig,
  type TaskStatus,
} from "./types";

export class Task {
  readonly label: string;
  readonly command: string;
  readonly tool: string;

  readonly parseFailure: (output: string) => ParsedFailure | undefined;

  private status: TaskStatus;
  private startTime: number | null = null;
  private endTime: number | null = null;
  private failures: FailureDetails[] = [];
  private totalErrors = 0;
  private totalWarnings = 0;

  constructor(config: TaskConfig, runOptions: RunOptions) {
    const executableCommand = selectCommand(config, runOptions);

    this.label = executableCommand.label;
    this.command = executableCommand.command;
    this.tool = config.tool;

    this.parseFailure = config.parseFailure;

    this.status = { state: "pending", message: "" };
  }

  async execute({
    onStart,
    onFinish,
  }: { onStart?: () => void; onFinish?: () => void } = {}) {
    this.setStatus({ state: "running", message: "Running..." });
    this.startTimer();

    this.totalErrors = 0;
    this.totalWarnings = 0;
    this.failures = [];

    onStart?.();

    try {
      const result = await runCommand(this.command);

      this.stopTimer();

      const rawCombined = [result.stdout, result.stderr]
        .filter(Boolean)
        .join("\n");
      const combined = stripAnsi(rawCombined);
      const parsedFailure = this.parseFailure(combined);

      if (result.status === 0 && !parsedFailure) {
        this.setStatus({ state: "success", message: "Passed" });
        onFinish?.();

        return;
      }

      const detail =
        parsedFailure?.message ?? "Failed - see output below for details";
      this.setStatus({ state: "failure", message: detail });

      this.failures.push({
        label: this.label,
        tool: this.tool,
        command: this.command,
        errors: parsedFailure?.errors ?? undefined,
        warnings: parsedFailure?.warnings ?? undefined,
        summary: parsedFailure?.message ?? undefined,
        output: combined.trim(),
        rawOutput: rawCombined.trim() || combined.trim(),
      });

      this.recordIssueCounts(parsedFailure);
    } catch (error) {
      this.stopTimer();

      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Failed to execute command";
      this.setStatus({ state: "failure", message });

      this.failures.push({
        label: this.label,
        tool: this.tool,
        command: this.command,
        summary: message,
        output: message,
        rawOutput: message,
      });

      this.recordIssueCounts();
    }

    onFinish?.();
  }

  private recordIssueCounts(parsedFailure?: ParsedFailure | null) {
    if (!parsedFailure) {
      this.totalErrors += 1;
      return;
    }

    const errors = parsedFailure.errors ?? 0;
    const warnings = parsedFailure.warnings ?? 0;
    if (errors === 0 && warnings === 0) {
      this.totalErrors += 1;
      return;
    }

    this.totalErrors += errors;
    this.totalWarnings += warnings;
  }

  getStatus() {
    return this.status;
  }

  private setStatus(status: TaskStatus) {
    this.status = status;
  }

  private startTimer() {
    this.startTime = Date.now();
    this.endTime = null;
  }

  private stopTimer() {
    if (this.startTime !== null) {
      this.endTime = Date.now();
    }
  }

  getStartTime() {
    return this.startTime;
  }

  getEndTime() {
    return this.endTime;
  }

  getDuration() {
    return this.endTime !== null && this.startTime !== null
      ? this.endTime - this.startTime
      : null;
  }

  getFailures() {
    return this.failures;
  }

  getTotalErrors() {
    return this.totalErrors;
  }

  getTotalWarnings() {
    return this.totalWarnings;
  }
}
