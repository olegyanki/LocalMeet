# Design System

## Design Philosophy
Minimalist, clean, modern aesthetic with focus on content and usability. No unnecessary decorations, icons on buttons only when essential, consistent spacing and typography.

## Color Palette

### Primary Colors
- **ACCENT_ORANGE** (#FF7A00) - Primary actions, active states, highlights
- **TEXT_DARK** (#333333) - Primary text, headings
- **TEXT_LIGHT** (#999999) - Secondary text, labels, placeholders

### Background Colors
- **BG_SECONDARY** (#F2F2F7) - Main screen backgrounds
- **CARD_BG** (#FFFFFF) - Cards, inputs, elevated surfaces
- **INPUT_BG** (#F2F2F7) - Alternative input backgrounds

### Utility Colors
- **BORDER_COLOR** (#E8E8E8) - Dividers, borders
- **SUCCESS_GREEN** (#4CAF50) - Success states
- **ERROR_RED** (#FF3B30) - Error states, destructive actions

## Typography

### Font Sizes
- **34px** - Large titles (auth screens)
- **28px** - Page titles
- **22-24px** - Section titles, modal titles
- **17-18px** - Button text, important labels
- **16px** - Body text, input text
- **14-15px** - Secondary text, descriptions
- **11-12px** - Uppercase labels, hints

### Font Weights
- **700** - Titles, headings
- **600** - Labels, buttons, emphasis
- **500** - Regular text
- **400** - Light text (rarely used)

### Text Styles
- **Uppercase labels**: 11-12px, fontWeight 600, letterSpacing 0.5, textTransform 'uppercase'
- **Titles**: 22-34px, fontWeight 700
- **Body**: 15-16px, fontWeight 400-500
- **Buttons**: 16-17px, fontWeight 600

## Spacing

### Padding
- **Screen padding**: 20px horizontal
- **Card padding**: 16-20px
- **Input padding**: 14-16px vertical, 16px horizontal
- **Button padding**: 16-18px vertical
- **Section gaps**: 16-20px

### Margins
- **Between sections**: 20-24px
- **Between elements**: 8-12px
- **Header bottom**: 40px
- **Safe area top**: insets.top + 60px

### Border Radius
- **Cards**: 16-20px
- **Inputs**: 12px
- **Buttons**: 16-20px
- **Chips**: 20-24px
- **Modals**: 24px (top corners)

## Shadows

### Standard Shadow (Cards, Inputs)
```typescript
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.06,
shadowRadius: 8,
elevation: 2,
```

### NO Colored Shadows
Never use colored shadows (e.g., shadowColor: COLORS.ACCENT_ORANGE). Always use black with low opacity.

## Components

### Buttons
- **Primary**: Orange background, white text, 16px vertical padding, 16px border radius
- **No icons**: Buttons should not have icons unless absolutely necessary
- **Disabled state**: opacity 0.6

### Inputs
- **Background**: White (CARD_BG) with shadow
- **No borders**: Use shadows instead of borders
- **Padding**: 14px vertical, 16px horizontal
- **Border radius**: 12px
- **Label**: Uppercase, 14px, above input with 8px gap

### Cards
- **Background**: White (CARD_BG)
- **Shadow**: Standard shadow (0.06 opacity)
- **Border radius**: 16-20px
- **Padding**: 16-20px
- **On gray background**: Always use BG_SECONDARY for screen backgrounds

### Labels
- **Style**: Uppercase, 11-14px, fontWeight 600, letterSpacing 0.5
- **Color**: TEXT_DARK or TEXT_LIGHT
- **Position**: Above inputs/sections with 8-12px gap

### Bottom Sheets / Modals
- **Background**: BG_SECONDARY (gray)
- **Border radius**: 24px (top corners only)
- **Handle**: 40x4px, BORDER_COLOR, centered, 12-20px margin bottom
- **Padding**: 20px horizontal, 40px bottom
- **No close buttons**: Use swipe-down gesture only (unless essential)

### Error Messages
- **Background**: #FFE5E5
- **Text color**: #FF3B30
- **Padding**: 12px
- **Border radius**: 12px
- **Font size**: 14px, fontWeight 500

### Chips / Tags
- **Background**: CARD_BG with shadow (inactive) or ACCENT_ORANGE (active)
- **Text**: TEXT_DARK (inactive) or white (active)
- **Padding**: 12-14px vertical, 20-24px horizontal
- **Border radius**: 20-24px
- **Font**: 13-14px, fontWeight 500-600

## Layout Patterns

### Screen Structure
```typescript
<View style={{ backgroundColor: COLORS.BG_SECONDARY }}>
  <View style={{ padding: 20, paddingTop: insets.top + 60 }}>
    <View style={styles.header}>
      <Text style={styles.title}>Title</Text>
      <Text style={styles.subtitle}>Subtitle</Text>
    </View>
    
    <View style={styles.content}>
      {/* Cards with white background and shadows */}
    </View>
  </View>
</View>
```

### Form Structure
```typescript
<View style={{ gap: 20 }}>
  <View style={{ gap: 8 }}>
    <Text style={styles.label}>LABEL</Text>
    <TextInput style={styles.input} />
  </View>
  
  <TouchableOpacity style={styles.button}>
    <Text style={styles.buttonText}>Action</Text>
  </TouchableOpacity>
</View>
```

### Card Structure
```typescript
<View style={{
  backgroundColor: COLORS.CARD_BG,
  borderRadius: 16,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
}}>
  {/* Content */}
</View>
```

## Best Practices

### DO
- Use COLORS constants from `@shared/constants`
- Use gap property for spacing between elements
- Add shadows to cards and inputs (0.06 opacity)
- Use uppercase labels with letterSpacing
- Keep padding consistent (20px screens, 16-20px cards)
- Use gray backgrounds (BG_SECONDARY) for screens
- Use white backgrounds (CARD_BG) for cards/inputs
- Group related inputs with labels (inputGroup pattern)

### DON'T
- Don't use borders on inputs (use shadows instead)
- Don't use colored shadows on buttons
- Don't add icons to buttons unless necessary
- Don't use hardcoded colors (use COLORS constants)
- Don't use marginBottom (use gap instead)
- Don't add close buttons to modals (use swipe gesture)
- Don't use white backgrounds for screens
- Don't use heavy shadows (keep opacity low)

## Accessibility
- Minimum touch target: 44x44px
- Color contrast ratio: 4.5:1 for text
- Font size: minimum 14px for body text
- Clear visual feedback for interactive elements

## Animation
- Use spring animations for natural feel
- Duration: 200-300ms for quick transitions
- Tension: 50-80, Friction: 8-11 for springs
- Always use useNativeDriver: true when possible
- **CRITICAL**: All modals, bottom sheets, and UI transitions MUST be animated
- Never show/hide components instantly - always animate in/out
- Use Animated.spring for show animations, Animated.timing for hide animations
