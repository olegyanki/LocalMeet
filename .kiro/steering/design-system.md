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
- **Input wrappers**: 24px
- **Inner inputs**: 16px
- **Buttons**: 24px
- **Chips**: 16px
- **Modals**: 24px (top corners)
- **Avatar**: 32px

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
- **Primary**: Orange background, white text, 18px vertical padding, 24px border radius
- **Text**: 16px, fontWeight 700
- **Shadow**: Black with opacity 0.15, offset (0, 4), radius 12
- **No icons**: Buttons should not have icons unless absolutely necessary (exception: check icon on save buttons)
- **Disabled state**: opacity 0.6

### Inputs
- **Background**: White (CARD_BG) with shadow
- **No borders**: Use shadows instead of borders
- **Wrapper**: 24px border radius, 4px padding
- **Inner input**: 16px border radius, 14px vertical padding, 16px horizontal padding
- **Label**: Uppercase, 12px, fontWeight 700, above input with 8px gap
- **Min height**: 56px for single-line inputs

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
- **Padding**: 8px vertical, 16px horizontal
- **Border radius**: 16px
- **Font**: 14px, fontWeight 500
- **Shadow** (active): Black with opacity 0.06, offset (0, 2), radius 8

## Layout Patterns

### Screen Structure with Keyboard Handling
```typescript
import { Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SIZES } from '@shared/constants';

export default function Screen() {
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Track keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { 
            paddingTop: insets.top + 16, 
            paddingBottom: isKeyboardVisible ? 20 : SIZES.TAB_BAR_HEIGHT + 20 
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Content */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  content: {
    paddingHorizontal: 24,
  },
});
```

### Screen Header with Conditional Actions
```typescript
// Header with title on left, conditional action button on right
<View style={styles.header}>
  <Text style={styles.title}>{t('screenTitle')}</Text>
  {hasChanges && (
    <TouchableOpacity onPress={handleCancel}>
      <Text style={styles.actionButton}>{t('cancel')}</Text>
    </TouchableOpacity>
  )}
</View>

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  actionButton: {
    fontSize: 16,
    color: COLORS.ACCENT_ORANGE,
    fontWeight: '600',
  },
});
```

### Form Structure with Labels and Inputs
```typescript
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

const styles = StyleSheet.create({
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
});
```

### Chips Container with Add Button
```typescript
<View style={styles.inputGroup}>
  <Text style={styles.label}>{t('interests').toUpperCase()}</Text>
  <View style={styles.chipsContainer}>
    {items.map((item) => (
      <TouchableOpacity
        key={item.key}
        style={styles.chip}
        onPress={() => toggleItem(item.key)}
      >
        <Text style={styles.chipText}>
          {item.emoji} {t(item.key)}
        </Text>
      </TouchableOpacity>
    ))}
    <TouchableOpacity
      style={styles.addChip}
      onPress={() => setShowPicker(true)}
    >
      <Plus size={14} color={COLORS.ACCENT_ORANGE} />
      <Text style={styles.addChipText}>{t('add')}</Text>
    </TouchableOpacity>
  </View>
</View>

const styles = StyleSheet.create({
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.CARD_BG,
    fontWeight: '500',
  },
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
});
```

### Conditional Save Button
```typescript
// Show save button only when there are changes
{hasChanges && (
  <PrimaryButton
    title={t('saveChanges')}
    onPress={handleSave}
    disabled={isSaving}
    loading={isSaving}
    style={{ marginTop: 16 }}
  />
)}

// Track changes with useMemo
const hasChanges = React.useMemo(() => {
  if (!originalData) return false;
  
  return (
    field1 !== (originalData.field1 || '') ||
    field2 !== (originalData.field2 || '') ||
    JSON.stringify(arrayField) !== JSON.stringify(originalData.arrayField || [])
  );
}, [field1, field2, arrayField, originalData]);
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

### Modal/Bottom Sheet Structure
```typescript
import { BlurView } from 'expo-blur';

// 88-92% height bottom sheet with animations
const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
const panY = useRef(new Animated.Value(0)).current;

// Pan responder for swipe-down gesture
const panResponder = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        panY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100 || gestureState.vy > 0.5) {
        handleClose();
      } else {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      }
    },
  })
).current;

// Animate in/out
useEffect(() => {
  if (visible) {
    panY.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  } else {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').height,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }
}, [visible]);

<Modal visible={visible} transparent animationType="none">
  <View style={styles.modalContainer}>
    <TouchableOpacity style={styles.backdrop} onPress={handleClose}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
      ) : (
        <View style={styles.androidBackdrop} />
      )}
    </TouchableOpacity>

    <Animated.View
      style={[
        styles.bottomSheet,
        { transform: [{ translateY: Animated.add(slideAnim, panY) }] },
      ]}
    >
      <View {...panResponder.panHandlers} style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      <View style={styles.header}>
        <View style={{ width: 60 }} />
        <Text style={styles.title}>{t('title')}</Text>
        <TouchableOpacity onPress={handleConfirm}>
          <Text style={styles.doneButton}>{t('done')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>{/* Content */}</ScrollView>
    </Animated.View>
  </View>
</Modal>

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  androidBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomSheet: {
    backgroundColor: COLORS.BG_SECONDARY,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 8,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 6,
    backgroundColor: COLORS.BORDER_COLOR,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
    flex: 1,
    textAlign: 'center',
  },
  doneButton: {
    width: 60,
    alignItems: 'flex-end',
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ACCENT_ORANGE,
  },
});
```

### Primary Button Structure
```typescript
<TouchableOpacity style={styles.primaryButton}>
  <Text style={styles.primaryButtonText}>Save Changes</Text>
  <Text style={styles.checkIcon}>✓</Text>
</TouchableOpacity>

// Styles
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: COLORS.CARD_BG,
    fontSize: 16,
    fontWeight: '700',
  },
  checkIcon: {
    color: COLORS.CARD_BG,
    fontSize: 20,
    fontWeight: '700',
  },
});
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
- Use SIZES constants for consistent dimensions (TAB_BAR_HEIGHT, etc.)
- Use gap property for spacing between elements
- Add shadows to cards and inputs (0.06 opacity)
- Use uppercase labels with letterSpacing
- Keep padding consistent (24px screens, 16-20px cards)
- Use gray backgrounds (BG_SECONDARY) for screens
- Use white backgrounds (CARD_BG) for cards/inputs
- Group related inputs with labels (inputGroup pattern)
- Track keyboard visibility to adjust paddingBottom dynamically
- Use useMemo for expensive computations (like hasChanges)
- Show action buttons conditionally based on state
- Always animate modals/bottom sheets (never instant show/hide)
- Use PanResponder for swipe-down gestures on modals
- Extract reusable data to shared constants (languages, interests, etc.)
- Use centralized helper functions (getLanguageByCode, getInterestByKey)

### DON'T
- Don't use borders on inputs (use shadows instead)
- Don't use colored shadows on buttons
- Don't add icons to buttons unless necessary
- Don't use hardcoded colors (use COLORS constants)
- Don't use marginBottom (use gap instead)
- Don't add close buttons to modals (use swipe gesture)
- Don't use white backgrounds for screens
- Don't use heavy shadows (keep opacity low)
- Don't hardcode magic numbers (extract to constants)
- Don't duplicate data structures across files
- Don't show buttons when they're not needed (use conditional rendering)

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
