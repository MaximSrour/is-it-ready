import "./eslint/parser";
import "./knip/parser";
import "./npm-audit/parser";
import "./prettier/parser";
import "./typescript/parser";
import "./vitest/parser";

export { getParser, parserMap } from "./registry";
export { type ParserFunction } from "./types";
