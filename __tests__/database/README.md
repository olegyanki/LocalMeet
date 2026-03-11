# Database Tests

This directory contains Property-Based Tests for database changes and bugfixes.

## Test Types

### Exploration Tests
Files: `bugfix-X.Y-*.test.ts` (without "preservation" in name)

**Purpose**: Confirm bugs exist before fixing
- ❌ FAIL on unfixed code
- ✅ PASS after fix

### Preservation Tests
Files: `bugfix-X.Y-preservation.test.ts`

**Purpose**: Ensure fixes don't break existing functionality
- ✅ PASS before fix
- ✅ PASS after fix

## Running Tests

```bash
# Run all database tests
npm test -- __tests__/database

# Run specific bug tests
npm test -- bugfix-1.6

# Run only exploration tests
npm test -- __tests__/database --testNamePattern="EXPLORATION"

# Run only preservation tests
npm test -- __tests__/database --testNamePattern="PRESERVATION"
```

## Test Structure

```
__tests__/database/
├── README.md                                    # This file
├── bugfix-1.1-cascade-delete.test.ts           # Exploration test
├── bugfix-1.1-preservation.test.ts             # Preservation test
├── bugfix-1.1-cascade-delete.md                # Manual test instructions
├── bugfix-1.6-n+1-queries.test.ts              # Exploration test
├── bugfix-1.6-preservation.test.ts             # Preservation test
└── ...
```

## Documentation

For detailed information about database testing methodology, see:
- [Database Testing Guide](../../.kiro/steering/database-testing.md)
- [Database Workflow](../../.kiro/steering/database-workflow.md)

## Related Spec

These tests were created as part of the `database-and-architecture-fixes` spec:
- Spec location: `.kiro/specs/database-and-architecture-fixes/`
- Bugfix document: `bugfix.md`
- Design document: `design.md`
- Tasks: `tasks.md`
