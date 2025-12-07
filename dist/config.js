"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stepConfig = void 0;
exports.stepConfig = [
    {
        label: "Formatting",
        tool: "Prettier",
        command: "npm run prettier",
    },
    {
        label: "Linting",
        tool: "ESLint",
        command: "npm run lint",
        supportsLoose: true,
    },
    {
        label: "Type Checking",
        tool: "TypeScript",
        command: "npm run type-check",
        supportsLoose: true,
    },
    {
        label: "Tests",
        tool: "Vitest",
        command: "npm run test",
    },
    {
        label: "Inventory",
        tool: "Knip",
        command: "npm run knip",
        supportsLoose: true,
    },
    {
        label: "Package Health",
        tool: "npm audit",
        command: "npm audit",
    },
];
