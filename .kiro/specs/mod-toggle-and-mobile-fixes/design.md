# Design Document: Mod Toggle and Mobile Fixes

## Overview

This design implements a global mod toggle control that allows users to disable the model preset system, preventing automatic application of preset settings (temperature, penalties, top_p, and prompt toggles) during sync operations. Additionally, it fixes mobile layout issues in the credits modal to prevent content overflow.

The implementation focuses on minimal code changes to the existing `index.js` and `style.css` files, adding configuration state management and conditional logic in the sync flow.

## Architecture

### Component Structure

```
Yablochny Extension
├── Configuration Layer
│   ├── getConfig() - Extended with modsEnabled flag
│   └── saveSettingsDebounced() - Persists mod toggle state
├── UI Layer
│   ├── Mod Toggle Control (new)
│   ├── Model Preset Buttons (existing)
│   └── Credits Modal (modified for mobile)
├── Sync Layer
│   ├── syncPreset() - Modified to respect mod toggle
│   ├── applyModelPreset() - Conditional execution
│   └── buildMasterWithVariants() - Unchanged
└── Style Layer
    └── Mobile-responsive CSS for credits modal
```

### Data Flow

1. User toggles mod control → Update config.modsEnabled
2. User clicks sync → Check config.modsEnabled
3. If enabled → Apply model preset settings normally
4. If disabled → Skip settings application, preserve user values
5. Persist toggle state → extension_settings storage

## Components and Interfaces

### Configuration Extension

**Location:** `index.js` - `getConfig()` function

**New Property:**
```javascript
{
  modsEnabled: boolean  // Default: true for backward compatibility
}
```

**Interface:**
```javascript
function getConfig() {
  // ... existing code ...
  cfg.modsEnabled ??= true;  // Backfill for existing users
  return cfg;
}
```

### Mod Toggle UI Component

**Location:** `settings.html` - After model preset buttons

**HTML Structure:**
```html
<div class="yablochny-row" style="margin-top: 10px;">
  <div class="yablochny-field">
    <div class="yablochny-inline">
      <input type="checkbox" id="yp-mods-enabled">
      <label for="yp-mods-enabled" id="yp-mods-label">Enable mod presets</label>
    </div>
    <div class="yablochny-desc" id="yp-mods-desc" style="margin-top: 4px; font-size: 11px;">
      When disabled, sync will not apply model preset settings (temperature, penalties, toggles)
    </div>
  </div>
</div>
```

**Event Handler:**
```javascript
jQuery("#yp-mods-enabled").on("change", function() {
  const cfg = getConfig();
  cfg.modsEnabled = jQuery(this).is(":checked");
  saveSettingsDebounced();
  
  // Visual feedback
  if (cfg.modsEnabled) {
    jQuery(".yp-model-btn").removeClass("disabled");
  } else {
    jQuery(".yp-model-btn").addClass("disabled");
  }
});
```

### Modified Sync Logic

**Location:** `index.js` - `applyModelPreset()` function

**Conditional Execution:**
```javascript
function applyModelPreset(presetId) {
  const cfg = getConfig();
  
  // Early return if mods disabled
  if (!cfg.modsEnabled) {
    jQuery(".yp-model-btn").removeClass("active");
    jQuery(`.yp-model-btn[data-preset-id="${presetId}"]`).addClass("active");
    cfg.modelPreset = presetId;
    saveSettingsDebounced();
    return true;  // Update UI only, skip settings application
  }
  
  // ... existing preset application logic ...
}
```

**Location:** `index.js` - `syncPreset()` function

**Skip Settings Application:**
```javascript
async function syncPreset(showToasts = true) {
  try {
    const cfg = getConfig();
    
    // ... existing code to build master preset ...
    
    // Only apply model preset if mods enabled
    if (cfg.modsEnabled && cfg.modelPreset) {
      applyModelPreset(cfg.modelPreset);
    }
    
    // ... rest of sync logic ...
  } catch (err) {
    // ... error handling ...
  }
}
```

### Mobile Credits Modal Fix

**Location:** `style.css`

