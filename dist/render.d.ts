import { type BorderLevel, type FailureDetails, type RunOptions, type StepState } from "./types";
/**
 * Renders a table with borders, headers, rows, and an optional footer.
 *
 * @param {string[]} headers - array of header titles
 * @param {string[][]} rows - array of rows, each row is an array of cell values
 * @param {string[]} [footerRow] - optional footer row
 *
 * @returns {string} - rendered table string
 */
export declare const renderTable: (headers: string[], rows: string[][], footerRow?: string[]) => string;
/**
 * Renders a table border using specified characters.
 *
 * @param {number[]} columnWidths - array of column widths
 * @param {BorderLevel} borderLevel - type of border to render
 *
 * @returns {string} - rendered border string
 */
export declare const renderBorder: (columnWidths: number[], borderLevel: BorderLevel) => string;
/**
 * Renders a table row with padded cells.
 *
 * @param {string[]} row - array of cell values
 * @param {number[]} columnWidths - array of column widths
 *
 * @returns {string} - rendered row string
 */
export declare const renderRow: (row: string[], columnWidths: number[]) => string;
/**
 * Pads a cell value to the specified width.
 *
 * @param {string} value - cell value
 * @param {number} columnWidth - desired width
 *
 * @returns {string} - padded cell value
 */
export declare const padCell: (value: string, columnWidth: number) => string;
/**
 * Calculates the display width of a string, accounting for full-width characters.
 *
 * @param {string} value - input string
 *
 * @returns {number} - display width of the string
 */
export declare const getDisplayWidth: (value: string) => number;
/**
 * Determines if a Unicode code point is a full-width character.
 * Full-width characters typically occupy two character cells in terminal displays.
 *
 * @param {number | null} codePoint - The Unicode code point to check.
 *
 * @returns {boolean} - True if the code point is full-width, false otherwise.
 */
export declare const isFullWidthCodePoint: (codePoint?: number | null) => boolean;
/**
 * Colors a status message based on the step state.
 *
 * @param {string} message - The status message to color.
 * @param {StepState} state - The state of the step ("pending", "running", "success", "failure").
 *
 * @returns {string} - The colored status message.
 */
export declare const colorStatusMessage: (message: string, state: StepState) => string;
/**
 * Builds a formatted string summarizing failure details for display.
 *
 * @param {FailureDetails} failure - metadata describing the failed step
 *
 * @returns {string} - decorated headline containing label, tool, command, and breakdown
 */
export declare const formatFailureHeadline: (failure: FailureDetails) => string;
/**
 * Prints detailed information about failed steps.
 *
 * @param {FailureDetails[]} failures - Array of failure details to print
 * @param {RunOptions} runOptions - Options that influenced the run
 */
export declare const printFailureDetails: (failures: FailureDetails[], runOptions: RunOptions) => void;
