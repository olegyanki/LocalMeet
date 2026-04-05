# Design System

## Design Philosophy
Minimalist, clean, modern aesthetic. Focus on content and usability. No unnecessary decorations, icons on buttons only when essential.

## Colors
Always use constants from `@shared/constants/colors.ts`:

### Primary
- `COLORS.ACCENT_ORANGE` (#FF7A00) - Text color, icon tint, small elements (badges, dots)
- `COLORS.GRADIENT_ORANGE` - Array `['#FFB84D', '#FF8C26', '#FF5500']` for gradient backgrounds. Use via `GradientView` component, never directly with `LinearGradient`
- `COLORS.TEXT_DARK` (#333333) - Primary text, headings
- `COLORS.TEXT_LIGHT` (#999999) - Secondary text, labels (uppercase labels above inputs)

### Backgrounds
- `COLORS.BG_SECONDARY` (#F2F2F7) - Screen backgrounds, message list background
- `COLORS.CARD_BG` (#FFFFFF) - Cards, inputs, elevated surfaces, modals
- `COLORS.LOCATION_HEADER_BG` (#F9FAFB) - Subtle section headers inside cards
- `COLORS.IMAGE_PLACEHOLDER_BG` (#F3F4F6) - Image placeholder backgrounds

### Text & Labels
- `COLORS.TEXT_DARK` (#333333) - All primary text
- `COLORS.TEXT_LIGHT` (#999999) - Uppercase labels above inputs
- `COLORS.GRAY_DARK` (#6B7280) - Secondary labels (non-uppercase), placeholder text in some contexts
- `COLORS.GRAY_PLACEHOLDER` (#9CA3AF) - TextInput placeholderTextColor
- `COLORS.TEXT_SECONDARY` (#4F4F4F) - Mid-level text

### Utility
- `COLORS.BORDER_COLOR` (#E8E8E8) - Dividers, borders on inputs (CreateEvent style)
- `COLORS.SUCCESS_GREEN` (#8FD89C) - Success states
- `COLORS.ERROR_RED` (#FF3B30) - Errors, destructive actions, field error text
- `COLORS.ERROR_BG` (#FFE5E5) - Error message backgrounds
- `COLORS.ERROR_BG_LIGHT` (#FFEBEE) - Error icon container background
- `COLORS.OVERLAY` - `rgba(0, 0, 0, 0.5)` - Modal overlays
- `COLORS.SHADOW_BLACK` (#000) - Always use for shadowColor

### Message Colors
- `COLORS.MESSAGE_INCOMING` (#F0F0F0) - Incoming message bubble
- `COLORS.MESSAGE_OUTGOING` (#FFE066) - Outgoing message bubble (yellow)
- `COLORS.TIME_BLUE` (#12B7DB) - Time-related text (starts soon)

### Social
- `COLORS.INSTAGRAM_BG` (#FFE7F3) - Instagram icon background
- `COLORS.TELEGRAM_BG` (#E0F2FE) - Telegram icon background

## Typography

### Sizes
- 34px - Large titles (auth screens)
- 28px - Screen/tab titles (Profile, CreateEvent headers)
- 24px - Navbar titles (screens with back button)
- 22px - Section titles, modal titles
- 18px - Section subtitles
- 16-17px - Button text, body text, inputs
- 14-15px - Secondary text, descriptions, date/time inputs
- 12px - Uppercase labels above inputs, field error text, small hints
- 11px - Chip text, very small labels

### Weights
- 700 - Screen titles (28px), section titles, error titles, button text
- 600 - Labels, action buttons (Cancel, Save text buttons), segment button text
- 500 - Regular body text, input text, chip text, placeholder-like text
- 400 - Light text (rarely used)

### Label Patterns

**Uppercase labels (above inputs):**
```tsx
// Profile style — used for most form fields
<Text style={styles.label}>{t('fieldName').toUpperCase()}</Text>
// fontSize: 12, fontWeight: '700', color: COLORS.TEXT_LIGHT, letterSpacing: 0.5, marginBottom: 8

// CreateEvent style — used for date/time/location
<Text style={styles.smallLabel}>{t('fieldName').toUpperCase()}</Text>
// fontSize: 12, fontWeight: '600', color: COLORS.GRAY_DARK, letterSpacing: 0.5, marginBottom: 6
```

**Regular labels (above inputs, non-uppercase):**
```tsx
<Text style={styles.label}>{t('fieldName')}</Text>
// fontSize: 14, fontWeight: '600', color: COLORS.GRAY_DARK, marginBottom: 6, marginLeft: 4
```

## Spacing

### Padding
- Screens: 24px horizontal (`paddingHorizontal: 24`)
- Cards: 16-20px
- Inputs (Profile style): `padding: 4` on wrapper, `paddingHorizontal: 16, paddingVertical: 14` on inner input
- Inputs (CreateEvent style): `paddingHorizontal: 16, paddingVertical: 12` directly on input
- Buttons: `paddingVertical: 18`
- Sections: `marginBottom: 20-24`

### Top Padding
- Tab screens: `paddingTop: insets.top + SIZES.SCREEN_TOP_PADDING` (SCREEN_TOP_PADDING = 16)
- Screens with back button (navbar): `paddingTop: insets.top + 12`
- Bottom sheets: `paddingTop: 4` (no safe area needed)

### Bottom Padding
- Tab screens with keyboard tracking:
  ```tsx
  paddingBottom: isKeyboardVisible ? 20 : SIZES.TAB_BAR_HEIGHT + 20
  // TAB_BAR_HEIGHT = 78
  ```
- Screens outside tabs: `paddingBottom: 50 + insets.bottom`

### Margins
- Between form groups: `marginBottom: 20-24`
- Between label and input: `marginBottom: 6-8`
- Between sections: `marginBottom: 20`
- Use `gap` property instead of marginBottom for flex children

### Border Radius
- Screen cards / large containers: 16-20px
- Input wrappers (Profile style): 24px
- Inner inputs (Profile style): 16px
- Inputs (CreateEvent style): 12px
- Buttons: 24px
- Chips: 16px
- Modals: 24px (top corners only)
- Error banners: 16px
- Small badges / buttons: 8px
- Remove cover button: 14px (circular)

## Two Input Styles

The project uses **two distinct input patterns** depending on context:

### Profile Style (shadow wrapper, no border)
Used in: ProfileScreen, auth screens, onboarding

```tsx
// Outer wrapper — white card with shadow, no border
<View style={styles.inputWrapper}>
  <TextInput style={styles.input} ... />
</View>

inputWrapper: {
  backgroundColor: COLORS.CARD_BG,
  borderRadius: 24,
  ...SHADOW.standard,
  elevation: 2,
  padding: 4,
  minHeight: 56,  // SIZES.INPUT_MIN_HEIGHT
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

**Error state (Profile style):**
```tsx
inputWrapperError: {
  borderWidth: 2,
  borderColor: COLORS.ERROR_RED,
  shadowColor: COLORS.ERROR_RED,  // Exception: colored shadow for errors only
  shadowOpacity: 0.15,
},
```

### CreateEvent Style (border + shadow, no wrapper)
Used in: CreateEventScreen, date/time pickers

```tsx
input: {
  backgroundColor: COLORS.CARD_BG,
  borderWidth: 1,  // SIZES.BORDER_WIDTH
  borderColor: COLORS.BORDER_COLOR,
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  color: COLORS.TEXT_DARK,
  ...SHADOW.standard,
  elevation: 2,
},
```

**Error state (CreateEvent style):**
```tsx
inputError: {
  borderColor: COLORS.ERROR_RED,
  // No shadow change, just border color
},
```

**Textarea (both styles):**
```tsx
textArea: {
  minHeight: SIZES.TEXTAREA_MIN_HEIGHT,  // 96px
  textAlignVertical: 'top',
  paddingTop: 12-14,
},
```

## Shadows

Use constants from `@shared/constants/styles.ts`:

```typescript
SHADOW.standard: {   // Cards, inputs, wrappers
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
}

SHADOW.elevated: {   // Buttons, active segments
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 4,
}

SHADOW.modal: {      // Bottom sheets, modals
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -10 },
  shadowOpacity: 0.2,
  shadowRadius: 20,
  elevation: 10,
}

SHADOW.button: {     // Primary buttons
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius: 16,
  elevation: 6,
}

SHADOW.xl: {         // EventCards
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.25,
  shadowRadius: 24,
  elevation: 8,
}
```

**NEVER** use colored shadows except for error states on Profile-style inputs.

## Component Styles

Use constants from `@shared/constants/styles.ts`:

### Buttons
```typescript
BUTTON_STYLES.primary    // Orange bg, white text, paddingVertical: 18, borderRadius: 24
BUTTON_STYLES.primaryText // fontSize: 16, fontWeight: '700', color: white
BUTTON_STYLES.disabled   // opacity: 0.6
```

**Text action buttons (header right side):**
```tsx
// Cancel / Save / Clear — orange text, no background
<TouchableOpacity onPress={handleAction}>
  <Text style={styles.actionButton}>{t('cancel')}</Text>
</TouchableOpacity>

actionButton: {
  fontSize: 17,
  fontWeight: '600',
  color: COLORS.ACCENT_ORANGE,
}
// From HEADER_STYLES.headerTextButton
```

### Inputs
```typescript
INPUT_STYLES.wrapper  // Profile-style outer wrapper (borderRadius: 24, shadow, padding: 4)
INPUT_STYLES.input    // Inner input (transparent bg, no border, borderRadius: 16)
INPUT_STYLES.label    // Uppercase label (12px, weight 700, TEXT_LIGHT, letterSpacing 0.5)
```

### Chips
```typescript
CHIP_STYLES.active       // Orange background, white text
CHIP_STYLES.activeText   // White text
CHIP_STYLES.inactive     // rgba(255,122,0,0.1) background, orange text
CHIP_STYLES.inactiveText // Orange text
```

**Add chip button (+ Add Language / + Add Interest):**
```tsx
addChip: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  backgroundColor: 'rgba(255, 122, 0, 0.1)',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 16,
},
addChipText: {
  fontSize: 14,
  color: COLORS.ACCENT_ORANGE,
  fontWeight: '500',
},
// Icon: <Plus size={14} color={COLORS.ACCENT_ORANGE} />
```

### Segmented Control (Gender selector)
```tsx
segmentedControl: {
  flexDirection: 'row',
  backgroundColor: COLORS.CARD_BG,
  borderRadius: 24,
  ...SHADOW.standard,
  padding: 6,
  gap: 4,
  minHeight: 56,
},
segmentButton: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 12,
  borderRadius: 16,
},
segmentButtonActive: {
  backgroundColor: COLORS.ACCENT_ORANGE,
  ...SHADOW.elevated,
  // Exception: colored shadow for active segment
  shadowColor: COLORS.ACCENT_ORANGE,
  shadowOpacity: 0.2,
},
segmentButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.TEXT_LIGHT },
segmentButtonTextActive: { color: COLORS.CARD_BG, fontWeight: '700' },
```

### Headers

**Tab screen header (left-aligned title, optional right action):**
```tsx
<View style={styles.header}>
  <Text style={styles.title} numberOfLines={1}>{t('screenTitle')}</Text>
  {hasChanges && (
    <TouchableOpacity onPress={handleCancel}>
      <Text style={styles.cancelButton}>{t('cancel')}</Text>
    </TouchableOpacity>
  )}
</View>

header: {
  ...HEADER_STYLES.container,  // flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16
  paddingHorizontal: 24,       // Add if not in scrollview with paddingHorizontal
  backgroundColor: COLORS.BG_SECONDARY,
},
title: {
  fontSize: 28,
  fontWeight: '700',
  color: COLORS.TEXT_DARK,
  flex: 1,
},
cancelButton: {
  ...HEADER_STYLES.headerTextButton,  // fontSize: 17, fontWeight: '600', color: ACCENT_ORANGE
},
```

**Navbar (screens with back button, outside tabs):**
```tsx
<View style={styles.navbar}>
  <TouchableOpacity onPress={router.back} style={NAVBAR_STYLES.backButton}>
    <ChevronLeft size={24} color={COLORS.TEXT_DARK} />
  </TouchableOpacity>
  <Text style={NAVBAR_STYLES.title} numberOfLines={1}>{title}</Text>
  <View style={NAVBAR_STYLES.spacer} />  {/* or action button */}
</View>

// NAVBAR_STYLES.backButton: width/height 40, centered
// NAVBAR_STYLES.title: fontSize 24, fontWeight '700', flex 1, textAlign 'center'
// NAVBAR_STYLES.spacer: width 40
```

**Rules:**
- Tab screen titles: 28px, left-aligned, `flex: 1`
- Navbar titles: 24px, center-aligned, `flex: 1`
- Always `numberOfLines={1}` on titles to prevent overflow
- Right action buttons are always text (no icons), orange color
- Back buttons: `ChevronLeft size={24}`, 40x40 touch target

## Sizes Reference (SIZES constant)

```typescript
SIZES.AVATAR_SMALL = 32
SIZES.AVATAR_MEDIUM = 48
SIZES.AVATAR_LARGE = 80
SIZES.AVATAR_XLARGE = 100
SIZES.TAB_BAR_HEIGHT = 78
SIZES.SCREEN_TOP_PADDING = 16
SIZES.INPUT_MIN_HEIGHT = 56
SIZES.TEXTAREA_MIN_HEIGHT = 96
SIZES.BIO_INPUT_MIN_HEIGHT = 100
SIZES.COVER_IMAGE_HEIGHT = 192
SIZES.MAP_PREVIEW_HEIGHT = 160
SIZES.ICON_BUTTON_SIZE = 28
SIZES.ICON_BUTTON_MEDIUM = 32
SIZES.ICON_BUTTON_LARGE = 48
SIZES.HANDLE_WIDTH = 40
SIZES.HANDLE_HEIGHT = 4
SIZES.BORDER_WIDTH = 1
SIZES.BORDER_WIDTH_THICK = 2
SIZES.NAVBAR_HEIGHT = 56
SIZES.HEADER_SPACER_WIDTH = 60
SIZES.EVENT_IMAGE_SIZE = 96
SIZES.HOST_AVATAR_SIZE = 40
SIZES.KEYBOARD_OVERLAP = 30
```

## Layout Rules

### Screens
- Background: `COLORS.BG_SECONDARY`
- Padding: 24px horizontal
- Top padding: `insets.top + SIZES.SCREEN_TOP_PADDING` (16)
- Bottom padding: `isKeyboardVisible ? 20 : SIZES.TAB_BAR_HEIGHT + 20`

### Cards
- Background: `COLORS.CARD_BG` (white)
- Shadow: `SHADOW.standard`
- Border radius: 16-20px
- Padding: 16-20px

### Inputs (Profile style — preferred for forms)
- NO borders (use shadows instead)
- Wrapper: 24px border radius, 4px padding, white background, `SHADOW.standard`
- Inner input: 16px border radius, transparent background, no border
- Label: Uppercase, 12px, weight 700, `COLORS.TEXT_LIGHT`, above input with 8px gap
- Min height: 56px (`SIZES.INPUT_MIN_HEIGHT`)

### Inputs (CreateEvent style — for picker-like inputs)
- Border: 1px `COLORS.BORDER_COLOR`
- Border radius: 12px
- Shadow: `SHADOW.standard`
- No wrapper needed

### Cover Photo / Image Upload
```tsx
coverPhotoContainer: {
  height: SIZES.COVER_IMAGE_HEIGHT,  // 192
  borderRadius: 16,
  backgroundColor: COLORS.IMAGE_PLACEHOLDER_BG,
  borderWidth: SIZES.BORDER_WIDTH_THICK,  // 2
  borderColor: COLORS.BORDER_COLOR,
  borderStyle: 'dashed',
  overflow: 'hidden',
},
// Background: blurred placeholder image at opacity 0.2
// Overlay: centered icon (48x48 white circle) + text
// Remove button: top-right, 28x28, rgba(0,0,0,0.6), borderRadius 14
```

### Location Picker (map preview inside form)
```tsx
locationContainer: {
  backgroundColor: COLORS.CARD_BG,
  borderWidth: 1,
  borderColor: COLORS.BORDER_COLOR,
  borderRadius: 12,
  overflow: 'hidden',
  ...SHADOW.standard,
},
locationHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.BORDER_COLOR,
  backgroundColor: COLORS.LOCATION_HEADER_BG,  // subtle gray
},
mapPreview: {
  height: SIZES.MAP_PREVIEW_HEIGHT,  // 160
},
// Floating "Set Pin" button: bottom-right, white bg, borderRadius 8, shadow
```

### Modals / Bottom Sheets
- Background: `COLORS.BG_SECONDARY`
- Border radius: 24px (top corners only)
- Height: content-driven (no fixed height), use `maxHeight: SCREEN_HEIGHT * 0.9` as safety cap
- Handle: `SIZES.HANDLE_WIDTH x SIZES.HANDLE_HEIGHT` (40x4), `COLORS.GRAY_HANDLE` (#D1D1D1)
- NO close buttons (use swipe-down gesture)
- MUST be animated (never instant show/hide)
- Shadow: `SHADOW.modal`

#### Keyboard Handling in Bottom Sheets with TextInput
When a bottom sheet contains a `TextInput`, use `SIZES.KEYBOARD_OVERLAP` to let the keyboard slightly overlap the sheet bottom. This prevents the iOS keyboard's rounded corners from revealing a mismatched background color behind the sheet.

Two things must happen:

1. **Bottom sheet wrapper** — negative `keyboardVerticalOffset` so the sheet sits slightly behind the keyboard:
```tsx
<KeyboardAvoidingView
  style={{ flex: 1, justifyContent: 'flex-end' }}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  keyboardVerticalOffset={-SIZES.KEYBOARD_OVERLAP}
>
  {/* backdrop + animated sheet */}
</KeyboardAvoidingView>
```

2. **Content inside the sheet** — extra `paddingBottom` when keyboard is visible so content doesn't hide behind the overlap zone. Use `LayoutAnimation` for smooth transition:
```tsx
const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

useEffect(() => {
  const showListener = Keyboard.addListener('keyboardDidShow', () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsKeyboardVisible(true);
  });
  const hideListener = Keyboard.addListener('keyboardDidHide', () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsKeyboardVisible(false);
  });
  return () => { showListener.remove(); hideListener.remove(); };
}, []);

// Apply dynamic paddingBottom:
// keyboard open:  SIZES.KEYBOARD_OVERLAP + basePadding
// keyboard closed: insets.bottom + basePadding (or static value)
```

**Rules:**
- Always use `SIZES.KEYBOARD_OVERLAP` from `@shared/constants` — never hardcode the value
- Both the `keyboardVerticalOffset` (negative) and the content `paddingBottom` (positive) must use the same constant
- Always use `LayoutAnimation.configureNext` before `setState` for smooth padding transitions
- Bottom sheets WITHOUT TextInput don't need this pattern

### Social Media Inputs
```tsx
socialInputWrapper: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: COLORS.CARD_BG,
  borderRadius: 24,
  ...SHADOW.standard,
  padding: 4,
  minHeight: 56,
},
socialIcon: {
  width: 32,
  height: 32,
  borderRadius: 16,
  // backgroundColor: COLORS.INSTAGRAM_BG or COLORS.TELEGRAM_BG
},
// Icon is emoji (📷 or ✈️), fontSize: 18
```

### Date/Time Row (side by side)
```tsx
dateTimeRow: {
  flexDirection: 'row',
  gap: 16,
  marginBottom: 20,
},
dateTimeItem: {
  flex: 1,
},
dateTimeInput: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: COLORS.CARD_BG,
  borderWidth: 1,
  borderColor: COLORS.BORDER_COLOR,
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 12,
  ...SHADOW.standard,
},
// Icon: Clock size={18} color={COLORS.ACCENT_ORANGE}
// Text: fontSize 14, color GRAY_PLACEHOLDER (empty) or TEXT_DARK (filled)
```

## Error Patterns

### Field-level errors (inline, below input)
```tsx
<Text style={styles.fieldErrorText}>{fieldErrors.title}</Text>

fieldErrorText: {
  fontSize: 12,
  color: COLORS.ERROR_RED,
  marginTop: 4,
  marginLeft: 4,
  fontWeight: '500',
},
```

### Form-level error (simple, above button)
```tsx
{error ? <Text style={styles.errorText}>{error}</Text> : null}

errorText: {
  color: COLORS.ERROR_RED,
  fontSize: 14,
  marginBottom: 16,
  textAlign: 'center',
  backgroundColor: COLORS.ERROR_BG,
  padding: 12,
  borderRadius: 16,
  fontWeight: '500',
},
```

### Error banner (rich, with icon — for critical errors)
```tsx
<View style={styles.errorBanner}>
  <View style={styles.errorIconContainer}>
    <AlertTriangle size={18} color={COLORS.ERROR_RED} />
  </View>
  <View style={styles.errorContent}>
    <Text style={styles.errorTitle}>{t('actionRequired')}</Text>
    <Text style={styles.errorDescription}>{error}</Text>
  </View>
</View>

errorBanner: {
  backgroundColor: COLORS.ERROR_BG,
  borderWidth: 1,
  borderColor: COLORS.ERROR_RED,
  borderRadius: 16,
  padding: 16,
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 12,
},
errorIconContainer: {
  width: 32,  // SIZES.ICON_BUTTON_MEDIUM
  height: 32,
  borderRadius: 16,
  backgroundColor: COLORS.ERROR_BG_LIGHT,
  justifyContent: 'center',
  alignItems: 'center',
  flexShrink: 0,
},
errorTitle: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT_DARK, marginBottom: 4 },
errorDescription: { fontSize: 12, color: COLORS.TEXT_LIGHT, lineHeight: 16 },
```

### Chat error (inline, dismissible)
```tsx
errorContainer: {
  backgroundColor: COLORS.ERROR_BG,
  padding: 12,
  marginHorizontal: 16,
  marginVertical: 8,
  borderRadius: 12,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
// Dismiss button: same ERROR_RED color, fontWeight '600'
```

## Animation

**CRITICAL**: All UI transitions, state changes, and interactive elements MUST be animated.

### Required Animations

**Modals & Bottom Sheets:**
```typescript
// Show animation
Animated.spring(slideAnim, {
  toValue: 0,
  useNativeDriver: true,
  tension: 80,
  friction: 10,
}).start();

// Hide animation
Animated.timing(slideAnim, {
  toValue: height,
  duration: 250,
  useNativeDriver: true,
}).start();
```

**Component Appearance/Disappearance:**
```typescript
Animated.parallel([
  Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
  Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
]).start();
```

**Button Press Feedback:**
```typescript
Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true, tension: 300, friction: 10 }).start();
Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();
```

### Animation Guidelines
- Always use `useNativeDriver: true` for transform and opacity
- Spring for show/appear: tension 50-80, friction 7-11
- Timing for hide/disappear: 200-300ms
- Animate ALL state changes that affect visibility or layout

### What to Animate
✅ Modals and bottom sheets (show/hide)
✅ Component mount/unmount (fade in/out)
✅ State transitions (mode changes, toggles)
✅ Conditional rendering (buttons appearing/disappearing)
✅ Interactive feedback (button press, swipe)
✅ Loading states

### What NOT to Animate
❌ Text content changes
❌ Static layouts
❌ List scrolling (native behavior)
❌ Keyboard appearance (system handles it)

## Chat-Specific Patterns

### Message List
```tsx
<FlatList
  inverted                    // Newest at bottom
  contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
  maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 10 }}
  initialNumToRender={20}
  maxToRenderPerBatch={10}
  windowSize={21}
  removeClippedSubviews={true}
/>
```

### Message Bubbles
- Incoming: `COLORS.MESSAGE_INCOMING` (#F0F0F0), left-aligned
- Outgoing: `COLORS.MESSAGE_OUTGOING` (#FFE066, yellow), right-aligned

### Chat Input
- Sits at bottom with `paddingBottom: insets.bottom + 8`
- Background: `COLORS.BG_SECONDARY`
- Supports text, image, audio

## Loading States

### Full screen loading
```tsx
<View style={[styles.container, styles.loadingContainer]}>
  <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
</View>
// loadingContainer: flex: 1, justifyContent: 'center', alignItems: 'center'
```

### Inline loading (more messages)
```tsx
<ActivityIndicator size="small" color={COLORS.ACCENT_ORANGE} />
// Wrapped in paddingVertical: 16, alignItems: 'center'
```

### Button loading
```tsx
<PrimaryButton loading={isLoading} disabled={isLoading} />
// PrimaryButton handles spinner internally
```

## Best Practices

### DO
✅ Use constants from `@shared/constants` (COLORS, SIZES, BUTTON_STYLES, etc.)
✅ Use `GradientView` for orange gradient backgrounds (buttons, active segments, chips, handles)
✅ Use `gap` property for spacing between flex children
✅ Use `SHADOW.standard` for cards/inputs
✅ Use gray backgrounds for screens, white for cards
✅ Track keyboard visibility for dynamic bottom padding
✅ Use `useMemo` for expensive computations (hasChanges, etc.)
✅ Show action buttons conditionally based on state (hasChanges)
✅ Animate ALL UI transitions and state changes
✅ Use `numberOfLines={1}` on all titles/headers
✅ Use `keyboardShouldPersistTaps="handled"` on ScrollViews with inputs
✅ Use `KeyboardAvoidingView` with `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`
✅ Use `activeOpacity={0.6}` on TouchableOpacity for subtle feedback

### DON'T
❌ Don't use borders on Profile-style inputs (use shadows)
❌ Don't use colored shadows (except error state and active segment)
❌ Don't add icons to buttons (unless essential)
❌ Don't hardcode colors (use COLORS constants)
❌ Don't use `LinearGradient` with `GRADIENT_ORANGE` directly (use `GradientView`)
❌ Don't use `backgroundColor: COLORS.ACCENT_ORANGE` — ALWAYS replace with `GradientView` wrapper
❌ Don't use marginBottom (use gap in flex containers)
❌ Don't add close buttons to modals (swipe to dismiss)
❌ Don't use white backgrounds for screens
❌ Don't hardcode magic numbers (use SIZES constants)
❌ Don't show action buttons when not needed
❌ Don't use instant show/hide (always animate)
❌ Don't use `behavior="height"` on KeyboardAvoidingView for forms (use `'padding'` on iOS, `undefined` on Android)

## Accessibility
- Minimum touch target: 44x44px (back buttons: 40x40 with padding)
- Color contrast: 4.5:1 for text
- Font size: minimum 12px (labels), 14px for body
- Clear visual feedback for interactions
