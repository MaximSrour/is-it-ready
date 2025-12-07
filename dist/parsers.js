"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserMap = exports.parseNpmAudit = exports.parseKnip = exports.parseVitest = exports.parseTypeCheck = exports.parseEslint = exports.parsePrettier = void 0;
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
exports.parsePrettier = parsePrettier;
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
exports.parseEslint = parseEslint;
const parseTypeCheck = (output) => {
    const summary = output.match(/Found\s+(\d+)\s+errors?\s+in\s+(\d+)\s+files?/i);
    if (summary) {
        const errorCount = Number(summary[1]);
        const fileCount = Number(summary[2]);
        if (errorCount > 0) {
            const fileLabel = fileCount === 1 ? "file" : "files";
            return {
                message: `Failed - ${errorCount} errors in ${fileCount} ${fileLabel}`,
                errors: errorCount,
            };
        }
    }
    const fallback = output.match(/Found\s+(\d+)\s+errors?/i);
    if (!fallback) {
        const errorLines = Array.from(output.matchAll(/^([^\s][^(]+)\(\d+,\d+\):\s+error\s+TS\d+:/gim));
        if (errorLines.length === 0) {
            return undefined;
        }
        const files = new Set(errorLines.map((match) => match[1].trim()).filter(Boolean));
        const fileCount = files.size;
        const fileLabel = fileCount === 1 ? "file" : "files";
        const errorCount = errorLines.length;
        return {
            message: `Failed - ${errorCount} errors in ${fileCount} ${fileLabel}`,
            errors: errorCount,
        };
    }
    const count = Number(fallback[1]);
    if (!Number.isFinite(count) || count === 0) {
        return undefined;
    }
    return {
        message: `Failed - ${count} errors`,
        errors: count,
    };
};
exports.parseTypeCheck = parseTypeCheck;
const parseVitest = (output) => {
    const fileFailures = output.match(/Test Files\s+(\d+)\s+failed/i);
    const testFailures = output.match(/Tests\s+(\d+)\s+failed/i);
    if (!fileFailures && !testFailures) {
        return undefined;
    }
    let totalFailures = 0;
    const fileCount = Number(fileFailures?.[1] ?? 0);
    const testCount = Number(testFailures?.[1] ?? 0);
    if (Number.isFinite(fileCount)) {
        totalFailures += fileCount;
    }
    if (Number.isFinite(testCount)) {
        totalFailures += testCount;
    }
    if (!Number.isFinite(totalFailures) || totalFailures === 0) {
        return undefined;
    }
    const testPart = testFailures
        ? `${testCount} test${testCount === 1 ? "" : "s"} failed`
        : "";
    const filePart = fileFailures
        ? `${fileCount} file${fileCount === 1 ? "" : "s"}`
        : "";
    const messageBody = testPart && filePart ? `${testPart} in ${filePart}` : testPart;
    return {
        message: `Failed - ${messageBody}`,
        errors: totalFailures || 1,
    };
};
exports.parseVitest = parseVitest;
const parseKnip = (output) => {
    const sectionPattern = /^(?:Unused|Unlisted|Unresolved|Duplicate|Configuration)\b[^\n]*\((\d+)\)/gim;
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
exports.parseKnip = parseKnip;
const parseNpmAudit = (output) => {
    const summaryRegex = /(?:found\s+)?(\d+)\s+vulnerabilities?(?:\s+\(([^)]+)\))?/gi;
    const summary = summaryRegex.exec(output);
    if (summary) {
        const total = Number(summary[1]);
        if (!Number.isFinite(total) || total === 0) {
            return undefined;
        }
        const breakdown = summary[2]
            .split(/,\s*/)
            .map((part) => part.trim())
            .filter(Boolean);
        const detail = breakdown.length > 0 ? ` (${breakdown.join(", ")})` : "";
        return {
            message: `Failed - ${total} vulnerabilit${total === 1 ? "y" : "ies"}${detail}`,
            errors: total,
        };
    }
    if (/0\s+vulnerabilities?/i.test(output)) {
        return undefined;
    }
    if (/npm err!/i.test(output) || /vulnerabilit/i.test(output)) {
        return { message: "Failed - vulnerabilities detected", errors: 1 };
    }
    return undefined;
};
exports.parseNpmAudit = parseNpmAudit;
exports.parserMap = {
    Prettier: exports.parsePrettier,
    ESLint: exports.parseEslint,
    TypeScript: exports.parseTypeCheck,
    Vitest: exports.parseVitest,
    Knip: exports.parseKnip,
    "npm audit": exports.parseNpmAudit,
};
