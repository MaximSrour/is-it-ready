# is-it-ready help

CLI that runs your project's formatting, linting, tests, inventory, and
security checks in one dashboard.

## Usage

```sh
is-it-ready [--loose] [--silent] [--fix] [-h | --help] [-v | --version]
```

### Flags

- `-h, --help` - Show usage.
- `-v, --version` - Show version number.
- `--silent` - Keep the summary table but skip the detailed failure output.
- `--loose` - Use the loose variant for tasks that support it (labels show `*`).
- `--fix` - Automatically run fix commands for tasks that support it (labels
  show `*`).

## Configuration

To get started, you must create a config file in the root directory of your project
(i.e., in the same directory as your `package.json`). However, this tool may be
installed globally, in which case you may place the config file in your home directory
for global support.

- Supported filenames: `.is-it-ready.config.js`, `.is-it-ready.config.cjs`,
  `.is-it-ready.config.mjs` (CommonJS `module.exports` or ESM `export default`).
- When installed locally the tool also looks for a `"is-it-ready"` key inside
  `package.json`.
- Each file must export an object with a `tasks` array. Every task entry must
  specify the `tool` name and its `command`, and may provide `looseCommand` and
  `fixCommand` overrides.

Example `.is-it-ready.config.mjs`:

```js
export default {
  tasks: [
    {
      tool: "Prettier",
      command: "npm run prettier",
      fixCommand: "npm run prettier -- --write",
    },
    {
      tool: "ESLint",
      command: "npm run lint",
      looseCommand: "npm run lint -- --max-warnings 100",
    },
  ],
};
```

### Tool support

Currently, this tool only provides support for the following packages/tools:

- ESLint
- Knip
- MarkdownLint (`markdownlint-cli2)
- Prettier
- TypeScript
- Vitest

It also provides support for some npm commands

- npm audit
