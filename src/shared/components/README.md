# Shared Components

## PrimaryButton

Reusable primary button component with consistent styling across the app.

### Usage

```typescript
import PrimaryButton from '@shared/components/PrimaryButton';

// Basic usage
<PrimaryButton
  title="Save Changes"
  onPress={handleSave}
/>

// With loading state
<PrimaryButton
  title="Save Changes"
  onPress={handleSave}
  loading={isSaving}
  disabled={isSaving}
/>

// With check icon
<PrimaryButton
  title="Save Changes"
  onPress={handleSave}
  showCheckIcon={true}
/>

// With custom styles
<PrimaryButton
  title="Save Changes"
  onPress={handleSave}
  style={{ marginTop: 20 }}
  textStyle={{ fontSize: 18 }}
/>
```

### Props

- `title` (string, required) - Button text
- `onPress` (function, required) - Callback when button is pressed
- `disabled` (boolean, optional) - Disable button interaction
- `loading` (boolean, optional) - Show loading spinner
- `showCheckIcon` (boolean, optional) - Show check icon after text
- `style` (ViewStyle, optional) - Custom button styles
- `textStyle` (TextStyle, optional) - Custom text styles

## Shared Styles

Reusable style constants available in `@shared/constants/styles`:

- `BUTTON_STYLES` - Primary button styles
- `INPUT_STYLES` - Input wrapper, input, and label styles
- `CHIP_STYLES` - Active and inactive chip styles
- `SHADOW` - Standard and elevated shadow styles

### Usage

```typescript
import { INPUT_STYLES, CHIP_STYLES, SHADOW } from '@shared/constants';

const styles = StyleSheet.create({
  input: INPUT_STYLES.input,
  label: INPUT_STYLES.label,
  chip: CHIP_STYLES.active,
  card: {
    ...SHADOW.standard,
    backgroundColor: COLORS.CARD_BG,
  },
});
```
