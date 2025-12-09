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
- `--loose` - Use the loose variant for steps that support it (labels show `*`).
- `--silent` - Keep the summary table but skip the detailed failure output.
- `--fix` - Automatically run fix commands for steps that
  define them (e.g. prettier:fix, lint:fix, markdownlint:fix, knip:fix).

### What it runs

- Prettier via `npm run prettier` (fix: `npm run prettier:fix`)
- ESLint via `npm run lint` (loose: `npm run lint:loose`, fix: `npm run lint:fix`)
- MarkdownLint via `npm run markdownlint` (fix: `npm run markdownlint:fix`)
- TypeScript via `npm run type-check` (loose: `npm run type-check:loose`)
- Vitest via `npm run test`
- Knip via `npm run knip` (loose: `npm run knip:loose`, fix: `npm run knip:fix`)
- npm audit via `npm audit`
