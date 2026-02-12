# Code Structure Patterns

## Screen Structure

All screens should follow this consistent structure:

```tsx
// 1. Imports (grouped)
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Contexts & Hooks
import { useAuth } from '@shared/contexts';
import { useI18n } from '@shared/i18n';

// API & Utils
import { updateProfile, getNearbyWalks } from '@shared/lib/api';

// Components
import PrimaryButton from '@shared/components/PrimaryButton';
import Avatar from '@shared/components/Avatar';

// Constants
import { COLORS, SIZES, HEADER_STYLES } from '@shared/constants';

// 2. Constants (at top of file)
const INPUT_MIN_HEIGHT = 56;
const MAX_RADIUS_KM = 15;

// 3. Component
export default function ScreenName() {
  // 3.1. Hooks (in order)
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user, profile } = useAuth();
  
  // 3.2. State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // 3.3. Derived state (useMemo)
  const hasChanges = useMemo(() => {
    // computation
  }, [dependencies]);
  
  // 3.4. Effects
  useEffect(() => {
    // Keyboard listeners
  }, []);
  
  useEffect(() => {
    // Data loading
  }, [dependencies]);
  
  // 3.5. Handlers (useCallback for complex ones)
  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateProfile(user.id, data);
    } catch (err) {
      setError(t('errorSaving'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // 3.6. Early returns (loading, error states)
  if (isLoading && !data) {
    return <LoadingView />;
  }
  
  // 3.7. Render
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { 
            paddingTop: insets.top + SIZES.SCREEN_TOP_PADDING,
            paddingBottom: isKeyboardVisible ? 20 : SIZES.TAB_BAR_HEIGHT + 20 
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={HEADER_STYLES.spacer} />
          <Text style={styles.title}>{t('title')}</Text>
          {hasChanges && (
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelButton}>{t('cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Error */}
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        {/* Content */}
        {/* ... */}
        
        {/* Conditional Button */}
        {hasChanges && (
          <PrimaryButton
            title={t('save')}
            onPress={handleSave}
            disabled={isLoading}
            loading={isLoading}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 4. Styles (at bottom)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  content: {
    paddingHorizontal: 24,
  },
  // ... rest of styles
});
```

## Folder Structure Rules

### Feature Structure
```
src/features/{feature}/
├── screens/          # Screen components only
│   └── FeatureScreen.tsx
├── components/       # Feature-specific components
│   └── FeatureCard.tsx
└── modals/          # Feature-specific modals
    └── FeatureModal.tsx
```

