import pkg from "../package.json";
import { type RunOptions } from "./types";

const HELP_TEXT = `# is-it-ready help

CLI that runs your project's formatting, linting, tests, inventory, and
security checks in one dashboard.

## Usage

\`\`\`sh
is-it-ready [--loose] [--silent] [-h | --help] [-v | --version]
\`\`\`

### Flags

- \`-h, --help\` - Show usage.
- \`-v, --version\` - Show version number.
- \`--loose\` - Use the loose variant for steps that support it (labels show \`*\`).
- \`--silent\` - Keep the summary table but skip the detailed failure output.

### What it runs

- Prettier via \`npm run prettier\`
- ESLint via \`npm run lint\` (loose: \`npm run lint:loose\`)
- MarkdownLint via \`npm run markdownlint\` (fix: \`npm run markdownlint:fix\`)
- TypeScript via \`npm run type-check\` (loose: \`npm run type-check:loose\`)
- Vitest via \`npm run test\`
- Knip via \`npm run knip\` (loose: \`npm run knip:loose\`)
- npm audit via \`npm audit\``;

/**
 * Parses command-line arguments to determine run options.
 * Processes arguments one by one, exiting immediately if --help or --version is encountered.
 *
 * @returns {RunOptions} - object indicating active modes
 */
export const getRunOptions = (): RunOptions => {
  // Process arguments one by one to handle --help and --version immediately
  const args = process.argv.slice(2);

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--version" || arg === "-v") {
      printVersion();
      process.exit(0);
    }
  }

  // If we reach here, no help/version flags were found, process other options
  const isLooseMode = args.includes("--loose");
  const isSilentMode = args.includes("--silent");

  return { isLooseMode, isSilentMode, showHelp: false, showVersion: false };
};

export const printHelp = () => {
  console.log(HELP_TEXT.trimEnd());
};

export const printVersion = () => {
  console.log(`${pkg.name} ${pkg.version}`);
  console.log(`Copyright (C) ${new Date().getFullYear()} ${pkg.author}`);
  console.log(`License: ${pkg.license}`);
  console.log();
  console.log(
    "This is free software: you are free to change and redistribute it."
  );
  console.log("There is NO WARRANTY, to the extent permitted by law.");
};
