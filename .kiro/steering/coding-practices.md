# Coding Best Practices

## Constants
- Extract magic numbers and repeated values into named constants
- Place constants at the top of the file or in a dedicated constants file
- Use UPPER_CASE for constants

## DRY (Don't Repeat Yourself)
- If a value is used multiple times, extract it into a constant or variable
- Avoid code duplication

## Reusability
- All reusable UI elements must be extracted into separate components in `src/shared/components`
- All reusable styles must be extracted into `src/shared/constants/styles.ts`
- All reusable data (colors, sizes, constants) must be in `src/shared/constants`
- Before creating a new component or style, check if a similar one already exists
- When you see repeated patterns across multiple files, extract them into shared resources

## Code Organization
- Keep related code together
- Use meaningful variable and function names
- Prefer small, focused functions over large ones