**Responsive Styles:**
```css
/* Mobile-specific credits modal fixes */
@media (max-width: 768px) {
  #yp-credits-modal > div {
    max-width: 95vw !important;
    width: 95vw !important;
    padding: 15px !important;
    margin: 0 auto;
    box-sizing: border-box;
  }
  
  #yp-credits-modal a,
  #yp-credits-modal span {
    word-break: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }
  
  #yp-credits-modal .yablochny-info-link {
    font-size: 11px;
    padding: 6px 8px;
  }
  
  /* Ensure flex containers don't overflow */
  #yp-credits-modal > div > div {
    max-width: 100%;
    overflow-x: hidden;
  }
}
```

**Additional Mobile Fixes:**
```css
/* Prevent horizontal scroll on mobile */
@media (max-width: 768px) {
  .yablochny-info-links {
    flex-wrap: wrap;
  }
  
  .yablochny-info-link {
    flex: 1 1 100%;
    min-width: 0;
  }
}
```

## Data Models

### Extended Configuration Schema

```javascript
{
  // Existing fields
  presetName: string,
  autoSyncOnStart: boolean,
  languageMode: string,
  lengthMode: string,
  POVMode: string,
  TENSEMode: string,
  proseStyle: string,
  speechStyle: string,
  htmlTheme: string,
  imageMode: string,
  promptSyncMeta: object,
  lastSync: string | null,
  regexActive: boolean,
  regexEnabled: string[],
  thingsSelected: object,
  devMode: boolean,
  modelPreset: string,
  
  // New field
  modsEnabled: boolean  // Default: true
}
```

### UI State Model

```javascript
{
  modsEnabled: boolean,           // Mod toggle state
  modelPresetButtons: {
    disabled: boolean,            // Visual state when mods disabled
    activePreset: string | null   // Currently selected preset ID
  }
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Settings Preservation When Mods Disabled

*For any* valid preset configuration with user-defined temperature, frequency_penalty, presence_penalty, and top_p values, when mods are disabled and sync is triggered, all four setting values should remain unchanged from their pre-sync values.

**Validates: Requirements 1.2, 3.1, 3.2, 3.3, 3.4**

### Property 2: Toggle States Preservation When Mods Disabled

*For any* preset with a set of prompt toggle states (enabled/disabled), when mods are disabled and sync is triggered, all toggle enabled states should remain unchanged from their pre-sync values.

**Validates: Requirements 1.3, 3.5**

### Property 3: Settings Application When Mods Enabled

*For any* model preset (Claude, GPT, Gemini, DeepSeek), when mods are enabled and that preset is applied, the resulting configuration should match the preset's defined temperature, frequency_penalty, presence_penalty, and top_p values.

**Validates: Requirements 1.4**

### Property 4: Mod Toggle State Persistence

*For any* boolean mod toggle state (enabled or disabled), when the state is saved to configuration and the configuration is reloaded, the retrieved mod toggle state should equal the originally saved state.

**Validates: Requirements 1.5**

### Property 5: UI State Reflects Configuration

*For any* mod toggle configuration state (enabled or disabled), the UI checkbox element should be checked if and only if the configuration modsEnabled value is true, and the model preset buttons should have the "disabled" CSS class if and only if modsEnabled is false.

**Validates: Requirements 1.6, 2.2, 2.3**

### Property 6: Mod Re-enablement Restores Behavior

*For any* model preset, when mods are disabled, then re-enabled, then sync is triggered, the resulting settings should match the preset's defined values (equivalent to never having disabled mods).

**Validates: Requirements 3.6**

### Property 7: Mobile Modal Width Constraint

*For any* mobile viewport width (320px to 768px), when the credits modal is displayed, the modal container width should not exceed 95% of the viewport width.

**Validates: Requirements 4.1**

### Property 8: Content Wrapping Prevents Overflow

*For any* text content or link in the credits modal, when displayed on a mobile viewport, the content should wrap to multiple lines rather than causing horizontal scrollbar to appear.

**Validates: Requirements 4.2**

### Property 9: Mobile Interactive Elements Accessibility

*For any* interactive element (button, link) in the credits modal on mobile viewports, the element should be fully visible within the viewport bounds and not clipped or obscured.

**Validates: Requirements 4.4**

### Property 10: Model Preset Compatibility

*For any* existing model preset (Claude, GPT −COT, GPT +COT, DeepSeek −COT, DeepSeek +COT, Gemini), when mods are enabled and the preset is applied, the preset should successfully apply its settings and toggle configurations without errors.

**Validates: Requirements 5.4**

### Property 11: Regex Configuration Preservation

*For any* existing regex pack configuration (enabled packs, active state), after the mod toggle feature is added, the regex configuration should remain identical to its pre-update state.

**Validates: Requirements 5.5**

## Error Handling

### Mod Toggle Errors

**Missing Configuration:**
- If `modsEnabled` is undefined in loaded config, default to `true`
- Log warning if config structure is corrupted
- Gracefully degrade to enabled state for safety

**Sync Failures:**
- If sync fails with mods disabled, preserve user settings
- Display error toast with clear message
- Do not revert mod toggle state on sync failure

**UI State Desync:**
- If UI checkbox state doesn't match config, prioritize config value
- Re-sync UI state on page load
- Log warning if desync detected

### Mobile Layout Errors

**Viewport Detection:**
- Use standard media query breakpoint (768px)
- Fallback to desktop styles if media query unsupported
- Test on common mobile devices (iOS Safari, Chrome Android)

**Content Overflow:**
- Apply `overflow-x: hidden` as safety net
- Use `word-break: break-word` for long URLs
- Ensure `box-sizing: border-box` for all modal elements

**Modal Rendering:**
- Verify modal displays correctly on orientation change
- Handle edge cases (very small screens <320px)
- Ensure modal remains scrollable if content exceeds height

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of mod toggle state changes
- Edge cases (missing config, corrupted data)
- Integration between UI and configuration
- Mobile viewport breakpoints (320px, 375px, 768px)

**Property Tests** focus on:
- Universal properties across all setting combinations
- Settings preservation across random configurations
- UI state consistency across all toggle states
- Modal layout correctness across viewport range

### Property-Based Testing Configuration

**Library:** Use `fast-check` for JavaScript property-based testing

**Test Configuration:**
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: mod-toggle-and-mobile-fixes, Property {number}: {property_text}`

