import { type ParsedFailure, type ToolName } from "parsers/types";

export type StepState = "pending" | "running" | "success" | "failure";

export type StepStatus = { state: StepState; message: string };

export type StepConfig = {
  label: string;
  tool: ToolName;
  command: string;
  looseCommand?: string;
  fixCommand?: string;
};

export type Step = {
  label: string;
  tool: ToolName;
  command: string;
  parseFailure?: (output: string) => ParsedFailure | undefined;
};
