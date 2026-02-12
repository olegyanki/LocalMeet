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

### When to Update Docs
- Adding/removing features → Update `README.md`
- Changing architecture → Update `.kiro/steering/project-context.md`
- Adding reusable components → Update `.kiro/steering/reusable-components.md`
- Changing design patterns → Update `.kiro/steering/design-system.md`

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
