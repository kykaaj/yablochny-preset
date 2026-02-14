# AI MAINTENANCE PROTOCOL

## ⚠️ CRITICAL: How to Update This Extension

When the user asks to **update**, **push**, **sync**, or **fix** changes, you MUST follow this strict protocol to avoid reverting user settings or breaking functionality.

### 1. The "Hardcoded Variants" Trap
The extension uses `index.js` to dynamically inject prompts based on settings. These prompts are **HARDCODED** in `index.js` as constants.
**Crucial:** If you only update the `.json` preset file, **the extension will overwrite the user's changes** with the old hardcoded text from `index.js` when they use the toggles.

**MANDATORY SYNC ACTION:**
If `🍎 Yablochny Preset.json` is modified (specifically the content of system prompts), you MUST update the corresponding constant in `index.js`.

**Mapping Table:**
| Preset Prompt Identifier/Name | `index.js` Constant | Notes |
|-------------------|-------------------|-------|
| `deconstruction` | `DECONSTRUCTION_VARIANTS` | Check `large` (default) and `mini` keys. |
| `focus` | `FOCUS_VARIANTS` | Check `dialogues`, `details`. |
| `word_count` | `LENGTH_VARIANTS` | Logic is complex here, check carefully. |
| `pov` | `POV_VARIANTS` | 1st/2nd/3rd person. |
| `tense` | `TENSE_VARIANTS` | Present/Past/Future. |
| `speech_style` | `SPEECH_VARIANTS` | Salinger, Pratchett, etc. |
| `prose_style` | `PROSE_VARIANTS` | AO3, Writers, etc. |
| `html theme` | `HTML_THEME` | Dark/Light. |
| `image generation` | `IMAGE_VARIANTS` | Silly, Grok, etc. |
| `extras lang` | `LANGUAGE_VARIANTS` | Russian, English, Ukrainian. |

### 2. Prompt Naming Convention
- Any prompt in `🍎 Yablochny Preset.json` that is dynamically controlled by the extension MUST have `(change)` at the end of its name.
- Example: `"name": "┌︎ ◈︎ deconstruction (change)"`
- This helps the user identify which prompts will be overwritten by the extension.

### 3. Versioning & Release
1.  **Bump Version**: Increment `version` in `manifest.json` (e.g., `1.9.3` -> `1.9.4`).
2.  **Commit**: `git add . && git commit -m "Update: [Description]"`
3.  **Push**: `git push`

### 4. Handling Toggles (Enabled/Disabled States)
If the user modifies which prompts are enabled/disabled (not the content, but the checkboxes), these changes MUST be reflected in `🍎 Yablochny Preset.json`.
- **Command:** If the user is running locally and wants to sync their current settings to the repo, ALWAYS run `node tools/sync_from_user.cjs` first. This script pulls the `enabled: true/false` states from their active user preset into the repository file.
- **Verification:** After running the sync script, check `git diff` to confirm that the `enabled` flags in `🍎 Yablochny Preset.json` match the user's intent.
- **Why?** The extension applies default states on load. If the user wants a new default (e.g., "Roleplay Mode" enabled by default), the JSON in the repo must have `"enabled": true`.

### 5. Standard Command
If the user says `/update`, `/push`, or "Run update protocol":
1.  **Sync Local Changes:** Run `node tools/sync_from_user.cjs` to pull the latest toggle states and content from the user's active preset.
2.  **Verify & Fix Variants:** Read `🍎 Yablochny Preset.json` and `index.js`. Compare the content of dynamic prompts (Deconstruction, Focus, etc.). If the JSON has newer text than the JS constant, UPDATE `index.js` to match.
3.  **Bump Version:** Increment version in `manifest.json`.
4.  **Commit & Push:** `git add . && git commit -m "Update: Synced user settings and bumped version" && git push`
