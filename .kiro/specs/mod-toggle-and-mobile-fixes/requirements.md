# Requirements Document

## Introduction

This feature adds a global toggle to enable/disable mod presets and fixes a mobile layout issue where credits overflow beyond the screen boundary. The mod toggle allows users to experiment with custom settings (temperature, prefill, thinking, top_p, etc.) without interference from mod presets.

## Glossary

- **Mod_System**: The model preset system that applies predefined configurations (Claude, GPT, Gemini, etc.) with specific settings and toggle states
- **Mod_Toggle**: A UI control that enables or disables the entire mod preset system
- **Settings**: Configuration parameters including temperature, frequency_penalty, presence_penalty, top_p, and prompt toggles
- **Credits_Modal**: The modal dialog displaying project credits and author information
- **Mobile_Viewport**: The display area on mobile devices with constrained width

## Requirements

### Requirement 1: Mod Toggle Control

**User Story:** As a user, I want to disable mod presets globally, so that I can experiment with custom settings without mod interference.

#### Acceptance Criteria

1. WHEN the mod toggle is disabled, THE Mod_System SHALL NOT apply any model preset settings to the active preset
2. WHEN the mod toggle is disabled, THE Mod_System SHALL preserve user-configured temperature, frequency_penalty, presence_penalty, and top_p values
3. WHEN the mod toggle is disabled, THE Mod_System SHALL NOT modify prompt toggle states during sync operations
4. WHEN the mod toggle is enabled, THE Mod_System SHALL apply the selected model preset settings normally
5. WHEN the user changes the mod toggle state, THE System SHALL persist the toggle state across sessions
6. WHEN the mod toggle is disabled, THE UI SHALL provide visual feedback indicating mods are inactive

### Requirement 2: Mod Toggle UI Integration

**User Story:** As a user, I want clear visual indication of mod toggle state, so that I understand whether mods are active or inactive.

#### Acceptance Criteria

1. THE System SHALL display a mod toggle control in the settings interface
2. WHEN mods are enabled, THE UI SHALL display the toggle in an active state with appropriate styling
3. WHEN mods are disabled, THE UI SHALL display the toggle in an inactive state with distinct styling
4. THE System SHALL position the mod toggle control near the model preset buttons for logical grouping
5. WHEN the user hovers over the mod toggle, THE System SHALL display a tooltip explaining its function

### Requirement 3: Settings Preservation

**User Story:** As a user, I want my custom settings preserved when mods are disabled, so that I can experiment without losing my configurations.

#### Acceptance Criteria

1. WHEN mods are disabled and sync is triggered, THE System SHALL skip applying model preset temperature values
2. WHEN mods are disabled and sync is triggered, THE System SHALL skip applying model preset frequency_penalty values
3. WHEN mods are disabled and sync is triggered, THE System SHALL skip applying model preset presence_penalty values
4. WHEN mods are disabled and sync is triggered, THE System SHALL skip applying model preset top_p values
5. WHEN mods are disabled and sync is triggered, THE System SHALL skip modifying prompt toggle enabled states
6. WHEN mods are re-enabled, THE System SHALL apply the currently selected model preset settings

### Requirement 4: Mobile Credits Display Fix

**User Story:** As a mobile user, I want the credits modal to display correctly, so that I can read all content without horizontal scrolling.

#### Acceptance Criteria

1. WHEN the credits modal is displayed on mobile devices, THE System SHALL constrain content width to the viewport
2. WHEN the credits modal contains long text or links, THE System SHALL wrap content to prevent horizontal overflow
3. WHEN the credits modal is displayed on mobile devices, THE System SHALL maintain readability with appropriate font sizes
4. WHEN the credits modal is displayed on mobile devices, THE System SHALL ensure all interactive elements remain accessible
5. THE System SHALL apply responsive styling using CSS media queries for mobile viewports

### Requirement 5: Backward Compatibility

**User Story:** As an existing user, I want the extension to work normally after the update, so that my current workflow is not disrupted.

#### Acceptance Criteria

1. WHEN the extension loads for existing users, THE System SHALL default the mod toggle to enabled state
2. WHEN existing configurations are loaded, THE System SHALL preserve all existing settings and preferences
3. WHEN the sync operation runs with mods enabled, THE System SHALL behave identically to the previous version
4. THE System SHALL maintain compatibility with all existing model presets (Claude, GPT, Gemini, DeepSeek)
5. THE System SHALL preserve all existing regex pack configurations and toggle states
