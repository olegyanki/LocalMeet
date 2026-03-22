# Shared Components

## ImageGrid

Displays images in an organized grid layout with different arrangements based on image count. Used for displaying multiple images in chat messages.

### Usage

```typescript
import ImageGrid from '@shared/components/ImageGrid';

<ImageGrid
  images={imageUrls}
  maxWidth={220}
  onImagePress={(images, index) => openImageViewer(images, index)}
/>
```

### Props

- `images` (string[], required) - Array of image URLs to display
- `maxWidth` (number, required) - Maximum width for the grid container
- `onImagePress` (function, optional) - Callback when an image is tapped, receives (images, index)

### Layout Algorithm

- **1 image**: Square layout (maxWidth × maxWidth)
- **2 images**: Horizontal row with equal widths
- **3 images**: Horizontal row with equal widths
- **4+ images**: 2×2 grid showing first 4 images with "+N" overlay on 4th image

### Features

- Responsive layout based on image count
- 8px border radius on all images
- "+N" overlay for remaining images (when more than 4)
- Tappable images for full-screen viewing
- Uses CachedImage for optimized loading
- 4px gap between images

## ImagePreviewBar

Horizontal scrollable bar displaying image thumbnails with remove buttons. Used for previewing selected images before sending.

### Usage

```typescript
import ImagePreviewBar, { ImagePreview } from '@shared/components/ImagePreviewBar';

const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);

const handleRemoveImage = (imageId: string) => {
  setSelectedImages(prev => prev.filter(img => img.id !== imageId));
};

<ImagePreviewBar
  images={selectedImages}
  onRemove={handleRemoveImage}
  maxImages={10}
/>
```

### Props

- `images` (ImagePreview[], required) - Array of images to display
- `onRemove` (function, required) - Callback when remove button is pressed, receives imageId
- `maxImages` (number, optional) - Maximum number of images allowed (default: 10)

### ImagePreview Interface

```typescript
interface ImagePreview {
  uri: string;                      // Local URI of the image
  asset: ImagePicker.ImagePickerAsset; // Original picker asset
  id: string;                       // Unique identifier for React keys
}
```

### Features

- 56x56px thumbnails with 8px border radius
- Horizontal scrolling for multiple images
- Remove button (X icon) overlay on each thumbnail
- Automatically hides when no images
- Cover fit for optimal thumbnail display

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
