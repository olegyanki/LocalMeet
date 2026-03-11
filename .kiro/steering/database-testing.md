# Database Testing with Property-Based Testing

## Overview

This project uses Property-Based Testing (PBT) to verify database changes. Tests are located in `__tests__/` directory.

For database migration workflow, see: **[database-workflow.md](./database-workflow.md)**

## Property-Based Testing Concept

Instead of testing specific scenarios, PBT describes **properties** that code must satisfy. Tests verify these properties hold under various conditions.

## Two Types of Tests

### 1. Exploration Tests (Bug Detection)

**Purpose**: Confirm the bug exists before fixing

**Expected Result**: ❌ FAIL on unfixed code → ✅ PASS after fix

```typescript
// __tests__/bugfix-1.1-cascade-delete.test.ts
test('EXPLORATION TEST: Foreign key should be SET NULL, not CASCADE', async () => {
  // Check current database configuration
  const actualDeleteRule = 'CASCADE';  // On unfixed code
  const expectedDeleteRule = 'SET NULL';  // After fix
  
  // Test FAILS because CASCADE !== SET NULL
  expect(actualDeleteRule).toBe(expectedDeleteRule);
});
```

**When to run**: Before and after implementing the fix

**Why it fails**: Confirms the bug exists in current code

**After fix**: Test passes, proving bug is fixed

### 2. Preservation Tests (Regression Prevention)

**Purpose**: Ensure fix doesn't break existing functionality

**Expected Result**: ✅ PASS both before and after fix

```typescript
// __tests__/bugfix-1.1-preservation.test.ts
test('PRESERVATION: Users can send text messages', async () => {
  const apiContent = fs.readFileSync('src/shared/lib/api.ts', 'utf8');
  
  expect(apiContent).toContain('export async function sendTextMessage');
  
  // Test PASSES both before and after fix
  // Confirms fix didn't break message sending
});
```

**When to run**: Before and after implementing the fix

**Why it passes**: Baseline functionality works correctly

**After fix**: Still passes, proving nothing broke

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- bugfix-1.1-cascade-delete.test.ts

# Run with verbose output
npm test -- --verbose

# Run in watch mode
npm test -- --watch
```

## Test Workflow

### Before Implementing Fix

```bash
# 1. Run exploration test (should FAIL)
npm test -- bugfix-1.6-n+1-queries.test.ts
```

**Expected Output**:
```
❌ FAIL: should detect N+1 query pattern
   Bug Confirmed: N+1 query problem exists
   Query count: 1 + 3N queries

✅ PASS: All preservation tests
   Existing functionality works correctly
```

### After Implementing Fix

```bash
# 1. Apply migration
npm run db:migrate

# 2. Run exploration test (should PASS)
npm test -- bugfix-1.6-n+1-queries.test.ts

# 3. Run preservation tests (should still PASS)
npm test -- bugfix-1.6-preservation.test.ts
```

**Expected Output**:
```
✅ PASS: should detect N+1 query pattern
   Bug Fixed! Using optimized RPC
   Query count: 1 query (constant time)

✅ PASS: All preservation tests
   Existing functionality still works correctly
```

## Test Structure

```
__tests__/
├── bugfix-1.1-cascade-delete.test.ts      # Exploration test
├── bugfix-1.1-preservation.test.ts        # Preservation test
├── bugfix-1.6-n+1-queries.test.ts         # Exploration test
├── bugfix-1.6-preservation.test.ts        # Preservation test
└── ...
```

## Writing Tests for Database Changes

### 1. Write Exploration Test First

```typescript
describe('Bug X.Y: Description - Exploration Test', () => {
  test('EXPLORATION TEST: Description (EXPECTED TO FAIL)', async () => {
    console.log('Bug Condition:');
    console.log('  - Current behavior (defect)');
    console.log('');
    console.log('Expected Behavior (after fix):');
    console.log('  - Correct behavior');
    console.log('');
    
    // Check current state
    const actualBehavior = checkCurrentState();
    const expectedBehavior = 'correct_value';
    
    // FAIL on unfixed code
    expect(actualBehavior).toBe(expectedBehavior);
  });
});
```

### 2. Write Preservation Tests

```typescript
describe('Bug X.Y: Preservation Property Tests', () => {
  describe('Property 2.1: Feature Name', () => {
    test('PRESERVATION: Feature works correctly', async () => {
      console.log('Requirement: Feature MUST continue to work');
      console.log('');
      
      // Check existing functionality
      const featureExists = checkFeature();
      
      // PASS both before and after fix
      expect(featureExists).toBe(true);
    });
  });
});
```

### 3. Implement Fix

```bash
# Create migration
npx supabase migration new fix_bug_description

