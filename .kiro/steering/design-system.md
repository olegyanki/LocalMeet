# Design System

## Design Philosophy
Minimalist, clean, modern aesthetic. Focus on content and usability. No unnecessary decorations, icons on buttons only when essential.

## Colors
Always use constants from `@shared/constants/colors.ts`:

### Primary
- `COLORS.ACCENT_ORANGE` (#FF7A00) - Primary actions, active states
- `COLORS.GRADIENT_ORANGE` - Array for gradient backgrounds
- `COLORS.TEXT_DARK` (#333333) - Primary text, headings
- `COLORS.TEXT_LIGHT` (#999999) - Secondary text, labels

### Backgrounds
- `COLORS.BG_SECONDARY` (#F2F2F7) - Screen backgrounds
- `COLORS.CARD_BG` (#FFFFFF) - Cards, inputs, elevated surfaces

### Utility
- `COLORS.BORDER_COLOR` (#E8E8E8) - Dividers, borders
- `COLORS.SUCCESS_GREEN` - Success states
- `COLORS.ERROR_RED` (#FF3B30) - Errors, destructive actions
- `COLORS.ERROR_BG` (#FFE5E5) - Error message backgrounds

## Typography

### Sizes
- 34px - Large titles (auth screens)
- 24-28px - Page titles
- 22px - Section titles, modal titles
- 16-18px - Button text, body text, inputs
- 14-15px - Secondary text, descriptions
- 11-12px - Uppercase labels, hints

### Weights
- 700 - Titles, headings
- 600 - Labels, buttons, emphasis
- 500 - Regular text
- 400 - Light text (rarely)

### Patterns
- Uppercase labels: 11-12px, weight 600, letterSpacing 0.5
- Titles: 22-34px, weight 700
- Buttons: 16-17px, weight 600

## Spacing

### Padding
- Screens: 24px horizontal
- Cards: 16-20px
- Inputs: 14-16px vertical, 16px horizontal
- Buttons: 16-18px vertical
- Sections: 16-20px gap

### Margins
- Between sections: 20-24px
- Between elements: 8-12px
- Use `gap` property instead of marginBottom

### Border Radius
- Cards: 16-20px
- Input wrappers: 24px
- Inner inputs: 16px
- Buttons: 24px
- Chips: 16px
- Modals: 24px (top corners)

## Shadows

Use constants from `@shared/constants/styles.ts`:

```typescript
// Standard shadow (cards, inputs)
SHADOW.standard: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
}

// Elevated shadow (buttons)
SHADOW.elevated: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 4,
}
```

**NEVER** use colored shadows (e.g., shadowColor: COLORS.ACCENT_ORANGE). Always black with low opacity.

## Component Styles

Use constants from `@shared/constants/styles.ts`:

### Buttons
```typescript
BUTTON_STYLES.primary // Orange background, white text
BUTTON_STYLES.primaryText // Text style
BUTTON_STYLES.disabled // Disabled state (opacity 0.6)
```

### Inputs
```typescript
INPUT_STYLES.wrapper // Outer wrapper with shadow
INPUT_STYLES.input // Inner input field
INPUT_STYLES.label // Uppercase label above input
```

### Chips
```typescript
CHIP_STYLES.active // Active chip with orange background
CHIP_STYLES.activeText // White text for active chips
CHIP_STYLES.inactive // Inactive chip with light orange background
CHIP_STYLES.inactiveText // Orange text for inactive chips
```

### Headers
```typescript
HEADER_STYLES.container // Header container (with padding)
HEADER_STYLES.title // Left-aligned title (28px, for screen headers)
HEADER_STYLES.headerTextButton // Action button (right side)
HEADER_STYLES.spacer // Spacer for layout (60px)
```

**Universal Header Pattern (left-aligned titles):**
```tsx
import { HEADER_STYLES } from '@shared/constants';

// Screen header with title only
<View style={styles.header}>
  <Text style={styles.title}>{t('screenTitle')}</Text>
</View>

const styles = StyleSheet.create({
  header: {
    ...HEADER_STYLES.container,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    flex: 1,
  },
});

// Screen header with title and action button
<View style={styles.header}>
  <Text style={styles.title}>{t('screenTitle')}</Text>
  <TouchableOpacity onPress={handleAction}>
    <Text style={styles.actionButton}>{t('action')}</Text>
  </TouchableOpacity>
</View>

// Screen header with back button, title, and optional action
<View style={styles.header}>
  <TouchableOpacity onPress={handleBack} style={styles.backButton}>
    <ChevronLeft size={28} color={COLORS.TEXT_DARK} />
  </TouchableOpacity>
  <Text style={styles.title}>{t('screenTitle')}</Text>
  {showAction && (
    <TouchableOpacity onPress={handleAction}>
      <Text style={styles.actionButton}>{t('action')}</Text>
    </TouchableOpacity>
  )}
</View>
```

**Rules:**
- All screen titles are left-aligned (28px, fontWeight 700)
- Use flexDirection: 'row' for headers with multiple elements
- Back buttons are 28px icons with padding
- Action buttons are text buttons on the right side
- Title uses `flex: 1` to take available space
- Title uses `numberOfLines={1}` to prevent overflow

## Layout Rules

### Screens
- Background: `COLORS.BG_SECONDARY` (gray)
- Padding: 24px horizontal
- Top padding: `insets.top + 16`
- Bottom padding: `isKeyboardVisible ? 20 : SIZES.TAB_BAR_HEIGHT + 20`

### Cards
- Background: `COLORS.CARD_BG` (white)
- Shadow: `SHADOW.standard`
- Border radius: 16-20px
- Padding: 16-20px

### Inputs
- NO borders (use shadows instead)
- Wrapper: 24px border radius, 4px padding, white background
- Inner input: 16px border radius, transparent background
- Label: Uppercase, above input with 8px gap
- Min height: 56px

### Modals/Bottom Sheets
- Background: `COLORS.BG_SECONDARY` (gray)
- Border radius: 24px (top corners only)
- Height: 88-92%
- Handle: 40x4px, `COLORS.BORDER_COLOR`
- NO close buttons (use swipe-down gesture)
- MUST be animated (never instant show/hide)

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
// Fade in + scale up
Animated.parallel([
  Animated.timing(opacity, {
    toValue: 1,
    duration: 200,
    useNativeDriver: true,
  }),
  Animated.spring(scale, {
    toValue: 1,
    useNativeDriver: true,
    tension: 50,
    friction: 7,
  }),
]).start();

// Fade out + scale down
Animated.parallel([
  Animated.timing(opacity, {
    toValue: 0,
    duration: 200,
    useNativeDriver: true,
  }),
  Animated.timing(scale, {
    toValue: 0.9,
    duration: 200,
    useNativeDriver: true,
  }),
]).start();
```

**State Transitions (e.g., mode changes):**
```typescript
// Cross-fade between states
Animated.parallel([
  Animated.timing(oldStateOpacity, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  }),
  Animated.timing(newStateOpacity, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }),
]).start();
```

**Button Press Feedback:**
```typescript
// Scale down on press
Animated.spring(buttonScale, {
  toValue: 0.95,
  useNativeDriver: true,
  tension: 300,
  friction: 10,
}).start();

// Scale back on release
Animated.spring(buttonScale, {
  toValue: 1,
  useNativeDriver: true,
  tension: 300,
  friction: 10,
}).start();
```

### Animation Guidelines

- Always use `useNativeDriver: true` for transform and opacity
- Spring for show/appear: tension 50-80, friction 7-11
- Timing for hide/disappear: 200-300ms
- Use `Animated.parallel()` for simultaneous animations
- Use `Animated.sequence()` for sequential animations
- Animate ALL state changes that affect visibility or layout
- Animate mode transitions (normal → locked, edit → view, etc.)
- Add scale feedback to interactive elements

### What to Animate

✅ Modals and bottom sheets (show/hide)
✅ Component mount/unmount (fade in/out)
✅ State transitions (mode changes, toggles)
✅ Conditional rendering (buttons appearing/disappearing)
✅ Interactive feedback (button press, swipe)
✅ Loading states (spinner, skeleton)
✅ Error messages (slide in/out)
✅ Tooltips and hints (fade in/out)

### What NOT to Animate

❌ Text content changes (just swap)
❌ Static layouts (no state change)
❌ List scrolling (native behavior)
❌ Keyboard appearance (system handles it)

## Best Practices

### DO
✅ Use constants from `@shared/constants` (COLORS, SIZES, BUTTON_STYLES, etc.)
✅ Use `gap` property for spacing
✅ Use `SHADOW.standard` for cards/inputs
✅ Use gray backgrounds for screens, white for cards
✅ Track keyboard visibility for dynamic padding
✅ Use `useMemo` for expensive computations
✅ Show buttons conditionally based on state
✅ Animate ALL UI transitions and state changes
✅ Animate component appearance/disappearance
✅ Animate mode transitions (normal ↔ locked, edit ↔ view)
✅ Use PanResponder for swipe gestures
✅ Add scale feedback to interactive elements

### DON'T
❌ Don't use borders on inputs (use shadows)
❌ Don't use colored shadows
❌ Don't add icons to buttons (unless essential)
❌ Don't hardcode colors (use COLORS constants)
❌ Don't use marginBottom (use gap)
❌ Don't add close buttons to modals
❌ Don't use white backgrounds for screens
❌ Don't hardcode magic numbers
❌ Don't show buttons when not needed
❌ Don't use instant show/hide (always animate)
❌ Don't use conditional rendering without animation for state changes

## Accessibility
- Minimum touch target: 44x44px
- Color contrast: 4.5:1 for text
- Font size: minimum 14px for body
- Clear visual feedback for interactions
