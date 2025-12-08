"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("../registry");
const parseMarkdownLint = (output) => {
    const summaryMatch = /Summary:\s*(\d+)\s*error\(s\)/i.exec(output);
    if (summaryMatch) {
        const errorCount = Number(summaryMatch[1]);
        if (!Number.isFinite(errorCount) || errorCount === 0) {
            return undefined;
        }
        return {
            message: `Failed - ${errorCount} error${errorCount === 1 ? "" : "s"}`,
            errors: errorCount,
        };
    }
    return undefined;
};
(0, registry_1.registerParser)("MarkdownLint", parseMarkdownLint);
