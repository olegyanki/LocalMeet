---
inclusion: auto
---

# Reusable UI Components Guide

This file documents all reusable UI components and patterns in the project. Always check this list before creating new components to avoid duplication.

## Buttons

### PrimaryButton
**Location:** `src/shared/components/PrimaryButton.tsx`

Primary action button with gradient background, loading state, and optional check icon.

**Props:**
- `title: string` - Button text
- `onPress: () => void` - Click handler
- `disabled?: boolean` - Disable button
- `loading?: boolean` - Show loading spinner
- `showCheckIcon?: boolean` - Show check icon (default: false)
- `style?: ViewStyle` - Custom styles
- `textStyle?: TextStyle` - Custom text styles
- `useGradient?: boolean` - Use gradient background (default: true)

**Usage:**
```tsx
import PrimaryButton from '@shared/components/PrimaryButton';

<PrimaryButton
  title={t('save')}
  onPress={handleSave}
  disabled={!hasChanges}
  loading={isSaving}
  showCheckIcon
/>
```

**When to use:**
- Primary actions (Save, Submit, Continue, Login, Register)
- Main CTAs on screens
- Form submissions

**When NOT to use:**
- Secondary actions (use TouchableOpacity with text)
- Destructive actions (use custom red button)
- Small inline actions

## Gradient Components

### GradientView
**Location:** `src/shared/components/GradientView.tsx`

Wrapper component for applying gradient background to any content.

**Props:**
- `children: React.ReactNode` - Content to wrap
- `style?: ViewStyle` - Custom styles
- `colors?: string[]` - Custom gradient colors (default: COLORS.GRADIENT_ORANGE)

**Usage:**
```tsx
import GradientView from '@shared/components/GradientView';

<GradientView style={styles.chip}>
  <Text style={styles.chipText}>Active</Text>
</GradientView>
```

**When to use:**
- Active state chips/tags
- Custom gradient backgrounds
- Special highlight elements

**When NOT to use:**
- Buttons (use PrimaryButton instead)
- Large backgrounds (performance)
- Subtle UI elements

## Avatar Components

### Avatar
**Location:** `src/shared/components/Avatar.tsx`

User avatar with fallback to initials or placeholder.

**Props:**
- `uri?: string | null` - Avatar image URL
- `name: string` - User name for initials
- `size: number` - Avatar size (use SIZES constants)

**Usage:**
```tsx
import Avatar from '@shared/components/Avatar';
import { SIZES } from '@shared/constants';

<Avatar 
  uri={user.avatar_url} 
  name={user.username} 
  size={SIZES.AVATAR_MEDIUM} 
/>
```

**Available sizes:**
- `SIZES.AVATAR_SMALL` - 32px
- `SIZES.AVATAR_MEDIUM` - 48px
- `SIZES.AVATAR_LARGE` - 80px

### AvatarPicker
**Location:** `src/shared/components/AvatarPicker.tsx`

Avatar with edit functionality for profile screens.

**Props:**
- `uri?: string | null` - Current avatar URL
- `onImageSelected: (uri: string) => void` - Callback when image selected
- `size?: number` - Avatar size (default: 80)

**Usage:**
```tsx
import AvatarPicker from '@shared/components/AvatarPicker';

<AvatarPicker
  uri={avatarUrl}
  onImageSelected={setAvatarUrl}
  size={100}
/>
```

## Audio Components

### AudioRecorder
**Location:** `src/shared/components/AudioRecorder.tsx`

Audio recording component for chat messages.

**Props:**
- `onRecordingComplete: (uri: string) => void` - Callback with audio file URI

**Usage:**
```tsx
import AudioRecorder from '@shared/components/AudioRecorder';

<AudioRecorder onRecordingComplete={handleAudioSend} />
```

### AudioPlayer
**Location:** `src/shared/components/AudioPlayer.tsx`

Audio playback component for chat messages.

**Props:**
- `uri: string` - Audio file URI
- `isOwnMessage?: boolean` - Style for own vs received messages

**Usage:**
```tsx
import AudioPlayer from '@shared/components/AudioPlayer';

<AudioPlayer uri={message.audio_url} isOwnMessage={isOwn} />
```

## Picker Components

### InterestPicker
**Location:** `src/shared/components/InterestPicker.tsx`

Modal picker for selecting user interests.

**Props:**
- `visible: boolean` - Show/hide modal
- `selectedInterests: string[]` - Currently selected interest keys
- `onClose: () => void` - Close callback
- `onConfirm: (interests: string[]) => void` - Confirm callback

**Usage:**
```tsx
import InterestPicker from '@shared/components/InterestPicker';

<InterestPicker
  visible={showPicker}
  selectedInterests={interests}
  onClose={() => setShowPicker(false)}
  onConfirm={setInterests}
/>
```

## Map Components

### MapPreview
**Location:** `src/shared/components/MapPreview.tsx`

Static map preview for displaying location.

**Props:**
- `latitude: number`
- `longitude: number`
- `style?: ViewStyle`

**Usage:**
```tsx
import MapPreview from '@shared/components/MapPreview';

<MapPreview 
  latitude={event.latitude} 
  longitude={event.longitude}
  style={styles.map}
/>
```