**Generator Strategies:**

1. **Settings Generator:**
```javascript
fc.record({
  temperature: fc.double({ min: 0, max: 2 }),
  frequency_penalty: fc.double({ min: 0, max: 2 }),
  presence_penalty: fc.double({ min: 0, max: 2 }),
  top_p: fc.double({ min: 0, max: 1 })
})
```

2. **Toggle States Generator:**
```javascript
fc.array(
  fc.record({
    identifier: fc.string(),
    enabled: fc.boolean()
  }),
  { minLength: 1, maxLength: 20 }
)
```

3. **Viewport Width Generator:**
```javascript
fc.integer({ min: 320, max: 768 })
```

### Unit Test Coverage

**Mod Toggle Tests:**
- Test default value initialization (modsEnabled = true)
- Test toggle state persistence
- Test UI checkbox binding
- Test model preset button disabled state
- Test sync behavior with mods enabled/disabled

**Mobile Layout Tests:**
- Test modal width at 320px, 375px, 414px, 768px
- Test content wrapping with long URLs
- Test interactive element positioning
- Test orientation change handling

**Integration Tests:**
- Test complete sync flow with mods disabled
- Test preset switching with mods enabled/disabled
- Test configuration migration for existing users
- Test regex pack preservation

### Test Execution

**Property Tests:**
- Run with `npm test` or equivalent
- Each property test runs 100+ iterations
- Failures include counterexample from fast-check
- Tests tagged with property number for traceability

**Unit Tests:**
- Run alongside property tests
- Focus on specific scenarios and edge cases
- Mock DOM elements for UI tests
- Use jsdom or similar for browser environment

**Manual Testing:**
- Test on real mobile devices (iOS, Android)
- Verify credits modal on various screen sizes
- Test mod toggle with all model presets
- Verify backward compatibility with existing configs
