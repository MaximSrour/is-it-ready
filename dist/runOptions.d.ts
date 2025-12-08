import { type RunOptions } from "./types";
/**
 * Parses command-line arguments to determine run options.
 *
 * @returns {RunOptions} - object indicating active modes
 */
export declare const getRunOptions: () => RunOptions;
export declare const printHelp: () => void;
export declare const printVersion: () => void;
