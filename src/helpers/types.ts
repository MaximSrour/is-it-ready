export type ExecutableCommand = {
  label: string;
  command: string;
};

export type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};
