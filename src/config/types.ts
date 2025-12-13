export type UserTaskConfig = {
  tool: string;
  command: string;
  looseCommand?: string;
  fixCommand?: string;
};

export type UserFileConfig = {
  tasks: UserTaskConfig[];
};
