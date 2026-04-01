# Requirements Document

## Introduction

Ця фіча змінює поведінку кнопки "+" у TabBar: замість переходу на таб створення івенту, кнопка відкриває bottom sheet поверх поточного екрану. Bottom sheet містить новий "Live" екран — мінімальний флоу для швидкої публікації поточного стану юзера на карті (live-стікер). Також надається secondary action для переходу до повного флоу створення івенту.

## Glossary

- **TabBar**: Нижня навігаційна панель з табами (Search, +, Chats, Profile, Settings)
- **Plus_Button**: Кнопка "+" у TabBar, яка раніше переключала на таб `create-event`
- **Live_Bottom_Sheet**: Модальний bottom sheet, що відкривається при натисканні Plus_Button
- **Live_Screen**: Контент всередині Live_Bottom_Sheet — форма для публікації live-стану
- **Live_Sticker**: Маркер на карті, що відображає поточний стан юзера ("зараз гуляю")
- **Tab_Navigator**: Expo Router Tabs-навігатор у `app/(tabs)/_layout.tsx`
- **Create_Event_Tab**: Існуючий таб `create-event` з екраном створення івенту
- **Drag_Handle**: Візуальний індикатор (40×4px) у верхній частині bottom sheet для свайп-жесту
- **Overlay**: Напівпрозорий фон (`rgba(0,0,0,0.5)`) поза bottom sheet
- **Safe_Area**: Системні відступи пристрою (notch, home indicator) через `useSafeAreaInsets`
- **Keyboard_Avoidance**: Механізм зміщення контенту при появі клавіатури

---

## Requirements

### Requirement 1: Зміна поведінки Plus_Button

**User Story:** As a user, I want tapping the "+" button to open a bottom sheet without switching tabs, so that I stay on my current screen and can quickly publish my live status.

#### Acceptance Criteria

1. WHEN the user taps Plus_Button, THE Tab_Navigator SHALL NOT navigate to the Create_Event_Tab.
2. WHEN the user taps Plus_Button, THE Live_Bottom_Sheet SHALL appear as an overlay above the current tab screen.
3. WHILE any tab is active, THE Plus_Button SHALL remain visible and tappable in the TabBar.
4. WHEN the user taps Plus_Button, THE Tab_Navigator SHALL keep the currently active tab selected.

---

### Requirement 2: Live_Bottom_Sheet — поведінка та анімація

**User Story:** As a user, I want the bottom sheet to feel native and dismissible, so that I can open and close it without friction.

#### Acceptance Criteria

1. WHEN Live_Bottom_Sheet opens, THE Live_Bottom_Sheet SHALL animate in from the bottom using a spring animation (tension: 80, friction: 10).
2. WHEN Live_Bottom_Sheet closes, THE Live_Bottom_Sheet SHALL animate out downward using a timing animation (duration: 250ms).
3. THE Live_Bottom_Sheet SHALL cover approximately 70% of the screen height.
4. THE Live_Bottom_Sheet SHALL display a Drag_Handle (40×4px, color `COLORS.GRAY_HANDLE`) centered at the top.
5. THE Live_Bottom_Sheet SHALL have 24px top border radius on both top corners.
6. THE Live_Bottom_Sheet SHALL apply `SHADOW.modal` shadow.
7. WHEN the user swipes the Live_Bottom_Sheet downward past a threshold of 80px, THE Live_Bottom_Sheet SHALL close with a dismiss animation.
8. WHEN the user taps the Overlay outside the Live_Bottom_Sheet, THE Live_Bottom_Sheet SHALL close with a dismiss animation.
9. WHEN Live_Bottom_Sheet is visible, THE Overlay SHALL be rendered with `rgba(0,0,0,0.5)` background behind the sheet.
10. WHEN Live_Bottom_Sheet opens, THE Live_Screen text input SHALL receive autofocus.

---

### Requirement 3: Live_Screen — контент та UI

**User Story:** As a user, I want a minimal, fast form to publish my current walking status, so that I can go live on the map with minimum friction.

#### Acceptance Criteria

