import { type ParsedFailure, type ToolName } from "parsers/types";
export type RunOptions = {
    isLooseMode: boolean;
    isSilentMode: boolean;
    showHelp: boolean;
    showVersion: boolean;
};
export type StepState = "pending" | "running" | "success" | "failure";
export type StepStatus = {
    state: StepState;
    message: string;
};
export type StepConfig = {
    label: string;
    tool: ToolName;
    command: string;
    looseCommand?: string;
};
export type Step = {
    label: string;
    tool: ToolName;
    command: string;
    parseFailure?: (output: string) => ParsedFailure | undefined;
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
export type BorderLevel = "top" | "middle" | "bottom";
export type BorderChars = {
    left: string;
    mid: string;
    right: string;
    fill: string;
};
