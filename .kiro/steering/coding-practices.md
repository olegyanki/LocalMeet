# Coding Best Practices

## TypeScript

### Type Safety
- Always define proper types for props, state, and function parameters
- Use interfaces for object shapes, types for unions/primitives
- Avoid `any` - use `unknown` if type is truly unknown
- Use type guards for runtime type checking

```tsx
// Good
interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

// Bad
const user: any = { ... };
```

### Null Safety
- Use optional chaining: `user?.profile?.avatar_url`
- Use nullish coalescing: `value ?? defaultValue`
- Handle null/undefined explicitly in API responses

```tsx
// Good
const name = profile?.display_name ?? profile?.username ?? 'Unknown';

// Bad
const name = profile.display_name || profile.username || 'Unknown';
```

## Constants & DRY

### Extract Magic Numbers
```tsx
// Bad
paddingTop: insets.top + 60

// Good
paddingTop: insets.top + SIZES.SCREEN_TOP_PADDING
```

### Avoid Duplication
- If a value is used 2+ times, extract it
- Place constants at file top or in `@shared/constants`
- Use UPPER_CASE for constants

## Error Handling

### API Calls
Always wrap API calls in try-catch:

```tsx
const handleSave = async () => {
  try {
    setLoading(true);
    await updateProfile(userId, data);
    // Success handling
  } catch (error) {
    console.error('Failed to update profile:', error);
    setError(t('errorSaving'));
  } finally {
    setLoading(false);
  }
};
```

### User Feedback
- Show loading states during async operations
- Display error messages in UI (not just console)
- Use `COLORS.ERROR_RED` and `COLORS.ERROR_BG` for error UI

## Performance

### useMemo & useCallback
Use for expensive computations and callback stability:

```tsx
// Expensive computation
const hasChanges = useMemo(() => {
  return JSON.stringify(data) !== JSON.stringify(originalData);
}, [data, originalData]);

// Callback stability (prevents re-renders)
const handlePress = useCallback(() => {
  doSomething(id);
}, [id]);
```

### Avoid Inline Functions in Renders
```tsx
// Bad - creates new function on every render
<TouchableOpacity onPress={() => handlePress(item.id)}>

// Good - stable reference
const handleItemPress = useCallback(() => handlePress(item.id), [item.id]);
<TouchableOpacity onPress={handleItemPress}>
```

### List Optimization
- Always provide `key` prop for lists
- Use `keyExtractor` for FlatList
- Consider `getItemLayout` for fixed-height items

## State Management

### Local State
Use `useState` for component-local state:

```tsx
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Context
Use contexts from `@shared/contexts`:

```tsx
import { useAuth } from '@shared/contexts';

const { user, profile, refreshProfile } = useAuth();
```

### Derived State
Don't store derived state - compute it:

```tsx
// Bad
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// Good
const fullName = `${firstName} ${lastName}`;
```

## API Patterns

### Use Centralized API Functions
Always use functions from `@shared/lib/api.ts`:

```tsx
import { updateProfile, getNearbyWalks } from '@shared/lib/api';

// Good
await updateProfile(userId, { bio: newBio });

// Bad - direct Supabase call
await supabase.from('profiles').update({ bio: newBio });
```

### Handle Loading & Errors
```tsx
const [data, setData] = useState<Walk[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const loadData = async () => {
    try {
      setIsLoading(true);
      const walks = await getNearbyWalks(lat, lng);
      setData(walks);
    } catch (err) {
      console.error('Failed to load walks:', err);
      setError(t('errorLoading'));
    } finally {
      setIsLoading(false);
    }
  };
  
  loadData();
}, [lat, lng]);
```

## Reusability

### Component Extraction
- Extract reusable UI to `src/shared/components`
- Extract feature-specific components to `src/features/{feature}/components`
- Check existing components before creating new ones

### Style Extraction
- Use constants from `@shared/constants/styles.ts`
- Don't duplicate style objects across files

```tsx
// Good
import { INPUT_STYLES, BUTTON_STYLES } from '@shared/constants/styles';

// Bad
const styles = StyleSheet.create({
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    // ... duplicated everywhere
  },
});
```

## Code Organization

### File Structure
- Keep related code together
- Max 300-400 lines per file
- Extract complex logic to separate files

### Naming
- Components: PascalCase (`UserProfile.tsx`)
- Functions: camelCase (`getUserProfile`)
- Constants: UPPER_CASE (`MAX_RADIUS_KM`)
- Files: kebab-case for non-components (`user-utils.ts`)

### Function Size
- Prefer small, focused functions (< 50 lines)
- Extract complex logic to helper functions
- One responsibility per function

## i18n

### Always Use Translations
```tsx
// Good
<Text>{t('welcome')}</Text>

// Bad
<Text>Welcome</Text>
```

### Translation Keys
- Use descriptive keys: `profile.editButton` not `btn1`
- Group by feature: `chat.sendMessage`, `profile.saveChanges`

## Documentation

### CRITICAL: Always Update Context Files

When making changes, ALWAYS update relevant context files in `.kiro/steering/`:

| Change | Update File |
|--------|-------------|
| Add/remove features | `README.md` + `project-context.md` |
| Change architecture, add folders | `project-context.md` + `code-structure.md` |
| Add reusable component | `reusable-components.md` |
| Add style constant | `reusable-components.md` + `design-system.md` |
| Change design pattern | `design-system.md` |
| Add API function | `project-context.md` |
| Change code structure pattern | `code-structure.md` |
| Add coding rule | `coding-practices.md` |

### Why This Matters
- Context files help AI understand the project
- Keeps patterns consistent across codebase
- Prevents duplicate code
- Makes onboarding easier

### Update Process
1. Make code changes
2. Identify which context files are affected
3. Update those files immediately
4. Commit context files WITH code changes

### Code Comments
- Explain WHY, not WHAT
- Document complex algorithms
- Add JSDoc for public APIs

```tsx
// Good
// Debounce search to avoid excessive API calls
const debouncedSearch = useMemo(() => debounce(search, 300), []);

// Bad
// Set loading to true
setLoading(true);
```

## Testing (Manual)

### Before Committing
- Test on both iOS and Android
- Test with keyboard open/closed
- Test with empty states
- Test error states
- Test loading states

### Edge Cases
- No internet connection
- Empty data
- Very long text
- Special characters in input


## Agent Delegation Rules

### Supabase / Database Work → `supabase-expert` agent

ALL tasks related to the database layer MUST be delegated to the `supabase-expert` sub-agent:

- Writing or modifying SQL migrations
- Creating/updating RPC functions
- Creating/updating RLS policies
- Adding/removing indexes
- Modifying `src/shared/lib/api.ts` (API functions, interfaces, types)
- Modifying `src/shared/lib/database.types.ts` (type regeneration)
- Database performance optimization
- Database security audit
- Any direct Supabase queries or schema changes
- Adding new tables, columns, or constraints
- Writing database tests (`__tests__/database/`)

**Do NOT** handle these tasks yourself — always use `invokeSubAgent` with `name: "supabase-expert"`.

The only exception is trivial reads of api.ts for understanding context (e.g., checking which API function a component uses). Actual modifications always go through the agent.
