import { type Task } from "../task";

export type UserTaskConfig = {
  tool: string;
  command: string;
  fixCommand?: string;
};

export type ExecutionMode = "parallel" | "sequential";

export type UserFileConfig = {
  watchIgnore?: string[];
  tasks: UserTaskConfig[];
  executionMode?: ExecutionMode;
};

export type Config = {
  watchIgnore?: string[];
  tasks: Task[];
  unsupportedTools: string[];
  executionMode: ExecutionMode;
};
