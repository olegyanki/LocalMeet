---
inclusion: auto
---

# Reusable Components

Before creating new components, check this list to avoid duplication.

## Buttons

### PrimaryButton
`src/shared/components/PrimaryButton.tsx`

Primary action button with loading state and optional check icon.

```tsx
<PrimaryButton
  title={t('save')}
  onPress={handleSave}
  disabled={!hasChanges}
  loading={isSaving}
  showCheckIcon
/>
```

**Use for:** Save, Submit, Continue, Login, Register
**Don't use for:** Secondary actions, destructive actions, small inline actions

## Gradient

### GradientView
`src/shared/components/GradientView.tsx`

Wrapper for gradient backgrounds (uses `COLORS.GRADIENT_ORANGE` by default).

```tsx
<GradientView style={styles.chip}>
  <Text style={styles.chipText}>Active</Text>
</GradientView>
```

**Use for:** Active chips/tags, special highlights
**Don't use for:** Buttons (use PrimaryButton), large backgrounds (performance)

## Avatars

### Avatar
`src/shared/components/Avatar.tsx`

User avatar with fallback to initials.

```tsx
<Avatar 
  uri={user.avatar_url} 
  name={user.username} 
  size={SIZES.AVATAR_MEDIUM} 
/>
```

**Sizes:** `SIZES.AVATAR_SMALL` (32px), `SIZES.AVATAR_MEDIUM` (48px), `SIZES.AVATAR_LARGE` (80px)

### AvatarPicker
`src/shared/components/AvatarPicker.tsx`

Avatar with edit functionality for profile screens.

```tsx
<AvatarPicker
  uri={avatarUrl}
  onImageSelected={setAvatarUrl}
  size={100}
/>
```

## Audio

### AudioRecorder
`src/shared/components/AudioRecorder.tsx`

Audio recording for chat messages.

```tsx
<AudioRecorder onRecordingComplete={handleAudioSend} />
```

### AudioPlayer
`src/shared/components/AudioPlayer.tsx`

Audio playback for chat messages.

```tsx
<AudioPlayer uri={message.audio_url} isOwnMessage={isOwn} />
```

## Chips

### Chip
`src/shared/components/Chip.tsx`

Reusable chip/tag component with active/inactive states and gradient support.

```tsx
<Chip
  label={t('interestSport')}
  isActive={selected}
  onPress={() => toggleSelection()}
  emoji="⚽"
/>
```

**Use for:** Filter chips, interest tags, category selection
**Don't use for:** Buttons, large interactive elements

## Pickers

### InterestPicker
`src/shared/components/InterestPicker.tsx`

Modal for selecting user interests.

```tsx
<InterestPicker
  visible={showPicker}
  selectedInterests={interests}
  onClose={() => setShowPicker(false)}
  onConfirm={setInterests}
/>
```

## Map

### MapPreview
`src/shared/components/MapPreview.tsx`

Static map preview for displaying location.

```tsx
<MapPreview 
  latitude={event.latitude} 
  longitude={event.longitude}
  style={styles.map}
/>
```

### LocationPin
`src/shared/components/LocationPin.tsx`

Location pin icon component.

## Style Constants

Use constants from `@shared/constants/styles.ts`:

```tsx
// Buttons
BUTTON_STYLES.primary
BUTTON_STYLES.primaryText
BUTTON_STYLES.disabled

// Inputs
INPUT_STYLES.wrapper
INPUT_STYLES.input
INPUT_STYLES.label

// Chips
CHIP_STYLES.active
CHIP_STYLES.activeText
CHIP_STYLES.inactive
CHIP_STYLES.inactiveText

// Headers
HEADER_STYLES.container
HEADER_STYLES.title
HEADER_STYLES.headerTextButton
HEADER_STYLES.spacer

// Navigation Bar
NAVBAR_STYLES.backButton
NAVBAR_STYLES.title
NAVBAR_STYLES.spacer

// Shadows
SHADOW.standard
SHADOW.elevated

// Sizes
SIZES.AVATAR_SMALL / MEDIUM / LARGE
SIZES.TAB_BAR_HEIGHT
SIZES.SCREEN_TOP_PADDING
```

## Common Patterns

### Active Chip with Gradient

```tsx
import GradientView from '@shared/components/GradientView';

{items.map((item) => {
  const isActive = selectedId === item.id;
  return (
    <Pressable key={item.id} onPress={() => onSelect(item.id)}>
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

### Input with Label

```tsx
<View style={styles.inputGroup}>
  <Text style={INPUT_STYLES.label}>{t('fieldName').toUpperCase()}</Text>
  <View style={INPUT_STYLES.wrapper}>
    <TextInput
      style={INPUT_STYLES.input}
      placeholder={t('placeholder')}
      placeholderTextColor={COLORS.TEXT_LIGHT}
      value={value}
      onChangeText={setValue}
    />
  </View>
</View>
```

### Navigation Bar

```tsx
import { NAVBAR_STYLES } from '@shared/constants';
import { ChevronLeft } from 'lucide-react-native';

// With back button
<View style={styles.navbar}>
  <TouchableOpacity onPress={handleBack} style={NAVBAR_STYLES.backButton}>
    <ChevronLeft size={24} color={COLORS.TEXT_DARK} />
  </TouchableOpacity>
  <Text style={NAVBAR_STYLES.title} numberOfLines={1}>
    {title}
  </Text>
  <View style={NAVBAR_STYLES.spacer} />
</View>

// Without back button (centered)
<View style={styles.navbar}>
  <View style={NAVBAR_STYLES.spacer} />
  <Text style={NAVBAR_STYLES.title} numberOfLines={1}>
    {title}
  </Text>
  <View style={NAVBAR_STYLES.spacer} />
</View>

// With action button
<View style={styles.navbar}>
  <TouchableOpacity onPress={handleBack} style={NAVBAR_STYLES.backButton}>
    <ChevronLeft size={24} color={COLORS.TEXT_DARK} />
  </TouchableOpacity>
  <Text style={NAVBAR_STYLES.title} numberOfLines={1}>
    {title}
  </Text>
  <TouchableOpacity onPress={handleSave}>
    <Text style={styles.actionButton}>{t('save')}</Text>
  </TouchableOpacity>
</View>
```

## Before Creating Components

1. Check this file
2. Check `src/shared/components/` directory
3. Check `src/shared/constants/styles.ts` for reusable styles
4. Extend existing components instead of creating new ones

## Component Checklist

- [ ] Place in `src/shared/components/`
- [ ] TypeScript with proper types
- [ ] Use constants from `@shared/constants`
- [ ] JSDoc comments
- [ ] Follow design system
- [ ] Add to this file
- [ ] Test iOS and Android

## Anti-Patterns

❌ Inline gradient buttons → ✅ Use `PrimaryButton`
❌ Hardcoded colors → ✅ Use `COLORS` constants
❌ Duplicate avatar logic → ✅ Use `Avatar` component
❌ Custom input styles → ✅ Use `INPUT_STYLES` constants
