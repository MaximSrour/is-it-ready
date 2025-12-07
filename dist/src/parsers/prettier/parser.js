"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("../registry");
const parsePrettier = (output) => {
    const summaryPatterns = [
        /(\d+)\s+files?\s+(?:are|is)\s+not\s+formatted/i,
        /(\d+)\s+files?\s+with\s+code\s+style\s+issues?/i,
        /Code style issues found in\s+(\d+)\s+files?/i,
    ];
    for (const pattern of summaryPatterns) {
        const match = output.match(pattern);
        if (match) {
            return formatPrettierCount(match[1]);
        }
    }
    if (/Code style issues found in the above file/i.test(output)) {
        return formatPrettierCount(1);
    }
    return undefined;
};
const formatPrettierCount = (count) => {
    const value = Number(count);
    if (!Number.isFinite(value) || value <= 0) {
        return { message: "Failed", errors: 1 };
    }
    const label = value === 1 ? "file" : "files";
    return {
        message: `Failed - ${value} ${label} with formatting issues`,
        errors: value,
    };
};
(0, registry_1.registerParser)("Prettier", parsePrettier);
