import { type ParsedFailure, type ToolName } from "parsers/types";

export type TaskState = "pending" | "running" | "success" | "failure";

export type TaskStatus = { state: TaskState; message: string };

export type TaskConfig = {
  label: string;
  tool: ToolName;
  command: string;
  looseCommand?: string;
  fixCommand?: string;
};

export type Task = {
  label: string;
  tool: ToolName;
  command: string;
  parseFailure?: (output: string) => ParsedFailure | undefined;
};
