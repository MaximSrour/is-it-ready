export type ToolName =
  | "Prettier"
  | "ESLint"
  | "MarkdownLint"
  | "TypeScript"
  | "Vitest"
  | "Knip"
  | "npm audit";

export type ParsedFailure = {
  message: string;
  errors?: number;
  warnings?: number;
};

export type TaskState = "pending" | "running" | "success" | "failure";

export type TaskStatus = { state: TaskState; message: string };

export type TaskConfig = {
  label: string;
  tool: ToolName;
  command: string;
  looseCommand?: string;
  fixCommand?: string;
  parseFailure: (output: string) => ParsedFailure | undefined;
};

export type FailureDetails = {
  label: string;
  tool: ToolName;
  command: string;
  output: string;
  rawOutput: string;
  errors?: number;
  warnings?: number;
  summary?: string;
};
