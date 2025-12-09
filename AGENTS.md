# Agent Instructions

This document provides guidelines for AI agents working on the is-it-ready project.

## Project Overview

is-it-ready is a CLI tool that runs project formatting, linting, tests,
inventory, and security checks in one unified dashboard. It's built with
TypeScript and follows strict code quality standards.

## Key Technologies

- **Language**: TypeScript (CommonJS)
- **Testing**: Vitest
- **Linting**: ESLint with TypeScript plugin
- **Formatting**: Prettier
- **Type Checking**: TypeScript compiler
- **Dependency Analysis**: Knip
- **Markdown Linting**: markdownlint-cli2
- **Release Management**: semantic-release

## Development Workflow

### Before Making Changes

1. Install dependencies: `npm install`
2. Understand the existing codebase and tests
3. Run `npm run check` to ensure the project is in a clean state

### While Developing

1. **Follow TDD (Test-Driven Development)**:
   - Write tests before implementing features
   - Ensure tests are meaningful and cover edge cases
   - Keep tests focused and maintainable
   - Place tests alongside source files with `.test.ts` extension

2. **Run Quality Gates Early and Often**:
   - Use `npm run check` to validate code meets all quality standards
   - Fix issues immediately before proceeding

3. **Code Quality Standards**:
   - Follow TypeScript best practices
   - Maintain type safety - avoid `any` types
   - Write clear, self-documenting code
   - Keep functions small and focused
   - Follow existing code patterns and conventions

### Available Commands

- `npm run test` - Run tests with Vitest
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run prettier` - Check code formatting
- `npm run prettier:fix` - Auto-fix formatting issues
- `npm run type-check` - Run TypeScript type checking
- `npm run knip` - Check for unused dependencies and exports
- `npm run markdownlint` - Lint markdown files
- `npm run markdownlint:fix` - Auto-fix markdown issues
- `npm run check` - Run all quality checks (recommended)

### Before Committing

1. Run `npm run check` - all checks must pass
2. Ensure all tests pass
3. Review your changes carefully
4. Follow commit message conventions (see commits.instructions.md)

## File Organization

- `src/` - Source code
  - `*.ts` - TypeScript source files
  - `*.test.ts` - Test files (co-located with source)
  - `parsers/` - Parser implementations
- Configuration files at root:
  - `tsconfig.json`, `tsconfig.build.json`, `tsconfig.eslint.json`
  - `eslint.config.mjs`
  - `prettier.config.cjs`
  - `knip.config.js`

## Making Changes

### Minimal Changes Principle

- Make the smallest possible changes to achieve the goal
- Don't refactor unrelated code
- Don't fix unrelated issues
- Preserve existing functionality

### Security

- Validate all inputs
- Don't introduce security vulnerabilities
- Run security audits with `npm audit`
- Fix any security issues in code you change

### Documentation

- Update README.md if user-facing behavior changes
- Do not manually edit CHANGELOG.md (automatically managed by semantic-release)
- Add JSDoc comments for public APIs
- Keep documentation in sync with code

## Pull Request Process

1. Ensure all quality checks pass
2. Write clear PR description explaining changes
3. Reference related issues
4. Request review from maintainers
5. Address review feedback promptly

## Common Pitfalls

- Don't skip running `npm run check` before committing
- Don't commit code with TypeScript errors
- Don't disable linting rules without good reason
- Don't commit without tests for new functionality

## Getting Help

- Check existing tests for examples
- Review similar functionality in the codebase
- Refer to README.md for project overview
- Ask maintainers for clarification on complex issues
