export type ParsedFailure = {
  message: string;
  errors?: number;
  warnings?: number;
};

export type TaskState = "pending" | "running" | "success" | "failure";

export type TaskStatus = { state: TaskState; message: string };

export type ToolConfig = {
  label: string;
  tool: string;
  parseFailure: (output: string) => ParsedFailure | undefined;
};

export type TaskConfig = ToolConfig & {
  command: string;
  fixCommand?: string;
};

export type FailureDetails = {
  label: string;
  tool: string;
  command: string;
  output: string;
  rawOutput: string;
  errors?: number;
  warnings?: number;
  summary?: string;
};
