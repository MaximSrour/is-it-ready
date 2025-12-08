export type ToolName = "Prettier" | "ESLint" | "MarkdownLint" | "TypeScript" | "Vitest" | "Knip" | "npm audit";
export type ParsedFailure = {
    message: string;
    errors?: number;
    warnings?: number;
};
export type ParserName = ToolName | (string & {});
export type ParserFunction = (output: string) => ParsedFailure | undefined;
