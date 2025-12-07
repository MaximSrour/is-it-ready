"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("../registry");
const parseKnip = (output) => {
    const sectionPattern = /\((\d+)\)/g;
    let total = 0;
    for (const match of output.matchAll(sectionPattern)) {
        const value = Number(match[1]);
        if (Number.isFinite(value) && value > 0) {
            total += value;
        }
    }
    if (total === 0) {
        const match = output.match(/(\d+)\s+issues?/i);
        if (match) {
            const fallback = Number(match[1]);
            if (Number.isFinite(fallback) && fallback > 0) {
                total = fallback;
            }
        }
    }
    if (total === 0) {
        return undefined;
    }
    return {
        message: `Failed - ${total} issue${total === 1 ? "" : "s"}`,
        errors: total,
    };
};
(0, registry_1.registerParser)("Knip", parseKnip);
