# is-it-ready

[![NPM version](https://img.shields.io/npm/v/is-it-ready.svg?style=for-the-badge)](https://www.npmjs.org/package/is-it-ready)
[![NPM Last Update](https://img.shields.io/npm/last-update/is-it-ready?style=for-the-badge)](https://www.npmjs.com/package/is-it-ready?activeTab=versions)
[![NPM Downloads](https://img.shields.io/npm/dw/is-it-ready?style=for-the-badge)](https://www.npmjs.org/package/is-it-ready)
[![GitHub contributors](https://img.shields.io/github/contributors/MaximSrour/is-it-ready?style=for-the-badge)](https://github.com/MaximSrour/is-it-ready/graphs/contributors)
[![NPM License](https://img.shields.io/npm/l/is-it-ready?style=for-the-badge)](https://github.com/MaximSrour/is-it-ready/blob/master/LICENSE)

CLI that runs your project's formatting, linting, tests, inventory, and
security checks in one dashboard.

## Installation

- Global: `npm install -g is-it-ready`
- Dev only (in your project): `npm install --save-dev is-it-ready`
- One-off: `npx is-it-ready`

## Usage

```sh
is-it-ready \
  [--silent] \
  [--fix] \
  [--watch] \
  [--no-color] \
  [--config <path>] \
  [-h | --help] \
  [-v | --version]
```

### Flags

- `-h, --help` - Show usage.
- `-v, --version` - Show version number.
- `--config <path>` - Use a specific config file instead of searching defaults.
- `--silent` - Keep the summary table but skip the detailed failure output.
- `--fix` - Automatically run fix commands for tasks that support it (labels
  show `*`).
- `--watch` - Re-run tasks whenever project files change.
- `--no-color` - Disable ANSI colors in CLI output.

The table shows live status, timings, and overall issue counts. Exit code is `0`
when everything passes and `1` otherwise.

## Configuration

To get started, you must create a config file in the root directory of your project
(i.e., in the same directory as your `package.json`). However, this tool may be
installed globally, in which case you may place the config file in your home directory
for global support.

- Supported filenames: `.is-it-ready.config.js`, `.is-it-ready.config.cjs`,
  `.is-it-ready.config.mjs` (CommonJS `module.exports` or ESM `export default`).
- When installed locally the tool also looks for a `"is-it-ready"` key inside
  `package.json`.
- Pass `--config <path>` (e.g., `is-it-ready --config configs/staging.mjs`)
  to point the CLI at a specific file.
- Each file must export an object with a `tasks` array. Every task entry must
  specify the `tool` name and its `command`, and may provide `fixCommand` overrides.
- Optional `executionMode` controls whether tasks run in `parallel` or
  `sequential` order. The default is `parallel`.
- Built-in tools get parser-based issue counts. Other tool names are allowed,
  but they run in exit-code-only mode and show a warning that they are not
  directly supported.

Example `.is-it-ready.config.mjs`:

```js
export default {
  executionMode: "parallel",
  tasks: [
    {
      tool: "Prettier",
      command: "npm run prettier",
      fixCommand: "npm run prettier -- --write",
    },
    {
      tool: "ESLint",
      command: "npm run lint",
    },
    {
      tool: "Vitest",
      command: "npm run test:no-coverage",
    },
    {
      tool: "Stryker",
      command: "npm run mutate",
    },
  ],
};
```

If you run multiple tasks that write coverage artifacts in the same
`is-it-ready` session, disable coverage output for all but one of them.
Otherwise, parallel tasks can race on shared coverage directories such as
`coverage/` or `coverage/.tmp`.

For example:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:no-coverage": "vitest run --coverage.enabled=false",
    "mutate": "stryker run"
  }
}
```

### Tool support

Currently, this tool provides direct parser support for the following tools:

- ESLint
- Knip
- MarkdownLint (`markdownlint-cli2`)
- Prettier
- Stryker
- TypeScript
- Vitest

It also provides direct parser support for some npm commands:

- npm audit

Other tools may still be configured. When a tool has no built-in parser,
`is-it-ready` warns once and uses only the command exit code to decide whether
that task passed or failed.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for
detailed guidelines on code standards, testing, and the pull request process.

### Mutation Testing Workflow

Mutation testing is a required quality gate for this project.

Acceptance criteria:

- Mutation score must be `100%`
- `0` surviving mutants
- `0` timed out mutants

Recommended workflow:

1. Run mutation tests while developing:
   - `npm run mutate`
2. Add or improve tests until all mutants are killed.
3. Re-run mutation tests to verify.
4. Run the full mutation suite before opening a PR:
   - `npm run mutate`

When configuring `is-it-ready`, make sure concurrent tasks are not both writing
coverage output to the same location. Disabling coverage on one of those tasks
is usually the simplest fix.

If a mutant is equivalent and cannot be killed by a meaningful test:

- Prefer rewriting code to make intent explicit and testable.
- If still equivalent, add a targeted Stryker disable comment with a clear
  reason and keep the suppression as narrow as possible.
