

# Move Test Dependencies and Rename Package

## Changes to `package.json`

### 1. Rename package
Change `"name"` from `"vite_react_shadcn_ts"` to `"ayn-insight-forge"`.

### 2. Move 6 packages from `dependencies` to `devDependencies`

These are test/dev-only packages that should not be in production dependencies:

| Package | Version |
|---------|---------|
| `@playwright/test` | `^1.57.0` |
| `@testing-library/jest-dom` | `^6.9.1` |
| `@testing-library/react` | `^16.3.0` |
| `@vitest/ui` | `^4.0.14` |
| `vitest` | `^4.0.14` |
| `jsdom` | `^27.2.0` |

These lines will be removed from `dependencies` and added into the existing `devDependencies` block, maintaining alphabetical order.

### File changed

| File | Change |
|------|--------|
| `package.json` | Rename package + move 6 test deps to devDependencies |