### When to Create New Folders
- **screens/** - Always for screen components
- **components/** - Only when you have 2+ feature-specific components
- **modals/** - Only when you have modals/bottom sheets

### File Naming
- Screens: `FeatureScreen.tsx` (e.g., `ProfileScreen.tsx`, `ChatScreen.tsx`)
- Components: `ComponentName.tsx` (PascalCase)
- Utils: `feature-utils.ts` (kebab-case)
- Constants: `feature-constants.ts` (kebab-case)

## Component Reusability Rules

### When to Extract to Shared
Extract to `src/shared/components/` when:
- Used in 2+ different features
- Generic UI element (buttons, inputs, avatars)
- No feature-specific logic

### When to Keep in Feature
Keep in `src/features/{feature}/components/` when:
- Used only in this feature
- Has feature-specific logic
- Tightly coupled to feature data

### Example Decision Tree
```
Is component used in multiple features?
├─ YES → src/shared/components/
└─ NO → Is it used in 2+ screens of same feature?
    ├─ YES → src/features/{feature}/components/
    └─ NO → Keep inline in screen
```

## Import Order

Always follow this order:

```tsx
// 1. React & React Native
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';

// 3. Contexts & Hooks
import { useAuth } from '@shared/contexts';
import { useI18n } from '@shared/i18n';

// 4. API & Utils
import { updateProfile } from '@shared/lib/api';
import { formatTime } from '@shared/utils/time';

// 5. Components (shared first, then feature-specific)
import PrimaryButton from '@shared/components/PrimaryButton';
import Avatar from '@shared/components/Avatar';
import FeatureCard from '../components/FeatureCard';

// 6. Constants (grouped import)
import { COLORS, SIZES, HEADER_STYLES } from '@shared/constants';
```

## State Management Patterns

### Local State (useState)
```tsx
// Simple values
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Arrays
const [items, setItems] = useState<Item[]>([]);

// Objects
const [formData, setFormData] = useState({
  name: '',
  bio: '',
});
```

### Derived State (useMemo)
```tsx
// Don't store derived state
const hasChanges = useMemo(() => {
  return JSON.stringify(data) !== JSON.stringify(originalData);
}, [data, originalData]);

// Don't do this:
const [hasChanges, setHasChanges] = useState(false);
useEffect(() => {
  setHasChanges(data !== originalData);
}, [data, originalData]);
```

### Context Usage
```tsx
// Always destructure what you need
const { user, profile, refreshProfile } = useAuth();

// Don't use entire context
const auth = useAuth(); // ❌
```

## Error Handling Pattern

Always follow this pattern for async operations:

```tsx
const handleAction = async () => {
  try {
    setLoading(true);
    setError(null); // Clear previous errors
    
    const result = await apiCall();
    
    // Success handling
    setData(result);
    
  } catch (err) {
    console.error('Action failed:', err);
    setError(t('errorMessage'));
  } finally {
    setLoading(false);
  }
};
```

## Keyboard Handling Pattern

Always track keyboard for proper padding:

```tsx
const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

useEffect(() => {
  const showListener = Keyboard.addListener('keyboardDidShow', () => {
    setIsKeyboardVisible(true);
  });
  const hideListener = Keyboard.addListener('keyboardDidHide', () => {
    setIsKeyboardVisible(false);
  });

  return () => {
    showListener.remove();
    hideListener.remove();
  };
}, []);

// Use in ScrollView
<ScrollView
  contentContainerStyle={{
    paddingBottom: isKeyboardVisible ? 20 : SIZES.TAB_BAR_HEIGHT + 20
  }}
/>
```

## Conditional Rendering Patterns

### Conditional Buttons
```tsx
// Show button only when needed
{hasChanges && (
  <PrimaryButton
    title={t('save')}
    onPress={handleSave}
    disabled={isLoading}
    loading={isLoading}
  />
)}
```

### Conditional Header Actions
```tsx
<View style={styles.header}>
  <View style={HEADER_STYLES.spacer} />
  <Text style={styles.title}>{t('title')}</Text>
  {hasChanges ? (
    <TouchableOpacity onPress={handleCancel}>
      <Text style={styles.cancelButton}>{t('cancel')}</Text>
    </TouchableOpacity>
  ) : (
    <View style={HEADER_STYLES.spacer} />
  )}
</View>
```

### Loading States
```tsx
// Early return for initial loading
if (isLoading && !data) {
  return (
    <View style={[styles.container, styles.centerContainer]}>
      <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
    </View>
  );
}

// Inline loading for updates
<PrimaryButton
  title={t('save')}
  onPress={handleSave}
  loading={isLoading}
/>
```

## Style Organization

### Style Order
```tsx
const styles = StyleSheet.create({
  // 1. Container styles
  container: { ... },
  content: { ... },
  
  // 2. Layout styles
  header: { ... },
  section: { ... },
  
  // 3. Component styles (grouped)
  inputGroup: { ... },
  inputWrapper: { ... },
  input: { ... },
  
  // 4. Text styles
  title: { ... },
  label: { ... },
  errorText: { ... },
  
  // 5. Button styles
  button: { ... },
  buttonText: { ... },
});
```

### Use Constants
```tsx
// Good - use constants
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BG_SECONDARY,
  },
  header: {
    ...HEADER_STYLES.container,
  },
});

// Bad - hardcoded values
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
  },
});
```

## Consistency Checklist

Before committing, verify:
- [ ] Imports are ordered correctly
- [ ] Constants extracted (no magic numbers)
- [ ] Using constants from `@shared/constants`
- [ ] Error handling with try-catch-finally
- [ ] Loading states for async operations
- [ ] Keyboard handling for forms
- [ ] Conditional rendering for buttons
- [ ] Styles use constants, not hardcoded values
- [ ] Component in correct folder (shared vs feature)
- [ ] File naming follows conventions