### LocationPin
**Location:** `src/shared/components/LocationPin.tsx`

Location pin icon component.

**Props:**
- `size?: number` - Icon size (default: 24)
- `color?: string` - Icon color

## Common Patterns

### Active Chip/Tag Pattern

For chips that have active/inactive states with gradient:

```tsx
import GradientView from '@shared/components/GradientView';

{items.map((item) => {
  const isActive = selectedId === item.id;
  return (
    <Pressable
      key={item.id}
      style={styles.chipWrapper}
      onPress={() => onSelect(item.id)}
    >
      {isActive ? (
        <GradientView style={styles.chip}>
          <Text style={styles.chipTextActive}>{item.label}</Text>
        </GradientView>
      ) : (
        <View style={styles.chip}>
          <Text style={styles.chipText}>{item.label}</Text>
        </View>
      )}
    </Pressable>
  );
})}
```

**Styles:**
```tsx
chipWrapper: {
  borderRadius: 20,
  overflow: 'hidden',
},
chip: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
  backgroundColor: COLORS.CARD_BG,
  shadowColor: COLORS.SHADOW_BLACK,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
},
chipText: {
  fontSize: 14,
  fontWeight: '600',
  color: COLORS.TEXT_DARK,
},
chipTextActive: {
  fontSize: 14,
  fontWeight: '600',
  color: COLORS.WHITE,
},
```

### Input with Label Pattern

Standard input field with uppercase label:

```tsx
<View style={styles.inputGroup}>
  <Text style={styles.label}>{t('fieldName').toUpperCase()}</Text>
  <View style={styles.inputWrapper}>
    <TextInput
      style={styles.input}
      placeholder={t('placeholder')}
      placeholderTextColor={COLORS.TEXT_LIGHT}
      value={value}
      onChangeText={setValue}
    />
  </View>
</View>
```

**Styles:**
```tsx
inputGroup: {
  marginBottom: 24,
},
label: {
  fontSize: 12,
  fontWeight: '700',
  color: COLORS.TEXT_LIGHT,
  marginBottom: 8,
  letterSpacing: 0.5,
},
inputWrapper: {
  backgroundColor: COLORS.CARD_BG,
  borderRadius: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
  padding: 4,
  minHeight: 56,
},
input: {
  backgroundColor: 'transparent',
  borderWidth: 0,
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
  fontWeight: '500',
  color: COLORS.TEXT_DARK,
},
```

## Constants to Use

### Colors
**Location:** `src/shared/constants/colors.ts`

Always use color constants instead of hardcoded values:
- `COLORS.ACCENT_ORANGE` - Primary orange
- `COLORS.GRADIENT_ORANGE` - Gradient array for active states
- `COLORS.TEXT_DARK` - Primary text
- `COLORS.TEXT_LIGHT` - Secondary text
- `COLORS.CARD_BG` - White backgrounds
- `COLORS.BG_SECONDARY` - Gray screen backgrounds
- `COLORS.BORDER_COLOR` - Dividers and borders

### Sizes
**Location:** `src/shared/constants/styles.ts`

Use size constants for consistency:
- `SIZES.TAB_BAR_HEIGHT` - Bottom tab bar height
- `SIZES.SCREEN_TOP_PADDING` - Standard top padding
- `SIZES.AVATAR_SMALL` - 32px
- `SIZES.AVATAR_MEDIUM` - 48px
- `SIZES.AVATAR_LARGE` - 80px

## Before Creating New Components

1. Check this file for existing components
2. Check `src/shared/components/` directory
3. Check `src/shared/constants/styles.ts` for reusable styles
4. If similar component exists, extend it instead of creating new one
5. If creating new reusable component, add it to this file

## Component Creation Checklist

When creating a new reusable component:

- [ ] Place in `src/shared/components/`
- [ ] Use TypeScript with proper prop types
- [ ] Use constants from `@shared/constants`
- [ ] Add JSDoc comments
- [ ] Follow design system guidelines
- [ ] Add to this documentation file
- [ ] Test on both iOS and Android if platform-specific

## Anti-Patterns to Avoid

❌ **Don't:** Create inline gradient buttons
```tsx
<TouchableOpacity>
  <LinearGradient colors={['#FFB84D', '#FF8C26', '#FF5500']}>
    <Text>Button</Text>
  </LinearGradient>
</TouchableOpacity>
```

✅ **Do:** Use PrimaryButton
```tsx
<PrimaryButton title="Button" onPress={handlePress} />
```

❌ **Don't:** Hardcode colors
```tsx
backgroundColor: '#FF7A00'
```

✅ **Do:** Use color constants
```tsx
backgroundColor: COLORS.ACCENT_ORANGE
```

❌ **Don't:** Duplicate avatar logic
```tsx
{user.avatar_url ? (
  <Image source={{ uri: user.avatar_url }} />
) : (
  <View><Text>{user.name[0]}</Text></View>
)}
```

✅ **Do:** Use Avatar component
```tsx
<Avatar uri={user.avatar_url} name={user.name} size={SIZES.AVATAR_MEDIUM} />
```
