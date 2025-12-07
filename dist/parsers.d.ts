import { type ParsedFailure, type ToolName } from "./types";
export declare const parsePrettier: (output: string) => ParsedFailure | undefined;
export declare const parseEslint: (output: string) => ParsedFailure | undefined;
export declare const parseTypeCheck: (output: string) => ParsedFailure | undefined;
export declare const parseVitest: (output: string) => ParsedFailure | undefined;
export declare const parseKnip: (output: string) => ParsedFailure | undefined;
export declare const parseNpmAudit: (output: string) => ParsedFailure | undefined;
export declare const parserMap: Record<ToolName, (output: string) => ParsedFailure | undefined>;
