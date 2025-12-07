import { type ParserFunction, type ParserName } from "./types";
export declare const registerParser: (name: ParserName, parser: ParserFunction) => void;
export declare const getParser: (name: ParserName) => ParserFunction | undefined;
export declare const parserMap: Record<string, ParserFunction>;
