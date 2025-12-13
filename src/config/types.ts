export type UserTaskConfig = {
  tool: string;
  command: string;
  fixCommand?: string;
};

export type UserFileConfig = {
  tasks: UserTaskConfig[];
};
