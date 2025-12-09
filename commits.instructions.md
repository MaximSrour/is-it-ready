# Commit Message Instructions

This document outlines commit message conventions for the is-it-ready project.

## Overview

This project uses [Conventional Commits](https://www.conventionalcommits.org/)
specification with [semantic-release](https://semantic-release.gitbook.io/)
for automated versioning and changelog generation.

## Commit Message Format

```text
<type>[optional scope]: <description>
```

### Rules

1. **One logical change per commit** - Each commit should represent a single,
   cohesive change
2. **Maximum 80 characters** for the commit message (type + scope +
   description)
3. **Use lowercase** for type, scope, and description
4. **Start description with a verb** in imperative mood (e.g., "add", "fix",
   "update")
5. **No period** at the end of the description
6. **Keep it simple** - Single line commit messages only, no body or footer

## Commit Types

### Types that Trigger Releases

- **feat**: A new feature (triggers MINOR version bump)
  - Example: `feat: add support for custom check configurations`
  - Example: `feat(cli): add --quiet flag to suppress all output`

- **fix**: A bug fix (triggers PATCH version bump)
  - Example: `fix: correct exit code when all checks pass`
  - Example: `fix(parser): handle empty command output correctly`

### Types that Don't Trigger Releases

- **docs**: Documentation only changes
  - Example: `docs: update README with installation instructions`
  - Example: `docs(api): add JSDoc comments to public functions`

- **style**: Code style changes (formatting, missing semicolons, etc.)
  - Example: `style: format code with prettier`
  - Example: `style: fix linting warnings`

- **refactor**: Code changes that neither fix bugs nor add features
  - Example: `refactor: simplify error handling logic`
  - Example: `refactor(render): extract table rendering to separate function`

- **perf**: Performance improvements
  - Example: `perf: optimize check execution with parallel runs`
  - Example: `perf(parser): cache parsed results`

- **test**: Adding or updating tests
  - Example: `test: add tests for CLI flag parsing`
  - Example: `test(helpers): cover edge cases for formatDuration`

- **build**: Changes to build system or dependencies
  - Example: `build: update typescript to 5.9.3`
  - Example: `build(deps): bump vitest to 4.0.15`

- **ci**: Changes to CI configuration and scripts
  - Example: `ci: add automated release workflow`
  - Example: `ci: update GitHub Actions to v4`

- **chore**: Other changes that don't modify src or test files
  - Example: `chore: update .gitignore`
  - Example: `chore(deps): update dev dependencies`

- **revert**: Reverts a previous commit
  - Example: `revert: remove custom config support`
  - Must reference the reverted commit in the body

## Scopes (Optional)

Scopes provide additional context about what part of the codebase changed:

- `cli` - Command-line interface changes
- `parser` - Parser implementations
- `render` - Output rendering and formatting
- `config` - Configuration handling
- `helpers` - Helper functions
- `types` - Type definitions
- `deps` - Dependencies

Example with scope: `fix(parser): handle null values in audit output`

## Breaking Changes

Breaking changes trigger a MAJOR version bump and must be indicated by adding
`!` after type/scope:

```text
feat!: change default behavior to strict mode
```

```text
fix!: change exit code behavior for warnings
```

## Examples

### Good Commit Messages

```text
feat: add markdown linting support
```

```text
fix(cli): correct help text formatting
```

```text
docs: add contributing guidelines
```

```text
test: add tests for runOptions parser
```

```text
refactor: simplify check execution logic
```

```text
feat!: change default behavior to strict mode
```

```text
fix!: change exit code behavior for warnings
```

### Bad Commit Messages

```text
Update stuff
```

**Issue:** Not descriptive, no type

```text
feat: Add new feature, fix bugs, and update docs
```

**Issue:** Multiple logical changes in one commit

```text
Fixed the bug where the thing didn't work properly and also added some new features
```

**Issue:** Too long, multiple changes, no type, improper capitalization

```text
feat: Added support for custom configurations.
```

**Issue:** Period at end, past tense instead of imperative

```text
FEAT: ADD SUPPORT FOR CUSTOM CONFIGS
```

**Issue:** All uppercase (should be lowercase)

## Workflow

1. **Make atomic changes** - Keep each commit focused on one thing
2. **Stage related changes** - Use `git add` to stage only related files
3. **Write the commit message** - Follow the format above
4. **Verify before pushing**:
   - `git log --oneline -n 5` - Review recent commits
   - Ensure message is clear and follows conventions
5. **Push changes** - `git push`

## Automation

- **semantic-release** analyzes commit messages to determine version bumps
- **Changelog** is automatically generated from commit messages
- **Releases** are published automatically when commits are merged to `master`

Therefore, correct commit messages are critical for proper version management!

## Quick Reference

| Type               | Version Bump | Use Case             |
| ------------------ | ------------ | -------------------- |
| `feat`             | MINOR        | New feature          |
| `fix`              | PATCH        | Bug fix              |
| `feat!` or `fix!`  | MAJOR        | Breaking change      |
| `docs`             | None         | Documentation        |
| `style`            | None         | Formatting           |
| `refactor`         | None         | Code restructuring   |
| `perf`             | None         | Performance          |
| `test`             | None         | Tests                |
| `build`            | None         | Build system         |
| `ci`               | None         | CI/CD                |
| `chore`            | None         | Maintenance          |

## Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [semantic-release](https://semantic-release.gitbook.io/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
