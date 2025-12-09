# GitHub Copilot Instructions

These instructions guide GitHub Copilot when generating code for the
is-it-ready project.

## Code Style and Standards

### TypeScript Guidelines

- Use strict TypeScript with no implicit `any`
- Prefer `const` over `let`; avoid `var`
- Use meaningful variable and function names
- Prefer functional programming patterns where appropriate
- Use type inference when types are obvious
- Explicitly type function parameters and return values
- Use interfaces for object shapes, types for unions/primitives

### Code Organization

- Keep functions small and focused (single responsibility)
- Co-locate tests with source files (e.g., `helpers.test.ts` with `helpers.ts`)
- Group related functionality in modules
- Export only what needs to be public
- Use barrel exports sparingly

### Naming Conventions

- **Files**: camelCase (e.g., `runOptions.ts`)
- **Functions/Variables**: camelCase (e.g., `parseOptions`, `isReady`)
- **Types/Interfaces**: PascalCase (e.g., `RunOptions`, `StepConfig`)
- **Constants**: camelCase or UPPER_SNAKE_CASE for true constants
- **Test files**: `*.test.ts` suffix

## Testing with Vitest

### Test-Driven Development

1. Write tests first before implementing features
2. Start with the simplest test case
3. Add complexity incrementally
4. Ensure all tests pass before moving forward

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { functionToTest } from './module';

describe('functionToTest', () => {
  it('should handle basic case', () => {
    const result = functionToTest('input');
    expect(result).toBe('expected');
  });

  it('should handle edge case', () => {
    const result = functionToTest('');
    expect(result).toBe('');
  });
});
```

### Test Best Practices

- Use descriptive test names that explain behavior
- Test behavior, not implementation
- Cover happy paths, edge cases, and error cases
- Use arrange-act-assert pattern
- Keep tests independent and isolated
- Mock external dependencies appropriately
- Avoid testing library code (e.g., chalk, Node.js built-ins)

## Quality Gates

### Before Every Commit

Run `npm run check` to validate all quality gates:

1. **Prettier** - Code formatting
2. **ESLint** - Code linting and best practices
3. **MarkdownLint** - Markdown file quality
4. **TypeScript** - Type checking
5. **Vitest** - All tests pass
6. **Knip** - No unused dependencies or exports
7. **npm audit** - No known security vulnerabilities

All checks must pass in strict mode (not loose mode).

### Individual Quality Checks

- `npm run prettier` or `npm run prettier:fix`
- `npm run lint` or `npm run lint:fix`
- `npm run type-check`
- `npm run test`
- `npm run knip`
- `npm run markdownlint` or `npm run markdownlint:fix`

## Code Patterns

### Error Handling

- Use explicit error checking
- Provide helpful error messages
- Don't swallow errors silently
- Use appropriate error types

### Async Code

- Use `async/await` over raw promises
- Handle promise rejections properly
- Use `Promise.all()` for parallel operations
- Avoid mixing callbacks and promises

### Type Safety

- Avoid type assertions unless absolutely necessary
- Use type guards for runtime type checking
- Prefer union types over `any`
- Use generic types for reusable code

## Dependencies

### Adding Dependencies

- Prefer established, well-maintained packages
- Check package size and dependencies
- Ensure license compatibility (MIT preferred)
- Add to correct section in package.json:
  - `dependencies` - Runtime dependencies
  - `devDependencies` - Development tools and testing

### Updating Dependencies

- Test thoroughly after updating
- Check breaking changes in changelogs
- Update package-lock.json with `npm install`
- Verify all quality gates still pass

## Documentation

### Code Comments

- Use JSDoc for public APIs
- Explain "why" not "what" in comments
- Keep comments up-to-date with code
- Remove commented-out code

### Inline Documentation

```typescript
/**
 * Parses command-line options for the CLI tool.
 * @param args - Command-line arguments
 * @returns Parsed options object
 */
export function parseOptions(args: string[]): RunOptions {
  // Implementation
}
```

## Performance Considerations

- Avoid unnecessary computations
- Cache expensive operations when appropriate
- Use streams for large data processing
- Be mindful of memory usage
- Profile before optimizing

## Security Best Practices

- Validate all external inputs
- Avoid command injection vulnerabilities
- Don't commit secrets or credentials
- Keep dependencies updated for security patches
- Use `npm audit` to check for vulnerabilities

## CLI-Specific Guidelines

### User Experience

- Provide clear, helpful error messages
- Use colors appropriately with chalk
- Show progress for long-running operations
- Support common CLI conventions (--help, --version)
- Handle interrupts (Ctrl+C) gracefully

### Output

- Keep output clean and scannable
- Use tables for structured data
- Provide summary information
- Allow silent mode when appropriate

## What NOT to Do

- ❌ Don't use `any` type without good reason
- ❌ Don't skip tests for new functionality
- ❌ Don't commit code that doesn't pass `npm run check`
- ❌ Don't mutate function parameters
- ❌ Don't use `eval()` or similar dangerous functions
- ❌ Don't hardcode file paths or system-specific values
- ❌ Don't add dependencies without careful consideration
- ❌ Don't disable ESLint or TypeScript rules without justification
- ❌ Don't refactor unrelated code
- ❌ Don't fix unrelated issues in your PR

## Workflow Summary

1. Understand the requirement
2. Write tests first (TDD)
3. Implement minimal solution
4. Run `npm run check` frequently
5. Fix issues immediately
6. Review changes carefully
7. Commit with semantic commit message
8. Ensure all CI checks pass
