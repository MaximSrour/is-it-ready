import { type Task } from "~/task";

export type UserTaskConfig = {
  tool: string;
  command: string;
  fixCommand?: string;
};

export type UserFileConfig = {
  watchIgnore?: string[];
  tasks: UserTaskConfig[];
};

export type Config = {
  watchIgnore?: string[];
  tasks: Task[];
};
