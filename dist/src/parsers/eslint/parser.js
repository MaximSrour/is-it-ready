"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("../registry");
const parseEslint = (output) => {
    const summary = output.match(/(\d+)\s+problems?\s+\((\d+)\s+errors?(?:,\s+(\d+)\s+warnings?)?/i);
    if (!summary) {
        return undefined;
    }
    const [, , errors, warnings = "0"] = summary;
    const errorCount = Number(errors);
    const warningCount = Number(warnings);
    if (errorCount === 0 && warningCount === 0) {
        return undefined;
    }
    if (errorCount === 0 && warningCount > 0) {
        return {
            message: `Failed - ${warningCount} warning${warningCount === 1 ? "" : "s"}`,
            warnings: warningCount,
        };
    }
    const parts = [`${errors} errors`];
    if (warningCount > 0) {
        parts.push(`${warnings} warnings`);
    }
    return {
        message: `Failed - ${parts.join(" and ")}`,
        errors: errorCount,
        warnings: warningCount > 0 ? warningCount : undefined,
    };
};
(0, registry_1.registerParser)("ESLint", parseEslint);
