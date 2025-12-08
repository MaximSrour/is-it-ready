"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printHelp = exports.getRunOptions = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Parses command-line arguments to determine run options.
 *
 * @returns {RunOptions} - object indicating active modes
 */
const getRunOptions = () => {
    const isLooseMode = process.argv.includes("--loose");
    const isSilentMode = process.argv.includes("--silent");
    const showHelp = process.argv.includes("--help") || process.argv.includes("-h");
    return { isLooseMode, isSilentMode, showHelp };
};
exports.getRunOptions = getRunOptions;
const printHelp = () => {
    const helpPath = path_1.default.resolve(__dirname, "help.md");
    try {
        const content = fs_1.default.readFileSync(helpPath, "utf-8");
        console.log(content.trimEnd());
    }
    catch (error) {
        console.error(`Error reading help file: ${error.message}`);
    }
};
exports.printHelp = printHelp;
