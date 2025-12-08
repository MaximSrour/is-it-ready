# is-it-ready help

CLI that runs your project's formatting, linting, tests, inventory, and
security checks in one dashboard.

## Usage

```sh
is-it-ready [--loose] [--silent] [--help | -h]
```

### Flags

- `-h, --help` - Show usage.
- `--loose` - Use the loose variant for steps that support it (labels show `*`).
- `--silent` - Keep the summary table but skip the detailed failure output.

### What it runs

- Prettier via `npm run prettier`
- ESLint via `npm run lint` (loose: `npm run lint:loose`)
- MarkdownLint via `npm run markdownlint` (fix: `npm run markdownlint:fix`)
- TypeScript via `npm run type-check` (loose: `npm run type-check:loose`)
- Vitest via `npm run test`
- Knip via `npm run knip` (loose: `npm run knip:loose`)
- npm audit via `npm audit`
