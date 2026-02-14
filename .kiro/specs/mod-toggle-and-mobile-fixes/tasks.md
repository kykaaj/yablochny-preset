# Implementation Plan: Mod Toggle and Mobile Fixes

## Overview

This implementation adds a global mod toggle control to enable/disable model preset application and fixes mobile layout issues in the credits modal. The approach minimizes code changes by adding conditional logic to existing sync functions and applying responsive CSS for mobile viewports.

## Tasks

- [x] 1. Add mod toggle configuration support
  - Extend `getConfig()` function to include `modsEnabled` property with default value `true`
  - Add backfill logic for existing configurations to ensure backward compatibility
  - _Requirements: 5.1, 5.2_

- [ ] 2. Implement mod toggle UI control
  - [x] 2.1 Add mod toggle HTML to settings interface
    - Insert checkbox control and label after model preset buttons section
    - Add descriptive text explaining mod toggle functionality
    - Position control logically near model preset buttons
    - _Requirements: 2.1, 2.4_
  
  - [x] 2.2 Implement mod toggle event handler
    - Bind change event to update configuration
    - Add visual feedback by toggling "disabled" class on model preset buttons
    - Persist state using `saveSettingsDebounced()`
    - _Requirements: 1.5, 2.2, 2.3_
  
  - [x] 2.3 Initialize mod toggle UI state on load
    - Set checkbox checked state based on configuration
    - Apply initial disabled class to model preset buttons if mods disabled
    - _Requirements: 1.6, 2.2, 2.3_
  
  - [x] 2.4 Write property test for mod toggle UI state
    - **Property 5: UI State Reflects Configuration**
    - **Validates: Requirements 1.6, 2.2, 2.3**

- [ ] 3. Modify sync logic to respect mod toggle
  - [x] 3.1 Update `applyModelPreset()` function
    - Add early return when `modsEnabled` is false
    - Update UI state (active button) but skip settings application
    - Preserve model preset selection in configuration
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 3.2 Update `syncPreset()` function
    - Add conditional check before calling `applyModelPreset()`
    - Only apply model preset settings when `modsEnabled` is true
    - Ensure sync completes normally for other operations (variants, things, regex)
    - _Requirements: 1.1, 1.4_
  
  - [ ] 3.3 Write property test for settings preservation
    - **Property 1: Settings Preservation When Mods Disabled**
    - **Validates: Requirements 1.2, 3.1, 3.2, 3.3, 3.4**
  
  - [ ] 3.4 Write property test for toggle states preservation
    - **Property 2: Toggle States Preservation When Mods Disabled**
    - **Validates: Requirements 1.3, 3.5**
  
  - [ ] 3.5 Write property test for settings application when enabled
    - **Property 3: Settings Application When Mods Enabled**
    - **Validates: Requirements 1.4**

- [ ] 4. Checkpoint - Ensure mod toggle functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement mobile credits modal fixes
  - [ ] 5.1 Add responsive CSS for mobile viewports
    - Add media query for max-width 768px
    - Constrain modal width to 95vw
    - Apply word-break and overflow-wrap to prevent text overflow
    - Reduce padding and font sizes for mobile
    - _Requirements: 4.1, 4.2, 4.5_
  
  - [ ] 5.2 Fix info links layout on mobile
    - Make info links flex-wrap for mobile
    - Set links to full width on small screens
    - Ensure links remain accessible and clickable
    - _Requirements: 4.4_
  
  - [ ] 5.3 Write property test for mobile modal width
    - **Property 7: Mobile Modal Width Constraint**
    - **Validates: Requirements 4.1**
  
  - [ ] 5.4 Write property test for content wrapping
    - **Property 8: Content Wrapping Prevents Overflow**
    - **Validates: Requirements 4.2**
  
  - [ ] 5.5 Write unit tests for mobile layout
    - Test modal width at common breakpoints (320px, 375px, 768px)
    - Test content wrapping with long URLs
    - Test interactive element accessibility
    - _Requirements: 4.1, 4.2, 4.4_

- [ ] 6. Add localization for mod toggle
  - [ ] 6.1 Add UI text to localization dictionaries
    - Add "modsEnabled" label to UI_TEXT for en, ru, uk
    - Add descriptive text for mod toggle functionality
    - _Requirements: 2.1_
  
  - [ ] 6.2 Apply localized text in UI
    - Update `applyLocaleToUi()` to set mod toggle label
    - Update `initControls()` to apply localized description
    - _Requirements: 2.1_

- [ ] 7. Implement backward compatibility tests
  - [ ] 7.1 Write property test for toggle state persistence
    - **Property 4: Mod Toggle State Persistence**
    - **Validates: Requirements 1.5**
  
  - [ ] 7.2 Write property test for mod re-enablement
    - **Property 6: Mod Re-enablement Restores Behavior**
    - **Validates: Requirements 3.6**
  
  - [ ] 7.3 Write property test for model preset compatibility
    - **Property 10: Model Preset Compatibility**
    - **Validates: Requirements 5.4**
  
  - [ ] 7.4 Write property test for regex preservation
    - **Property 11: Regex Configuration Preservation**
    - **Validates: Requirements 5.5**
  
  - [ ] 7.5 Write unit test for default initialization
    - Test that modsEnabled defaults to true for new users
    - Test that existing configs without modsEnabled get backfilled
    - _Requirements: 5.1_

- [ ] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (100+ iterations each)
- Unit tests validate specific examples and edge cases
- All code changes are in `index.js`, `settings.html`, and `style.css`
- Backward compatibility is critical - existing users should see no disruption
