import { type ToolName } from "parsers/types";

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