1. THE Live_Screen SHALL display a title text bound to translation key `liveTitle` (Ukrainian: "Я зараз гуляю").
2. THE Live_Screen SHALL display a subtitle text bound to translation key `liveSubtitle` (Ukrainian: "Поділись що робиш і знайди компанію поруч").
3. THE Live_Screen SHALL display a single multiline TextInput with placeholder bound to translation key `livePlaceholder` (Ukrainian: "Йду пити каву біля моря, приєднуйтесь").
4. THE Live_Screen SHALL display a primary PrimaryButton with title bound to translation key `livePublishButton` (Ukrainian: "Показати на карті").
5. THE Live_Screen SHALL display a secondary action row at the bottom with text bound to `liveSecondaryText` (Ukrainian: "Хочеш щось запланувати?") and a link button bound to `liveSecondaryButton` (Ukrainian: "Створити івент →").
6. THE Live_Screen SHALL use `COLORS.BG_SECONDARY` as background, `COLORS.CARD_BG` for the input, and `COLORS.ACCENT_ORANGE` for primary actions, consistent with the design system.
7. THE Live_Screen SHALL apply `paddingBottom` equal to `insets.bottom + 16` to respect Safe_Area at the bottom.

---

### Requirement 4: Keyboard handling у Live_Bottom_Sheet

**User Story:** As a user, I want the publish button to remain accessible when the keyboard is open, so that I can submit without dismissing the keyboard first.

#### Acceptance Criteria

1. WHEN the keyboard appears while Live_Bottom_Sheet is open, THE Live_Bottom_Sheet SHALL shift upward so the PrimaryButton remains visible above the keyboard.
2. WHEN the keyboard appears while Live_Bottom_Sheet is open, THE Live_Bottom_Sheet SHALL use `KeyboardAvoidingView` with `behavior='padding'` on iOS and `behavior='height'` on Android.
3. WHILE the keyboard is visible, THE PrimaryButton SHALL remain pinned at the bottom of the visible area above the keyboard.
4. IF the keyboard appears and the Live_Bottom_Sheet content overflows, THE Live_Screen SHALL allow vertical scrolling via `ScrollView` with `keyboardShouldPersistTaps="handled"`.

---

### Requirement 5: Публікація live-стану ("Показати на карті")

**User Story:** As a user, I want tapping "Показати на карті" to create my live sticker on the map and close the sheet, so that others can see I'm available nearby.

#### Acceptance Criteria

1. WHEN the user taps the PrimaryButton, THE Live_Screen SHALL call the API to create a Live_Sticker associated with the current user's location and the entered status text.
2. WHEN the API call succeeds, THE Live_Bottom_Sheet SHALL close with a dismiss animation.
3. WHEN the API call is in progress, THE PrimaryButton SHALL display a loading indicator and be disabled.
4. IF the API call fails, THE Live_Screen SHALL display an inline error message bound to translation key `livePublishError` without closing the sheet.
5. IF the user has not entered any text, THE PrimaryButton SHALL remain enabled and submit with an empty status text.

---

### Requirement 6: Secondary action — перехід до Create_Event_Tab

**User Story:** As a user, I want a quick way to switch to the full event creation flow from the Live sheet, so that I can plan something more structured if needed.

#### Acceptance Criteria

1. WHEN the user taps the secondary link button ("Створити івент →"), THE Live_Bottom_Sheet SHALL close with a dismiss animation.
2. WHEN the Live_Bottom_Sheet dismiss animation completes, THE Tab_Navigator SHALL navigate to the Create_Event_Tab.
3. WHEN the user arrives at Create_Event_Tab via this action, THE Create_Event_Tab SHALL display the existing CreateEventScreen.

---

### Requirement 7: i18n — переклади

**User Story:** As a developer, I want all Live_Screen text to use the i18n system, so that the feature supports both Ukrainian and English.

#### Acceptance Criteria

1. THE Live_Screen SHALL retrieve all display strings via `t('key')` from `useI18n()`.
2. THE i18n system SHALL contain Ukrainian translations for keys: `liveTitle`, `liveSubtitle`, `livePlaceholder`, `livePublishButton`, `liveSecondaryText`, `liveSecondaryButton`, `livePublishError`.
3. THE i18n system SHALL contain English translations for all keys listed in criterion 2.

---

### Requirement 8: Інтеграція з Tab_Navigator

**User Story:** As a developer, I want the Plus_Button interception to be implemented cleanly in the tab layout, so that the rest of the navigation is unaffected.

#### Acceptance Criteria

1. THE Tab_Navigator SHALL intercept the Plus_Button press via a custom `tabPress` event listener or a custom `tabBarButton` render prop, preventing default tab navigation.
2. THE Live_Bottom_Sheet SHALL be rendered as a sibling overlay within the Tab_Navigator layout component, not as a separate route.
3. WHEN Live_Bottom_Sheet is not visible, THE Live_Bottom_Sheet component SHALL not be mounted or SHALL be hidden with `display: 'none'` to avoid unnecessary renders.
4. THE Create_Event_Tab screen (`create-event`) SHALL remain accessible via the secondary action and SHALL NOT be removed from the Tab_Navigator route configuration.
