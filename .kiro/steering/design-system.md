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
HEADER_STYLES.title // Centered title (24px, for full-screen headers)
HEADER_STYLES.headerTextButton // Action button (right side)
HEADER_STYLES.spacer // Spacer for centering (60px)
```

### Navigation Bar
```typescript
NAVBAR_STYLES.backButton // Back button (40x40px) - use for left side when needed
NAVBAR_STYLES.title // Centered title (24px) - universal for all navbars
NAVBAR_STYLES.spacer // Spacer for centering (40px) - use when no action on side
```

**Universal Pattern (works with or without back button):**
```tsx
import { NAVBAR_STYLES } from '@shared/constants';

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

// Without back button (centered title)
<View style={styles.navbar}>
  <View style={NAVBAR_STYLES.spacer} />
  <Text style={NAVBAR_STYLES.title} numberOfLines={1}>
    {title}
  </Text>
  <View style={NAVBAR_STYLES.spacer} />
</View>

// With action button on right
<View style={styles.navbar}>
  <TouchableOpacity onPress={handleBack} style={NAVBAR_STYLES.backButton}>
    <ChevronLeft size={24} color={COLORS.TEXT_DARK} />
  </TouchableOpacity>
  <Text style={NAVBAR_STYLES.title} numberOfLines={1}>
    {title}
  </Text>
  <TouchableOpacity onPress={handleAction}>
    <Text style={styles.actionButton}>{actionText}</Text>
  </TouchableOpacity>
</View>
```

**Rules:**
- Always use `NAVBAR_STYLES.title` for navbar titles (17px, centered)
- Use `NAVBAR_STYLES.spacer` (32px) when no element on left/right side
- Use `NAVBAR_STYLES.backButton` (32x32px) for back buttons
- Title always has `flex: 1` and `textAlign: 'center'` for centering
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

**CRITICAL**: All modals, bottom sheets, and UI transitions MUST be animated.

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

- Always use `useNativeDriver: true`
- Spring for show: tension 50-80, friction 8-11
- Timing for hide: 200-300ms

## Best Practices

### DO
✅ Use constants from `@shared/constants` (COLORS, SIZES, BUTTON_STYLES, etc.)
✅ Use `gap` property for spacing
✅ Use `SHADOW.standard` for cards/inputs
✅ Use gray backgrounds for screens, white for cards
✅ Track keyboard visibility for dynamic padding
✅ Use `useMemo` for expensive computations
✅ Show buttons conditionally based on state
✅ Animate all modals and transitions
✅ Use PanResponder for swipe gestures

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

## Accessibility
- Minimum touch target: 44x44px
- Color contrast: 4.5:1 for text
- Font size: minimum 14px for body
- Clear visual feedback for interactions