# Write SQL
# Apply migration
npm run db:migrate
```

### 4. Verify Tests

```bash
# Exploration test should now PASS
npm test -- bugfix-X.Y-exploration.test.ts

# Preservation tests should still PASS
npm test -- bugfix-X.Y-preservation.test.ts
```

## Test Configuration

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
};
```

### jest.setup.js

```javascript
require('dotenv').config();
jest.setTimeout(30000);  // 30 seconds for database operations
```

## Real-World Example: Bug 1.6 (N+1 Queries)

### Exploration Test

```typescript
it('should detect N+1 query pattern (MUST FAIL on unfixed code)', () => {
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  
  // Check if optimized RPC function is used
  const usesOptimizedRPC = apiContent.includes('get_my_chats_optimized');
  
  if (usesOptimizedRPC) {
    // FIXED: Test passes after fix
    console.log('✓ Bug Fixed! Using optimized RPC');
    expect(usesOptimizedRPC).toBe(true);
    return;
  }
  
  // UNFIXED: Check for N+1 pattern
  const hasPromiseAll = apiContent.includes('await Promise.all');
  const hasMapOverChats = /Promise\.all\(.*\.map\(async/.test(apiContent);
  
  // Test FAILS on unfixed code
  expect(hasPromiseAll).toBe(true);  // N+1 pattern found
  expect(usesOptimizedRPC).toBe(false);  // No optimization
  
  console.log('✗ Bug Confirmed: N+1 query problem exists');
  console.log('  For 10 chats: 1 + 3(10) = 31 queries');
});
```

### Preservation Test

```typescript
test('PRESERVATION: Chat list displays correctly', async () => {
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  
  // Verify function exists
  expect(apiContent).toContain('export async function getMyChats');
  
  // Verify return type
  expect(apiContent).toContain('Promise<ChatWithLastMessage[]>');
  
  console.log('✓ Chat list functionality preserved');
});
```

## Best Practices

### DO ✅

1. **Write exploration test before fix** - Confirms bug exists
2. **Write preservation tests** - Protects existing functionality
3. **Add detailed console.log** - Helps understand test output
4. **Run tests after each change** - Quick problem detection
5. **Commit tests with fix** - Documents changes
6. **Use descriptive test names** - Clear intent

### DON'T ❌

1. **Don't modify exploration test to pass** - Hides the bug
2. **Don't ignore failing preservation tests** - Something broke
3. **Don't skip tests** - They're your safety net
4. **Don't write tests after fix** - May miss the bug
5. **Don't test implementation details** - Test behavior

## Why Keep Exploration Tests After Fix?

**Exploration tests become regression tests after the fix.**

### 1. Regression Detection

If someone accidentally reverts the fix:

```bash
# Someone changes foreign key back to CASCADE
ALTER TABLE chats 
DROP CONSTRAINT chats_walk_request_id_fkey,
ADD CONSTRAINT chats_walk_request_id_fkey 
FOREIGN KEY (walk_request_id) 
REFERENCES walk_requests(id) 
ON DELETE CASCADE;  -- ❌ Bug returned!

# Exploration test fails and warns
npm test
# ❌ FAIL: Foreign key should be SET NULL, not CASCADE
```

### 2. Living Documentation

Exploration test documents:
- What bug existed
- How to detect it
- What was broken
- How it should work after fix

### 3. Continuous Validation

Test continues to verify correctness:

```typescript
test('should use optimized RPC function', () => {
  const usesOptimizedRPC = apiContent.includes('get_my_chats_optimized');
  
  // Verifies optimization is still used
  expect(usesOptimizedRPC).toBe(true);  // ✅ Must always pass
});
```

If someone removes the RPC function - test fails!

### 4. CI/CD Protection

Exploration tests run in CI/CD and block deployment if bug returns:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test
  
# If exploration test fails - deployment blocked
```

## Integration with Migration Workflow

Update migration checklist to include testing:

- [ ] Migration file created
- [ ] SQL tested on local database
- [ ] **Exploration test written (should FAIL before fix)**
- [ ] **Preservation tests written (should PASS before fix)**
- [ ] Migration applied successfully
- [ ] Types regenerated
- [ ] **Exploration test now PASSES**
- [ ] **Preservation tests still PASS**
- [ ] API functions updated
- [ ] TypeScript compiles
- [ ] Migration, types, and tests committed together

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Property-Based Testing](https://en.wikipedia.org/wiki/Property_testing)
- [Database Workflow](./database-workflow.md)
